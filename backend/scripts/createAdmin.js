const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const createAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = String(process.env.ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required."
      );
    }

    if (password.length < 8) {
      throw new Error("Admin password must be at least 8 characters.");
    }

    const existingAdmin = await pool.query(
      "SELECT id FROM admins WHERE email = $1 LIMIT 1",
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log(`Admin with email ${email} already exists.`);
      return;
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
      RETURNING id, name, email, role, is_active, created_at
      `,
      [name.trim(), email, passwordHash, "admin", true]
    );

    console.log("Admin account created successfully.");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

createAdmin();