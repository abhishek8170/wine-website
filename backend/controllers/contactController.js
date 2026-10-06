const pool = require("../config/db");

const {
  notifyContactMessage,
  emitCreatedAdminNotification,
} = require("../utils/adminNotificationEvents");

// =========================================================
// GET CONTACT SETTINGS
// =========================================================

const getContactSettings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        section_label,
        heading,
        highlighted_heading,
        description,

        email_label,
        email,

        phone_label,
        phone,

        address_label,
        address,

        business_hours_label,
        business_hours,

        form_label,
        form_heading,
        form_description,

        support_note,

        cta_label,
        cta_text,
        cta_url,

        is_active,
        created_at,
        updated_at

      FROM contact_settings

      WHERE is_active = TRUE

      ORDER BY id ASC

      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact settings not found",
      });
    }

    const contact = result.rows[0];

    res.status(200).json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error("Get contact settings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load contact information",
    });
  }
};


// =========================================================
// SUBMIT CONTACT MESSAGE
// =========================================================

const submitContactMessage = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
    } = req.body;

    // -----------------------------------------------------
    // Required field validation
    // -----------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // -----------------------------------------------------
    // Email validation
    // -----------------------------------------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // -----------------------------------------------------
    // Message length validation
    // -----------------------------------------------------

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must contain at least 10 characters",
      });
    }

    // -----------------------------------------------------
    // Insert message
    // -----------------------------------------------------

    const result = await pool.query(
      `
        INSERT INTO contact_messages (
          name,
          email,
          phone,
          subject,
          message,
          status
        )
        VALUES ($1, $2, $3, $4, $5, 'New')
        RETURNING
          id,
          name,
          email,
          phone,
          subject,
          message,
          status,
          created_at
      `,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone ? phone.trim() : null,
        subject.trim(),
        message.trim(),
      ]
    );

    // Admin notification (must never break the form submission)
    try {
      const adminNotification = await notifyContactMessage(pool, {
        messageId: result.rows[0].id,
        customerName: result.rows[0].name,
        subject: result.rows[0].subject,
      });

      emitCreatedAdminNotification(adminNotification);
    } catch (notificationError) {
      console.error(
        "Contact message admin notification error:",
        notificationError
      );
    }

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully",
      contactMessage: result.rows[0],
    });
  } catch (error) {
    console.error("Submit contact message error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send your message",
    });
  }
};


module.exports = {
  getContactSettings,
  submitContactMessage,
};