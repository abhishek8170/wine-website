const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
/* =========================================================
   REGISTER CUSTOMER
========================================================= */

const registerCustomer = async (req, res) => {
  try {
    const body = req.body || {};

    const {
      first_name,
      last_name,
      email,
      phone,
      password,
    } = body;

    if (!first_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "First name, email, phone number and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const existingEmail = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const existingPhone = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE phone = $1
      LIMIT 1
      `,
      [normalizedPhone]
    );

    if (existingPhone.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this phone number already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO customers (
        first_name,
        last_name,
        email,
        phone,
        password_hash
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        first_name,
        last_name,
        email,
        phone,
        is_active,
        created_at
      `,
      [
        first_name.trim(),
        last_name ? last_name.trim() : null,
        normalizedEmail,
        normalizedPhone,
        passwordHash,
      ]
    );

    const customer = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully",
      customer,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "23505") {
      const constraint = error.constraint || "";

      if (constraint.toLowerCase().includes("phone")) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this phone number already exists",
        });
      }

      if (constraint.toLowerCase().includes("email")) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "An account with these details already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create customer account",
    });
  }
};

/* =========================================================
   LOGIN CUSTOMER
========================================================= */

const loginCustomer = async (req, res) => {
  try {
    const body = req.body || {};

    const {
      email,
      password,
    } = body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        password_hash,
        is_active
      FROM customers
      WHERE LOWER(email) = $1
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

    const customer = result.rows[0];

    if (!customer.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      customer.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await pool.query(
      `
      UPDATE customers
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [customer.id]
    );

    delete customer.password_hash;

    return res.json({
      success: true,
      message: "Login successful",
      token,
      customer,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/* =========================================================
   GET CURRENT CUSTOMER ACCOUNT
========================================================= */

const getCurrentCustomer = async (req, res) => {
  try {
    const customerId = req.customer.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const customerResult = await pool.query(
      `
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        profile_image_url,
        is_active,
        created_at
      FROM customers
      WHERE id = $1
      LIMIT 1
      `,
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    const customer = customerResult.rows[0];

    if (!customer.is_active) {
      return res.status(403).json({
        success: false,
        message: "Customer account is inactive",
      });
    }

    const orderCountResult = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM orders
      WHERE customer_id = $1
      `,
      [customerId]
    );

    const addressCountResult = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM customer_addresses
      WHERE customer_id = $1
      `,
      [customerId]
    );

    const wishlistCountResult = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM wishlists
      WHERE customer_id = $1
      `,
      [customerId]
    );

    return res.json({
      success: true,

      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name || "",
        email: customer.email,
        phone: customer.phone,
        profile_image_url:
          customer.profile_image_url || null,
        is_active: customer.is_active,
        created_at: customer.created_at,
      },

      summary: {
        orders: Number(
          orderCountResult.rows[0].count
        ),
        addresses: Number(
          addressCountResult.rows[0].count
        ),
        wishlist: Number(
          wishlistCountResult.rows[0].count
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get current customer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load customer account",
    });
  }
};

/* =========================================================
   UPDATE CUSTOMER PROFILE
========================================================= */

const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.customer.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const body = req.body || {};

    const {
      first_name,
      last_name,
      email,
      phone,
    } = body;

    // Required fields
    if (!first_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "First name, email and phone number are required",
      });
    }

    const normalizedFirstName = first_name.trim();
    const normalizedLastName = last_name
      ? last_name.trim()
      : null;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (
      !normalizedFirstName ||
      !normalizedEmail ||
      !normalizedPhone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, email and phone number cannot be empty",
      });
    }

    /* =====================================================
       CHECK EMAIL BELONGS TO ANOTHER CUSTOMER
    ===================================================== */

    const existingEmail = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE LOWER(email) = $1
        AND id <> $2
      LIMIT 1
      `,
      [normalizedEmail, customerId]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Another account already uses this email address",
      });
    }

    /* =====================================================
       CHECK PHONE BELONGS TO ANOTHER CUSTOMER
    ===================================================== */

    const existingPhone = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE phone = $1
        AND id <> $2
      LIMIT 1
      `,
      [normalizedPhone, customerId]
    );

    if (existingPhone.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Another account already uses this phone number",
      });
    }

    /* =====================================================
       UPDATE CUSTOMER
    ===================================================== */

    const result = await pool.query(
      `
      UPDATE customers
      SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING
        id,
        first_name,
        last_name,
        email,
        phone,
        profile_image_url,
        is_active,
        created_at,
        updated_at
      `,
      [
        normalizedFirstName,
        normalizedLastName,
        normalizedEmail,
        normalizedPhone,
        customerId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    const customer = result.rows[0];

    return res.json({
      success: true,
      message: "Profile updated successfully",
      customer,
    });
  } catch (error) {
    console.error(
      "Update customer profile error:",
      error
    );

    if (error.code === "23505") {
      const constraint = error.constraint || "";

      if (constraint.toLowerCase().includes("phone")) {
        return res.status(409).json({
          success: false,
          message:
            "Another account already uses this phone number",
        });
      }

      if (constraint.toLowerCase().includes("email")) {
        return res.status(409).json({
          success: false,
          message:
            "Another account already uses this email address",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};


/* =========================================================
   FORGOT PASSWORD
========================================================= */

const forgotPassword = async (req, res) => {
  try {
    const body = req.body || {};

    const { email } = body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    /* =====================================================
       FIND CUSTOMER
    ===================================================== */

    const customerResult = await pool.query(
      `
      SELECT
        id,
        email,
        is_active
      FROM customers
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    /*
      Security:
      Do not reveal whether an email exists in the database.
    */

    if (customerResult.rows.length === 0) {
      return res.json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been generated.",
      });
    }

    const customer = customerResult.rows[0];

    if (!customer.is_active) {
      return res.json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been generated.",
      });
    }

    /* =====================================================
       INVALIDATE OLD UNUSED TOKENS
    ===================================================== */

    await pool.query(
      `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE customer_id = $1
        AND used_at IS NULL
      `,
      [customer.id]
    );

    /* =====================================================
       GENERATE SECURE RESET TOKEN
    ===================================================== */

    const resetToken = crypto.randomBytes(32).toString("hex");

    /*
      Store only the hash in the database.
    */

    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    /*
      Token expires after 30 minutes.
    */

    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    );

    await pool.query(
      `
      INSERT INTO password_reset_tokens (
        customer_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      `,
      [
        customer.id,
        tokenHash,
        expiresAt,
      ]
    );

    /*
      Development reset URL.

      Later, when email service is connected,
      this URL will be sent through email.
    */

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/reset-password?token=${resetToken}`;

    console.log(
      "\n=========================================="
    );

    console.log("PASSWORD RESET REQUEST");

    console.log("Customer:", customer.email);

    console.log("Reset URL:");

    console.log(resetUrl);

    console.log(
      "==========================================\n"
    );

    return res.json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been generated.",
      developmentResetUrl: resetUrl,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request",
    });
  }
};


/* =========================================================
   RESET PASSWORD
========================================================= */

const resetPassword = async (req, res) => {
  try {
    const body = req.body || {};

    const {
      token,
      password,
      confirm_password,
    } = body;

    if (!token || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token, password and confirm password are required",
      });
    }

    /* =====================================================
       PASSWORD VALIDATION
    ===================================================== */

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match",
      });
    }

    /* =====================================================
       HASH RESET TOKEN
    ===================================================== */

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    /* =====================================================
       FIND VALID RESET TOKEN
    ===================================================== */

    const tokenResult = await pool.query(
      `
      SELECT
        id,
        customer_id,
        expires_at,
        used_at
      FROM password_reset_tokens
      WHERE token_hash = $1
      LIMIT 1
      `,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset link",
      });
    }

    const resetRecord =
      tokenResult.rows[0];

    /* =====================================================
       CHECK TOKEN USED
    ===================================================== */

    if (resetRecord.used_at) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link has already been used",
      });
    }

    /* =====================================================
       CHECK TOKEN EXPIRATION
    ===================================================== */

    if (
      new Date(resetRecord.expires_at) <=
      new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link has expired",
      });
    }

    /* =====================================================
       CHECK CUSTOMER
    ===================================================== */

    const customerResult = await pool.query(
      `
      SELECT
        id,
        is_active
      FROM customers
      WHERE id = $1
      LIMIT 1
      `,
      [resetRecord.customer_id]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Customer account not found",
      });
    }

    const customer =
      customerResult.rows[0];

    if (!customer.is_active) {
      return res.status(403).json({
        success: false,
        message:
          "Customer account is inactive",
      });
    }

    /* =====================================================
       HASH NEW PASSWORD
    ===================================================== */

    const passwordHash =
      await bcrypt.hash(password, 12);

    /* =====================================================
       UPDATE PASSWORD
    ===================================================== */

    await pool.query(
      `
      UPDATE customers
      SET
        password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [
        passwordHash,
        customer.id,
      ]
    );

    /* =====================================================
       MARK RESET TOKEN AS USED
    ===================================================== */

    await pool.query(
      `
      UPDATE password_reset_tokens
      SET
        used_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [resetRecord.id]
    );

    /* =====================================================
       INVALIDATE ANY OTHER ACTIVE RESET TOKENS
    ===================================================== */

    await pool.query(
      `
      UPDATE password_reset_tokens
      SET
        used_at = CURRENT_TIMESTAMP
      WHERE customer_id = $1
        AND id <> $2
        AND used_at IS NULL
      `,
      [
        customer.id,
        resetRecord.id,
      ]
    );

    return res.json({
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  updateCustomerProfile,
  forgotPassword,
  resetPassword,
};