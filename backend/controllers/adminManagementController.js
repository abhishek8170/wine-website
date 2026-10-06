const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

/**
 * Get all admin accounts
 */
const getAdmins = async (req, res) => {
  try {
    const result = await pool.query(`
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
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      admins: result.rows,
    });
  } catch (error) {
    console.error("Get admins error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Create a new admin
 */
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const normalizedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);
    const plainPassword = String(password || "");

    if (!normalizedName || !normalizedEmail || !plainPassword) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (plainPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingAdmin = await pool.query(
      `
      SELECT id
      FROM admins
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An admin with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const result = await pool.query(
      `
      INSERT INTO admins (
        name,
        email,
        password_hash,
        role,
        is_active
      )
      VALUES ($1, $2, $3, 'admin', true)
      RETURNING
        id,
        name,
        email,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at
      `,
      [
        normalizedName,
        normalizedEmail,
        passwordHash,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error("Create admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Update admin name/email
 */
const updateAdmin = async (req, res) => {
  try {
    const adminId = Number(req.params.id);
    const { name, email } = req.body || {};

    if (!Number.isInteger(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    const normalizedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const existingAdmin = await pool.query(
      `
      SELECT id
      FROM admins
      WHERE LOWER(email) = $1
        AND id != $2
      LIMIT 1
      `,
      [normalizedEmail, adminId]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Another admin already uses this email",
      });
    }

    const result = await pool.query(
      `
      UPDATE admins
      SET
        name = $1,
        email = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING
        id,
        name,
        email,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at
      `,
      [
        normalizedName,
        normalizedEmail,
        adminId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error("Update admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Change admin password
 */
const changeAdminPassword = async (req, res) => {
  try {
    const adminId = Number(req.params.id);
    const { password } = req.body || {};

    if (!Number.isInteger(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    const newPassword = String(password || "");

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingAdmin = await pool.query(
      `
      SELECT id
      FROM admins
      WHERE id = $1
      LIMIT 1
      `,
      [adminId]
    );

    if (existingAdmin.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `
      UPDATE admins
      SET
        password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [passwordHash, adminId]
    );

    return res.status(200).json({
      success: true,
      message: "Admin password changed successfully",
    });
  } catch (error) {
    console.error("Change admin password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Activate / deactivate admin
 */
const updateAdminStatus = async (req, res) => {
  try {
    const adminId = Number(req.params.id);
    const { is_active } = req.body || {};

    if (!Number.isInteger(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_active must be true or false",
      });
    }

    // Prevent current admin from deactivating themselves.
    if (
      adminId === Number(req.admin.id) &&
      is_active === false
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // Prevent the last active admin from being deactivated.
    if (is_active === false) {
      const activeAdmins = await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM admins
        WHERE is_active = true
      `);

      if (activeAdmins.rows[0].count <= 1) {
        return res.status(400).json({
          success: false,
          message: "At least one active admin must remain",
        });
      }
    }

    const result = await pool.query(
      `
      UPDATE admins
      SET
        is_active = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        name,
        email,
        role,
        is_active,
        last_login_at,
        created_at,
        updated_at
      `,
      [is_active, adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: is_active
        ? "Admin activated successfully"
        : "Admin deactivated successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error("Update admin status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Delete admin
 */
const deleteAdmin = async (req, res) => {
  try {
    const adminId = Number(req.params.id);

    if (!Number.isInteger(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    // Prevent current admin from deleting themselves.
    if (adminId === Number(req.admin.id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const existingAdmin = await pool.query(
      `
      SELECT id, is_active
      FROM admins
      WHERE id = $1
      LIMIT 1
      `,
      [adminId]
    );

    if (existingAdmin.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Don't allow the system to have zero active admins.
    if (existingAdmin.rows[0].is_active) {
      const activeAdmins = await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM admins
        WHERE is_active = true
      `);

      if (activeAdmins.rows[0].count <= 1) {
        return res.status(400).json({
          success: false,
          message: "At least one active admin must remain",
        });
      }
    }

    await pool.query(
      `
      DELETE FROM admins
      WHERE id = $1
      `,
      [adminId]
    );

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAdmins,
  createAdmin,
  updateAdmin,
  changeAdminPassword,
  updateAdminStatus,
  deleteAdmin,
};