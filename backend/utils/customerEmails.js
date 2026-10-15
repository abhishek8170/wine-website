/* =========================================================
   CUSTOMER EMAILS

   Everything that sends an email to a customer goes through
   this file:
     - sendWelcomeEmail           (after registration)
     - sendPasswordResetEmail     (forgot password)
     - sendPasswordChangedEmail   (after a successful reset)
     - queueNotificationEmail     (every in-app order / payment
                                   notification, e.g. "Order Confirmed")

   Nothing here may ever break the website: every function
   catches its own errors and only prints them.
   ========================================================= */

const pool = require("../config/db");
const { sendEmail, getSiteUrl } = require("./mailService");
const {
  passwordResetEmail,
  passwordChangedEmail,
  welcomeEmail,
  notificationEmail,
} = require("./emailTemplates");

/* =========================================================
   NOTIFICATION TYPE  ->  the customer's email preference
   (columns of customer_notification_preferences).
   Types that are not listed here are important messages
   (cancelled, refunded, payment failed) and always go out.
========================================================= */

const PREFERENCE_COLUMN = {
  ORDER_CONFIRMATION: "order_confirmation_email",
  PAYMENT_CONFIRMATION: "payment_confirmation_email",
  ORDER_PROCESSING: "order_processing_email",
  ORDER_PACKED: "order_packed_email",
  ORDER_SHIPPED: "order_shipped_email",
  ORDER_OUT_FOR_DELIVERY: "order_out_for_delivery_email",
  ORDER_DELIVERED: "order_delivered_email",
  PROMOTIONAL_OFFER: "promotional_offer_email",
  PRICE_CHANGE: "price_change_email",
  BACK_IN_STOCK: "back_in_stock_email",
};

// marketing style emails are OFF unless the customer switched them on
const OFF_BY_DEFAULT = new Set([
  "PROMOTIONAL_OFFER",
  "PRICE_CHANGE",
  "BACK_IN_STOCK",
]);

const RESET_EMAILS_PER_HOUR = 3;

/* =========================================================
   LOGGING (never throws)
========================================================= */

const logEmail = async ({
  customerId = null,
  notificationId = null,
  emailType,
  to,
  subject = null,
  status,
  messageId = null,
  error = null,
}) => {
  try {
    await pool.query(
      `
      INSERT INTO email_logs (
        customer_id,
        notification_id,
        email_type,
        to_email,
        subject,
        status,
        provider_message_id,
        error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        customerId,
        notificationId,
        emailType,
        to,
        subject,
        status,
        messageId,
        error,
      ]
    );
  } catch (logError) {
    console.warn(
      "Could not write to email_logs (did you run sql/email_logs.sql?):",
      logError.message
    );
  }
};

const countRecent = async (customerId, emailType, minutes) => {
  try {
    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM email_logs
      WHERE customer_id = $1
        AND email_type = $2
        AND status = 'sent'
        AND created_at > NOW() - ($3 || ' minutes')::interval
      `,
      [customerId, emailType, String(minutes)]
    );

    return result.rows[0]?.total || 0;
  } catch (error) {
    return 0;
  }
};

/* One place that sends + logs */

const deliver = async ({
  customerId,
  notificationId = null,
  emailType,
  to,
  toName,
  mail,
}) => {
  const result = await sendEmail({
    to,
    toName,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  await logEmail({
    customerId,
    notificationId,
    emailType,
    to,
    subject: mail.subject,
    status: result.sent
      ? "sent"
      : result.skipped
      ? "skipped"
      : "failed",
    messageId: result.messageId,
    error: result.skipped
      ? "Mail not configured (printed in terminal)"
      : result.error || null,
  });

  return result;
};

const fullName = (customer) =>
  [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ");

/* =========================================================
   WELCOME
========================================================= */

const sendWelcomeEmail = async (customer) => {
  try {
    if (!customer?.email) return;

    await deliver({
      customerId: customer.id,
      emailType: "WELCOME",
      to: customer.email,
      toName: fullName(customer),
      mail: welcomeEmail({ firstName: customer.first_name }),
    });
  } catch (error) {
    console.error("Welcome email error:", error);
  }
};

/* =========================================================
   PASSWORD RESET
========================================================= */

const sendPasswordResetEmail = async ({
  customer,
  resetToken,
  expiresMinutes = 30,
}) => {
  try {
    if (!customer?.email) return;

    // protects your daily email allowance from being used up
    const recent = await countRecent(
      customer.id,
      "PASSWORD_RESET",
      60
    );

    if (recent >= RESET_EMAILS_PER_HOUR) {
      await logEmail({
        customerId: customer.id,
        emailType: "PASSWORD_RESET",
        to: customer.email,
        status: "skipped",
        error: "Rate limited (too many reset emails this hour)",
      });

      return;
    }

    const resetUrl = `${getSiteUrl()}/reset-password?token=${resetToken}`;

    await deliver({
      customerId: customer.id,
      emailType: "PASSWORD_RESET",
      to: customer.email,
      toName: fullName(customer),
      mail: passwordResetEmail({
        firstName: customer.first_name,
        resetUrl,
        expiresMinutes,
      }),
    });
  } catch (error) {
    console.error("Password reset email error:", error);
  }
};

/* =========================================================
   PASSWORD CHANGED
========================================================= */

const sendPasswordChangedEmail = async (customerId) => {
  try {
    const result = await pool.query(
      `
      SELECT id, first_name, last_name, email
      FROM customers
      WHERE id = $1
      LIMIT 1
      `,
      [customerId]
    );

    const customer = result.rows[0];

    if (!customer?.email) return;

    await deliver({
      customerId: customer.id,
      emailType: "PASSWORD_CHANGED",
      to: customer.email,
      toName: fullName(customer),
      mail: passwordChangedEmail({
        firstName: customer.first_name,
      }),
    });
  } catch (error) {
    console.error("Password changed email error:", error);
  }
};

/* =========================================================
   IN-APP NOTIFICATION  ->  EMAIL

   createCustomerNotification() runs INSIDE a database
   transaction. If we emailed right away and the transaction
   later failed, the customer would get an email about an
   order that does not exist. So we wait a moment, then check
   (from a separate connection) that the notification really
   was saved before sending.
========================================================= */

const wantsEmail = async (customerId, type) => {
  const column = PREFERENCE_COLUMN[type];

  // important messages (cancelled, refunded, payment failed)
  if (!column) return true;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM customer_notification_preferences
      WHERE customer_id = $1
      LIMIT 1
      `,
      [customerId]
    );

    const row = result.rows[0];

    if (!row || row[column] === null || row[column] === undefined) {
      return !OFF_BY_DEFAULT.has(type);
    }

    return row[column] === true;
  } catch (error) {
    // if preferences cannot be read, use the safe default
    return !OFF_BY_DEFAULT.has(type);
  }
};

const loadOrderForEmail = async (orderId, customerId) => {
  try {
    const orderResult = await pool.query(
      `
      SELECT id, order_number, total_amount
      FROM orders
      WHERE id = $1
        AND customer_id = $2
      LIMIT 1
      `,
      [orderId, customerId]
    );

    const order = orderResult.rows[0];

    if (!order) return null;

    let items = [];

    try {
      const itemResult = await pool.query(
        `
        SELECT
          product_name,
          bottle_size,
          vintage,
          quantity,
          subtotal
        FROM order_items
        WHERE order_id = $1
        `,
        [orderId]
      );

      items = itemResult.rows;
    } catch (itemError) {
      items = [];
    }

    return { ...order, items };
  } catch (error) {
    return null;
  }
};

// returns "retry" if the notification is not visible yet
const processNotificationEmail = async (notification) => {
  const saved = await pool.query(
    "SELECT id FROM customer_notifications WHERE id = $1",
    [notification.id]
  );

  if (saved.rows.length === 0) return "retry";

  // never send twice for the same notification
  try {
    const already = await pool.query(
      `
      SELECT 1
      FROM email_logs
      WHERE notification_id = $1
        AND status IN ('sent', 'skipped')
      LIMIT 1
      `,
      [notification.id]
    );

    if (already.rows.length > 0) return "done";
  } catch (error) {
    // table missing: carry on, the log helper prints a hint
  }

  const customerResult = await pool.query(
    `
    SELECT id, first_name, last_name, email, is_active
    FROM customers
    WHERE id = $1
    LIMIT 1
    `,
    [notification.customer_id]
  );

  const customer = customerResult.rows[0];

  if (!customer || !customer.email || customer.is_active === false) {
    return "done";
  }

  if (!(await wantsEmail(customer.id, notification.type))) {
    await logEmail({
      customerId: customer.id,
      notificationId: notification.id,
      emailType: notification.type,
      to: customer.email,
      status: "skipped",
      error: "Customer turned this email off in preferences",
    });

    return "done";
  }

  const siteUrl = getSiteUrl();
  const isOrder = notification.entity_type === "ORDER";

  const order = isOrder
    ? await loadOrderForEmail(notification.entity_id, customer.id)
    : null;

  const mail = notificationEmail({
    firstName: customer.first_name,
    title: notification.title,
    message: notification.message,
    order,
    ctaLabel: isOrder ? "View Order" : "Shop Now",
    ctaUrl: isOrder
      ? `${siteUrl}/orders/${notification.entity_id}`
      : `${siteUrl}/shop`,
  });

  await deliver({
    customerId: customer.id,
    notificationId: notification.id,
    emailType: notification.type,
    to: customer.email,
    toName: fullName(customer),
    mail,
  });

  return "done";
};

const queueNotificationEmail = (notification) => {
  if (!notification?.id || !notification?.customer_id) return;

  const attempt = (number) => {
    setTimeout(
      async () => {
        try {
          const outcome = await processNotificationEmail(
            notification
          );

          if (outcome === "retry") {
            if (number < 4) {
              attempt(number + 1);
            } else {
              console.warn(
                `Notification ${notification.id} never appeared in the database, email not sent`
              );
            }
          }
        } catch (error) {
          console.error("Notification email error:", error);
        }
      },
      number === 1 ? 2500 : 4000
    );
  };

  attempt(1);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  queueNotificationEmail,
  // exported for testing
  processNotificationEmail,
};
