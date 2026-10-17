const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");
const {
  sendAdminPasswordResetEmail,
  sendAdminPasswordChangedEmail,
} = require("../utils/adminEmails");

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Same rule as the customer site: 8-128 characters, one uppercase letter,
// one lowercase letter, one number and one symbol.
const isValidPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  password.length <= 128 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9\s]/.test(password);

// Tokens made by crypto.randomBytes(32).toString("hex") are 64 hex characters.
const isValidResetToken = (token) =>
  typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);

const RESET_LINK_MINUTES = 30;

const createAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      type: "admin",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        is_active
      FROM admins
      WHERE email = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createAdminToken(admin);

    await pool.query(
      `
      UPDATE admins
      SET
        last_login_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [admin.id]
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getCurrentAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at
      FROM admins
      WHERE id = $1
      LIMIT 1
      `,
      [req.admin.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return res.status(401).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get current admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   FORGOT PASSWORD
   POST /api/admin/auth/forgot-password
========================================================= */

const forgotAdminPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (email === undefined) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Never reveal whether an admin account exists.
    const genericResponse = {
      success: true,
      message:
        "If an admin account exists with this email, a password reset link has been sent to it.",
    };

    const adminResult = await pool.query(
      `
      SELECT id, name, email, is_active
      FROM admins
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (adminResult.rows.length === 0) {
      return res.json(genericResponse);
    }

    const admin = adminResult.rows[0];

    if (!admin.is_active) {
      return res.json(genericResponse);
    }

    // Old links stop working as soon as a new one is requested.
    await pool.query(
      `
      UPDATE admin_password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE admin_id = $1
        AND used_at IS NULL
      `,
      [admin.id]
    );

    const resetToken = crypto.randomBytes(32).toString("hex");

    // Only a fingerprint (hash) of the token is saved in the database.
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + RESET_LINK_MINUTES * 60 * 1000);

    await pool.query(
      `
      INSERT INTO admin_password_reset_tokens (
        admin_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      `,
      [admin.id, tokenHash, expiresAt]
    );

    // Sent in the background (the link is NEVER returned in the response).
    sendAdminPasswordResetEmail({
      admin,
      resetToken,
      expiresMinutes: RESET_LINK_MINUTES,
    });

    return res.json(genericResponse);
  } catch (error) {
    console.error("Admin forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
};

/* =========================================================
   RESET PASSWORD
   POST /api/admin/auth/reset-password
========================================================= */

const resetAdminPassword = async (req, res) => {
  let client;

  try {
    const { token, password, confirm_password } = req.body || {};

    if (
      token === undefined ||
      password === undefined ||
      confirm_password === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset token, password and confirm password are required",
      });
    }

    if (!isValidResetToken(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8-128 characters and contain at least one uppercase letter, one lowercase letter, one number and one symbol",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    client = await pool.connect();

    await client.query("BEGIN");

    const tokenResult = await client.query(
      `
      SELECT id, admin_id, expires_at, used_at
      FROM admin_password_reset_tokens
      WHERE token_hash = $1
      LIMIT 1
      FOR UPDATE
      `,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    const resetRecord = tokenResult.rows[0];

    if (resetRecord.used_at) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This password reset link has already been used",
      });
    }

    if (new Date(resetRecord.expires_at) <= new Date()) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This password reset link has expired",
      });
    }

    const adminResult = await client.query(
      `
      SELECT id, is_active
      FROM admins
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [resetRecord.admin_id]
    );

    if (adminResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const admin = adminResult.rows[0];

    if (!admin.is_active) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await client.query(
      `
      UPDATE admins
      SET
        password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [passwordHash, admin.id]
    );

    // Use up this link and every other open link for the same admin.
    await client.query(
      `
      UPDATE admin_password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE admin_id = $1
        AND used_at IS NULL
      `,
      [admin.id]
    );

    await client.query("COMMIT");

    // Tell the admin their password changed (background).
    sendAdminPasswordChangedEmail(admin.id);

    return res.json({
      success: true,
      message:
        "Password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    console.error("Admin reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  loginAdmin,
  getCurrentAdmin,
  forgotAdminPassword,
  resetAdminPassword,
};
