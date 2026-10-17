/* =========================================================
   ADMIN EMAILS

   Everything that sends an email to an ADMIN goes through
   this file (the customer ones live in customerEmails.js):
     - sendAdminWelcomeEmail          (a new admin account is created)
     - sendAdminPasswordResetEmail    (forgot password)
     - sendAdminPasswordChangedEmail  (password reset or changed)

   Same rules as the customer emails:
     - sent through Brevo (mailService.js)
     - every attempt is saved in email_logs
     - nothing here may ever break the admin panel: every
       function catches its own errors and only prints them
   ========================================================= */

const pool = require("../config/db");
const { sendEmail, getAdminSiteUrl } = require("./mailService");
const {
  adminWelcomeEmail,
  adminPasswordResetEmail,
  adminPasswordChangedEmail,
} = require("./emailTemplates");

const RESET_EMAILS_PER_HOUR = 3;

/* ---------- logging (never throws) ---------- */

const logEmail = async ({
  adminId = null,
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
        admin_id,
        email_type,
        to_email,
        subject,
        status,
        provider_message_id,
        error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [adminId, emailType, to, subject, status, messageId, error]
    );
  } catch (logError) {
    console.warn(
      "Could not write to email_logs (did you run sql/admin_email.sql?):",
      logError.message
    );
  }
};

const countRecent = async (adminId, emailType, minutes) => {
  try {
    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM email_logs
      WHERE admin_id = $1
        AND email_type = $2
        AND status = 'sent'
        AND created_at > NOW() - ($3 || ' minutes')::interval
      `,
      [adminId, emailType, String(minutes)]
    );

    return result.rows[0]?.total || 0;
  } catch (error) {
    return 0;
  }
};

/* ---------- one place that sends + logs ---------- */

const deliver = async ({ adminId, emailType, to, toName, mail }) => {
  const result = await sendEmail({
    to,
    toName,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  await logEmail({
    adminId,
    emailType,
    to,
    subject: mail.subject,
    status: result.sent ? "sent" : result.skipped ? "skipped" : "failed",
    messageId: result.messageId,
    error: result.skipped
      ? "Mail not configured (printed in terminal)"
      : result.error || null,
  });

  return result;
};

/* =========================================================
   WELCOME  (new admin account)
========================================================= */

const sendAdminWelcomeEmail = async (admin) => {
  try {
    if (!admin?.email) return;

    await deliver({
      adminId: admin.id,
      emailType: "ADMIN_WELCOME",
      to: admin.email,
      toName: admin.name,
      mail: adminWelcomeEmail({ name: admin.name, role: admin.role }),
    });
  } catch (error) {
    console.error("Admin welcome email error:", error);
  }
};

/* =========================================================
   FORGOT PASSWORD
========================================================= */

const sendAdminPasswordResetEmail = async ({
  admin,
  resetToken,
  expiresMinutes = 30,
}) => {
  try {
    if (!admin?.email) return;

    // protects your daily email allowance from being used up
    const recent = await countRecent(admin.id, "ADMIN_PASSWORD_RESET", 60);

    if (recent >= RESET_EMAILS_PER_HOUR) {
      await logEmail({
        adminId: admin.id,
        emailType: "ADMIN_PASSWORD_RESET",
        to: admin.email,
        status: "skipped",
        error: "Rate limited (too many reset emails this hour)",
      });

      return;
    }

    const resetUrl = `${getAdminSiteUrl()}/reset-password?token=${resetToken}`;

    await deliver({
      adminId: admin.id,
      emailType: "ADMIN_PASSWORD_RESET",
      to: admin.email,
      toName: admin.name,
      mail: adminPasswordResetEmail({
        name: admin.name,
        resetUrl,
        expiresMinutes,
      }),
    });
  } catch (error) {
    console.error("Admin password reset email error:", error);
  }
};

/* =========================================================
   PASSWORD CHANGED  (after a reset, or when changed in
   Admin Management)
========================================================= */

const sendAdminPasswordChangedEmail = async (adminId) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, email
      FROM admins
      WHERE id = $1
      LIMIT 1
      `,
      [adminId]
    );

    const admin = result.rows[0];

    if (!admin?.email) return;

    await deliver({
      adminId: admin.id,
      emailType: "ADMIN_PASSWORD_CHANGED",
      to: admin.email,
      toName: admin.name,
      mail: adminPasswordChangedEmail({ name: admin.name }),
    });
  } catch (error) {
    console.error("Admin password changed email error:", error);
  }
};

module.exports = {
  sendAdminWelcomeEmail,
  sendAdminPasswordResetEmail,
  sendAdminPasswordChangedEmail,
};
