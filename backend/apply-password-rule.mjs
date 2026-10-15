// ============================================================
// PASSWORD RULE - requires a symbol everywhere in the customer backend
// Run from the `backend` folder:
//
//     node apply-password-rule.mjs --dry-run
//     node apply-password-rule.mjs
//
// New rule (signup AND reset password, checked on the server):
//   8-128 characters, one UPPERCASE, one lowercase, one number, one symbol
// A "symbol" is any character that is not a letter, a number or a space
// (for example  ! @ # $ % ^ & * ( ) - _ + = . ,  ? ).
//
// Customers who already have a password without a symbol can still log
// in. The rule only applies when a password is created or changed.
// You can run this twice; the second time it changes nothing.
// ============================================================
import fs from "fs";

const DRY = process.argv.includes("--dry-run");
const file = "controllers/authController.js";

const raw = fs.readFileSync(file, "utf8");
const crlf = raw.includes("\r\n");
let text = raw.replace(/\r\n/g, "\n");

if (text.includes("[^A-Za-z0-9\\s]")) {
  console.log("Already updated, nothing to do.");
  process.exit(0);
}

let problems = 0;

// 1. the check itself
const oldCheck =
  "  /*\n    Password must contain:\n    - uppercase\n    - lowercase\n    - number\n  */\n  return (\n    /[A-Z]/.test(password) &&\n    /[a-z]/.test(password) &&\n    /[0-9]/.test(password)\n  );";
const newCheck =
  "  /*\n    Password must contain:\n    - uppercase\n    - lowercase\n    - number\n    - symbol (any character that is not a letter, number or space)\n  */\n  return (\n    /[A-Z]/.test(password) &&\n    /[a-z]/.test(password) &&\n    /[0-9]/.test(password) &&\n    /[^A-Za-z0-9\\s]/.test(password)\n  );";

if (text.includes(oldCheck)) {
  text = text.replace(oldCheck, () => newCheck);
  console.log("  ok   password check now requires a symbol");
} else {
  console.log("  FAIL could not find the isValidPassword check");
  problems++;
}

// 2. the error messages (signup + reset)
const oldMsg =
  "Password must be 8-128 characters and contain at least one uppercase letter, one lowercase letter and one number";
const newMsg =
  "Password must be 8-128 characters and contain at least one uppercase letter, one lowercase letter, one number and one symbol";

const count = text.split(oldMsg).length - 1;
if (count > 0) {
  text = text.split(oldMsg).join(newMsg);
  console.log(`  ok   ${count} error message(s) updated`);
} else {
  console.log("  FAIL could not find the error messages");
  problems++;
}

if (problems) {
  console.log("\nNothing was written. Send me the lines above.");
  process.exit(1);
}

if (!DRY) fs.writeFileSync(file, crlf ? text.replace(/\n/g, "\r\n") : text);
console.log(DRY ? "\nDRY RUN OK - nothing written." : "\nDone.");
