const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const normalizeName = (name) =>
  String(name || "").trim();

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
};

/*
  GET ALL ADMINS
  GET /api/admin/admins
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

/*
  CREATE NEW ADMIN
  POST /api/admin/admins
*/
const createAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "admin",
      is_active = true,
    } = req.body || {};

    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "Admin name is required",
      });
    }

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Admin name must be between 2 and 100 characters",
      });
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8-128 characters and contain uppercase, lowercase and a number",
      });
    }

    const allowedRoles = ["admin", "super_admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin role",
      });
    }

    const existingAdmin = await pool.query(
      `
      SELECT id
      FROM admins
      WHERE email = $1
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

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO admins (
        name,
        email,
        password_hash,
        role,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        name,
        email,
        role,
        is_active,
        created_at,
        updated_at
      `,
      [
        normalizedName,
        normalizedEmail,
        passwordHash,
        role,
        Boolean(is_active),
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

/*
  UPDATE ADMIN
  PUT /api/admin/admins/:id
*/
const updateAdmin = async (req, res) => {
  try {
    const adminId = Number(req.params.id);

    if (!Number.isInteger(adminId) || adminId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    const {
      name,
      email,
      password,
      role,
      is_active,
    } = req.body || {};

    const existingResult = await pool.query(
      `
      SELECT id, name, email, role, is_active
      FROM admins
      WHERE id = $1
      LIMIT 1
      `,
      [adminId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const existingAdmin = existingResult.rows[0];

    const updatedName =
      name !== undefined
        ? normalizeName(name)
        : existingAdmin.name;

    const updatedEmail =
      email !== undefined
        ? normalizeEmail(email)
        : existingAdmin.email;

    const updatedRole =
      role !== undefined
        ? role
        : existingAdmin.role;

    const updatedIsActive =
      is_active !== undefined
        ? Boolean(is_active)
        : existingAdmin.is_active;

    if (
      updatedName.length < 2 ||
      updatedName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Admin name must be between 2 and 100 characters",
      });
    }

    if (!isValidEmail(updatedEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
      });
    }

    if (!["admin", "super_admin"].includes(updatedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin role",
      });
    }

    if (updatedEmail !== existingAdmin.email) {
      const duplicateResult = await pool.query(
        `
        SELECT id
        FROM admins
        WHERE email = $1
          AND id <> $2
        LIMIT 1
        `,
        [updatedEmail, adminId]
      );

      if (duplicateResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "An admin with this email already exists",
        });
      }
    }

    let result;

    if (password !== undefined && password !== "") {
      if (!isValidPassword(password)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be 8-128 characters and contain uppercase, lowercase and a number",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      result = await pool.query(
        `
        UPDATE admins
        SET
          name = $1,
          email = $2,
          password_hash = $3,
          role = $4,
          is_active = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
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
          updatedName,
          updatedEmail,
          passwordHash,
          updatedRole,
          updatedIsActive,
          adminId,
        ]
      );
    } else {
      result = await pool.query(
        `
        UPDATE admins
        SET
          name = $1,
          email = $2,
          role = $3,
          is_active = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
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
          updatedName,
          updatedEmail,
          updatedRole,
          updatedIsActive,
          adminId,
        ]
      );
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

/*
  DELETE ADMIN
  DELETE /api/admin/admins/:id
*/
const deleteAdmin = async (req, res) => {
  try {
    const adminId = Number(req.params.id);

    if (!Number.isInteger(adminId) || adminId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    // Prevent an admin from deleting their own account.
    if (req.admin.id === adminId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM admins
      WHERE id = $1
      RETURNING id, name, email
      `,
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
      admin: result.rows[0],
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
  deleteAdmin,
};