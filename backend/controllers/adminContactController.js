const pool = require("../config/db");

// ============================================
// GET ALL CONTACT MESSAGES
// ============================================
const getContactMessages = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        phone,
        subject,
        message,
        status,
        created_at,
        updated_at
      FROM contact_messages
      ORDER BY created_at DESC, id DESC
    `);

    res.status(200).json({
      success: true,
      messages: result.rows,
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages",
    });
  }
};

// ============================================
// GET SINGLE CONTACT MESSAGE
// ============================================
const getContactMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        subject,
        message,
        status,
        created_at,
        updated_at
      FROM contact_messages
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching contact message:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch contact message",
    });
  }
};

// ============================================
// UPDATE CONTACT MESSAGE STATUS
// ============================================
const updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE contact_messages
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        name,
        email,
        phone,
        subject,
        message,
        status,
        created_at,
        updated_at
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact message status updated successfully",
      contactMessage: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating contact message status:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update contact message status",
    });
  }
};

module.exports = {
  getContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
};