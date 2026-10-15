/* =========================================================
   MAIL SERVICE  (sends email through Brevo's web API)

   Why not Gmail / SMTP?  Render's free plan blocks SMTP ports,
   so mail sent that way works on your laptop but fails live.
   Brevo's API uses normal HTTPS, which works everywhere.

   Settings (in .env locally, and in Render > Environment live):
     BREVO_API_KEY      the API key from Brevo
     MAIL_FROM_EMAIL    a sender you verified in Brevo
     MAIL_FROM_NAME     name shown to customers (default VINEORA)
     CUSTOMER_SITE_URL  address of the customer website, used in links
                        (http://localhost:5173 locally)

   If BREVO_API_KEY is missing (for example a teammate runs the
   project without keys) the email is printed in the terminal
   instead, so nothing crashes and you can still test the flow.

   sendEmail() NEVER throws. It always returns:
     { sent: true,  messageId }
     { sent: false, skipped: true }          (no key: printed instead)
     { sent: false, error: "..." }           (Brevo refused / network)
   ========================================================= */

const BREVO_URL =
  process.env.BREVO_API_URL ||
  "https://api.brevo.com/v3/smtp/email";

const TIMEOUT_MS = 12000;

const isMailConfigured = () =>
  Boolean(
    process.env.BREVO_API_KEY &&
      process.env.MAIL_FROM_EMAIL
  );

const getSiteUrl = () => {
  const raw =
    process.env.CUSTOMER_SITE_URL ||
    "http://localhost:5173";

  return String(raw).trim().replace(/\/+$/, "");
};

const sendEmail = async ({
  to,
  toName = "",
  subject,
  html,
  text = "",
}) => {
  if (!to || !subject || !html) {
    return {
      sent: false,
      error: "to, subject and html are required",
    };
  }

  /* ---------- no key: print instead of sending ---------- */

  if (!isMailConfigured()) {
    console.log(
      "\n================ EMAIL (not sent: BREVO_API_KEY / MAIL_FROM_EMAIL missing) ================"
    );
    console.log("To:     ", to);
    console.log("Subject:", subject);
    console.log("--------------------------------------------------------------------------------");
    console.log(text || "(no plain-text version)");
    console.log(
      "================================================================================\n"
    );

    return { sent: false, skipped: true };
  }

  /* ---------- send through Brevo ---------- */

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    TIMEOUT_MS
  );

  try {
    const response = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name:
            process.env.MAIL_FROM_NAME || "VINEORA",
          email: process.env.MAIL_FROM_EMAIL,
        },
        to: [
          toName
            ? { email: to, name: toName }
            : { email: to },
        ],
        subject,
        htmlContent: html,
        textContent: text || undefined,
      }),
      signal: controller.signal,
    });

    let data = {};

    try {
      data = await response.json();
    } catch (parseError) {
      data = {};
    }

    if (!response.ok) {
      const reason =
        data?.message ||
        data?.code ||
        `HTTP ${response.status}`;

      console.error(
        `Brevo refused the email (${response.status}):`,
        reason
      );

      return {
        sent: false,
        error: `Brevo ${response.status}: ${reason}`,
      };
    }

    return {
      sent: true,
      messageId: data?.messageId || null,
    };
  } catch (error) {
    const reason =
      error?.name === "AbortError"
        ? "Request to Brevo timed out"
        : error?.message || "Unknown mail error";

    console.error("Email send error:", reason);

    return { sent: false, error: reason };
  } finally {
    clearTimeout(timer);
  }
};

module.exports = {
  sendEmail,
  isMailConfigured,
  getSiteUrl,
};
