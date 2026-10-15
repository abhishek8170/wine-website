// ============================================================
// EMAIL UPDATE - connects the new email code to your backend
// Run from the `backend` folder:
//
//     node apply-email-update.mjs --dry-run   (only checks)
//     node apply-email-update.mjs             (makes the changes)
//
// It edits two existing files:
//   controllers/notificationController.js  (email every in-app notification)
//   controllers/authController.js          (welcome, forgot-password, password-changed)
// You can run it twice; the second time it changes nothing.
// ============================================================
import fs from "fs";

const DRY = process.argv.includes("--dry-run");

const read = (file) => {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  return { text: raw.replace(/\r\n/g, "\n"), crlf };
};

const write = (file, { text, crlf }) => {
  if (!DRY) fs.writeFileSync(file, crlf ? text.replace(/\n/g, "\r\n") : text);
};

let problems = 0;
const log = (ok, msg) => {
  if (!ok) problems++;
  console.log((ok ? "  ok   " : "  FAIL ") + msg);
};

const replaceOnce = (doc, from, to, label) => {
  if (!doc.text.includes(from)) {
    log(false, label + "  (could not find the place to edit)");
    return;
  }
  doc.text = doc.text.replace(from, () => to);
  log(true, label);
};

/* ---------------------------------------------------------
   1. notificationController.js
--------------------------------------------------------- */
{
  const file = "controllers/notificationController.js";
  console.log(file);
  const doc = read(file);

  if (doc.text.includes("queueNotificationEmail")) {
    log(true, "already updated, skipped");
  } else {
    replaceOnce(
      doc,
      'const pool = require("../config/db");\n',
      'const pool = require("../config/db");\nconst {\n  queueNotificationEmail,\n} = require("../utils/customerEmails");\n',
      "import the email helper"
    );

    replaceOnce(
      doc,
      "  return result.rows[0];\n};\n\n// =====================================================\n// GET CUSTOMER NOTIFICATIONS",
      "  const notification = result.rows[0];\n\n" +
        "  // Also send this notification by email (runs in the background,\n" +
        "  // waits until the order is saved, respects the customer's preferences)\n" +
        "  queueNotificationEmail(notification);\n\n" +
        "  return notification;\n};\n\n// =====================================================\n// GET CUSTOMER NOTIFICATIONS",
      "email every in-app notification"
    );

    write(file, doc);
  }
}

/* ---------------------------------------------------------
   2. authController.js
--------------------------------------------------------- */
{
  const file = "controllers/authController.js";
  console.log(file);
  const doc = read(file);

  if (doc.text.includes("sendPasswordResetEmail")) {
    log(true, "already updated, skipped");
  } else {
    replaceOnce(
      doc,
      'const crypto = require("crypto");\n',
      'const crypto = require("crypto");\nconst {\n  sendWelcomeEmail,\n  sendPasswordResetEmail,\n  sendPasswordChangedEmail,\n} = require("../utils/customerEmails");\n',
      "import the email helpers"
    );

    // welcome email after registration
    replaceOnce(
      doc,
      '    return res.status(201).json({\n      success: true,\n      message:\n        "Customer account created successfully",',
      "    // Welcome email (runs in the background, never blocks registration)\n    sendWelcomeEmail(customer);\n\n" +
        '    return res.status(201).json({\n      success: true,\n      message:\n        "Customer account created successfully",',
      "welcome email after registration"
    );

    // forgot password: also load the name for the greeting
    replaceOnce(
      doc,
      "        SELECT\n          id,\n          email,\n          is_active\n        FROM customers\n        WHERE LOWER(email) = $1",
      "        SELECT\n          id,\n          first_name,\n          last_name,\n          email,\n          is_active\n        FROM customers\n        WHERE LOWER(email) = $1",
      "forgot password: load the customer's name"
    );

    replaceOnce(
      doc,
      '"If an account exists with this email, a password reset link has been generated."',
      '"If an account exists with this email, a password reset link has been sent to it."',
      "forgot password: wording"
    );

    // forgot password: replace the console-only block (and the unsafe developmentResetUrl)
    const start = doc.text.indexOf(
      '    const frontendUrl =\n      process.env.FRONTEND_URL ||\n      "http://localhost:5173";'
    );
    const endMarker = "      developmentResetUrl:\n        resetUrl,\n    });";
    const end = doc.text.indexOf(endMarker);

    if (start === -1 || end === -1 || end < start) {
      log(false, "forgot password: send the email  (could not find the block)");
    } else {
      doc.text =
        doc.text.slice(0, start) +
        "    // Send the reset link by email. It runs in the background, so the\n" +
        "    // answer takes the same time whether or not the account exists.\n" +
        "    // (The reset link is NEVER returned in the API response.)\n" +
        "    sendPasswordResetEmail({\n      customer,\n      resetToken,\n      expiresMinutes: 30,\n    });\n\n" +
        "    return res.json(genericResponse);" +
        doc.text.slice(end + endMarker.length);
      log(true, "forgot password: send the email, remove developmentResetUrl");
    }

    // reset password: confirmation email after the commit
    replaceOnce(
      doc,
      '    await client.query("COMMIT");\n\n    return res.json({\n      success: true,\n      message:\n        "Password has been reset successfully.',
      '    await client.query("COMMIT");\n\n    // Tell the customer their password changed (background)\n    sendPasswordChangedEmail(customer.id);\n\n    return res.json({\n      success: true,\n      message:\n        "Password has been reset successfully.',
      "reset password: confirmation email"
    );

    write(file, doc);
  }
}

console.log(
  problems
    ? `\n${problems} step(s) FAILED. Nothing was written for that file. Send me the message above.`
    : DRY
    ? "\nDRY RUN OK - nothing was written."
    : "\nDone."
);
process.exit(problems ? 1 : 0);
