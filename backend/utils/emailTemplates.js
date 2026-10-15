/* =========================================================
   EMAIL TEMPLATES  (VINEORA wine theme)

   Emails cannot use your website's CSS or fonts, so everything
   is inline and built with tables. Georgia (serif) is used for
   headings because it is available on nearly every device.
   Every template returns { subject, html, text }.
   ========================================================= */

const { getSiteUrl } = require("./mailService");

const COLORS = {
  dark: "#241311",
  burgundy: "#351716",
  gold: "#c9a45c",
  goldDark: "#7a5a1c",
  cream: "#f3e8d7",
  card: "#fbf6ee",
  text: "#351716",
  muted: "#6c5850",
};

const BRAND = process.env.MAIL_FROM_NAME || "VINEORA";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
};

/* ---------- shared pieces ---------- */

const button = (label, url) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td style="background:${COLORS.burgundy};border:1px solid ${COLORS.gold};">
        <a href="${escapeHtml(url)}"
           style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${COLORS.cream};text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;

const layout = ({ preheader = "", title, bodyHtml }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.cream};">
  <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;color:transparent;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.cream};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">

          <tr>
            <td align="center" style="background:${COLORS.dark};padding:30px 20px;border-bottom:2px solid ${COLORS.gold};">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:8px;color:${COLORS.cream};font-weight:bold;">${escapeHtml(BRAND)}</span>
            </td>
          </tr>

          <tr>
            <td style="background:${COLORS.card};padding:38px 34px;border-left:1px solid #e5d8c3;border-right:1px solid #e5d8c3;">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td align="center" style="background:${COLORS.dark};padding:22px 20px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#cdbda9;">
                ${escapeHtml(BRAND)} &middot; Exceptional wines. Beautifully crafted.<br>
                This is an automated message, please do not reply to it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const heading = (text) =>
  `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.25;font-weight:normal;color:${COLORS.text};">${escapeHtml(text)}</h1>`;

const paragraph = (text) =>
  `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:${COLORS.muted};">${escapeHtml(text)}</p>`;

const small = (html) =>
  `<p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${COLORS.muted};">${html}</p>`;

/* =========================================================
   1. PASSWORD RESET
========================================================= */

const passwordResetEmail = ({ firstName, resetUrl, expiresMinutes = 30 }) => {
  const name = firstName || "there";

  const bodyHtml = `
    ${heading(`Reset your password`)}
    ${paragraph(`Hello ${name},`)}
    ${paragraph(`We received a request to reset the password for your ${BRAND} account. Use the button below to choose a new password.`)}
    ${button("Reset Password", resetUrl)}
    ${small(`This link works for ${expiresMinutes} minutes and can only be used once.<br>If the button does not work, copy this address into your browser:<br><a href="${escapeHtml(resetUrl)}" style="color:${COLORS.goldDark};word-break:break-all;">${escapeHtml(resetUrl)}</a>`)}
    ${small(`If you did not ask for this, you can safely ignore this email. Your password will not change.`)}
  `;

  return {
    subject: `Reset your ${BRAND} password`,
    html: layout({
      title: "Reset your password",
      preheader: `Use this link within ${expiresMinutes} minutes to choose a new password.`,
      bodyHtml,
    }),
    text:
      `Hello ${name},\n\n` +
      `We received a request to reset the password for your ${BRAND} account.\n` +
      `Open this link to choose a new password (valid for ${expiresMinutes} minutes, one use):\n\n` +
      `${resetUrl}\n\n` +
      `If you did not ask for this, ignore this email. Your password will not change.\n`,
  };
};

/* =========================================================
   2. PASSWORD CHANGED
========================================================= */

const passwordChangedEmail = ({ firstName }) => {
  const name = firstName || "there";
  const loginUrl = `${getSiteUrl()}/login`;

  const bodyHtml = `
    ${heading("Your password was changed")}
    ${paragraph(`Hello ${name},`)}
    ${paragraph(`The password for your ${BRAND} account was just changed. You can now sign in with your new password.`)}
    ${button("Sign In", loginUrl)}
    ${small(`If this was not you, reset your password again straight away and contact us.`)}
  `;

  return {
    subject: `Your ${BRAND} password was changed`,
    html: layout({
      title: "Password changed",
      preheader: "Your password was changed successfully.",
      bodyHtml,
    }),
    text:
      `Hello ${name},\n\nThe password for your ${BRAND} account was just changed.\n` +
      `Sign in: ${loginUrl}\n\n` +
      `If this was not you, reset your password again straight away and contact us.\n`,
  };
};

/* =========================================================
   3. WELCOME
========================================================= */

const welcomeEmail = ({ firstName }) => {
  const name = firstName || "there";
  const shopUrl = `${getSiteUrl()}/shop`;

  const bodyHtml = `
    ${heading(`Welcome to ${BRAND}`)}
    ${paragraph(`Hello ${name},`)}
    ${paragraph(`Thank you for creating your account. Explore our curated collections of red, white, rosé and sparkling wines, and save your favourites to your wishlist.`)}
    ${button("Explore Wines", shopUrl)}
  `;

  return {
    subject: `Welcome to ${BRAND}`,
    html: layout({
      title: `Welcome to ${BRAND}`,
      preheader: "Your account is ready.",
      bodyHtml,
    }),
    text:
      `Hello ${name},\n\nThank you for creating your ${BRAND} account.\n` +
      `Explore our wines: ${shopUrl}\n`,
  };
};

/* =========================================================
   4. ORDER / NOTIFICATION EMAIL
   Used for every in-app notification (order confirmed,
   shipped, delivered, cancelled, ...). If order details are
   given they are shown as a small summary table.
========================================================= */

const notificationEmail = ({
  firstName,
  title,
  message,
  order = null,
  ctaLabel = "View Details",
  ctaUrl = null,
}) => {
  const name = firstName || "there";
  const link = ctaUrl || getSiteUrl();

  let orderHtml = "";
  let orderText = "";

  if (order) {
    const rows = (order.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5d8c3;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${COLORS.text};">
            ${escapeHtml(item.product_name)}
            <span style="color:${COLORS.muted};">${item.bottle_size ? ` &middot; ${escapeHtml(item.bottle_size)}` : ""}${item.vintage ? ` &middot; ${escapeHtml(item.vintage)}` : ""}</span>
          </td>
          <td align="center" style="padding:10px 8px;border-bottom:1px solid #e5d8c3;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${COLORS.muted};">x${escapeHtml(item.quantity)}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #e5d8c3;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${COLORS.text};">${escapeHtml(formatMoney(item.subtotal))}</td>
        </tr>`
      )
      .join("");

    orderHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;">
        <tr>
          <td colspan="3" style="padding-bottom:8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.goldDark};">
            Order ${escapeHtml(order.order_number)}
          </td>
        </tr>
        ${rows}
        <tr>
          <td colspan="2" style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:${COLORS.text};">Total</td>
          <td align="right" style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:${COLORS.text};">${escapeHtml(formatMoney(order.total_amount))}</td>
        </tr>
      </table>`;

    orderText =
      `\nOrder ${order.order_number}\n` +
      (order.items || [])
        .map(
          (item) =>
            `- ${item.product_name} x${item.quantity}  ${formatMoney(item.subtotal)}`
        )
        .join("\n") +
      `\nTotal: ${formatMoney(order.total_amount)}\n`;
  }

  const bodyHtml = `
    ${heading(title)}
    ${paragraph(`Hello ${name},`)}
    ${paragraph(message)}
    ${orderHtml}
    ${button(ctaLabel, link)}
    ${small(`You can choose which emails you receive in your account settings.`)}
  `;

  return {
    subject: order
      ? `${title} - ${order.order_number}`
      : title,
    html: layout({
      title,
      preheader: message,
      bodyHtml,
    }),
    text:
      `Hello ${name},\n\n${title}\n${message}\n${orderText}\n` +
      `${ctaLabel}: ${link}\n`,
  };
};

module.exports = {
  passwordResetEmail,
  passwordChangedEmail,
  welcomeEmail,
  notificationEmail,
  escapeHtml,
  formatMoney,
};
