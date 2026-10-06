const pool = require("../config/db");

const {
  notifyNewsletterSubscribed,
  emitCreatedAdminNotification,
} = require("../utils/adminNotificationEvents");

/*
============================================================
SUBSCRIBE TO NEWSLETTER
============================================================
*/

const subscribeToNewsletter = async (req, res) => {
  try {
    const { email, firstName } = req.body;

    // Basic validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    /*
    --------------------------------------------------------
    Check whether this email already exists
    --------------------------------------------------------
    */

    const existingSubscriber = await pool.query(
      `
      SELECT id, is_active
      FROM newsletter_subscribers
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    /*
    --------------------------------------------------------
    Existing active subscriber
    --------------------------------------------------------
    */

    if (
      existingSubscriber.rows.length > 0 &&
      existingSubscriber.rows[0].is_active === true
    ) {
      return res.status(409).json({
        success: false,
        message: "This email is already subscribed",
      });
    }

    /*
    --------------------------------------------------------
    Existing inactive subscriber
    --------------------------------------------------------
    
    If someone unsubscribed previously and subscribes again,
    reactivate their subscription instead of creating a
    duplicate record.
    */

    if (
      existingSubscriber.rows.length > 0 &&
      existingSubscriber.rows[0].is_active === false
    ) {
      const result = await pool.query(
        `
        UPDATE newsletter_subscribers
        SET
          first_name = $1,
          is_active = TRUE,
          unsubscribed_at = NULL,
          subscribed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
          id,
          email,
          first_name,
          is_active,
          subscribed_at
        `,
        [
          firstName?.trim() || null,
          existingSubscriber.rows[0].id,
        ]
      );

      return res.status(200).json({
        success: true,
        message: "Welcome back! You are subscribed to the VINEORA Journal.",
        subscriber: result.rows[0],
      });
    }

    /*
    --------------------------------------------------------
    Create new subscriber
    --------------------------------------------------------
    */

    const result = await pool.query(
      `
      INSERT INTO newsletter_subscribers (
        email,
        first_name,
        is_active,
        subscribed_at
      )
      VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP)
      RETURNING
        id,
        email,
        first_name,
        is_active,
        subscribed_at
      `,
      [
        normalizedEmail,
        firstName?.trim() || null,
      ]
    );

    // Admin notification (must never break subscription)
    try {
      const adminNotification = await notifyNewsletterSubscribed(pool, {
        subscriberId: result.rows[0].id,
        email: result.rows[0].email,
      });

      emitCreatedAdminNotification(adminNotification);
    } catch (notificationError) {
      console.error(
        "Newsletter admin notification error:",
        notificationError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Thank you for subscribing to the VINEORA Journal.",
      subscriber: result.rows[0],
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to subscribe to the newsletter",
    });
  }
};


/*
============================================================
UNSUBSCRIBE FROM NEWSLETTER
============================================================
*/

const unsubscribeFromNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
      UPDATE newsletter_subscribers
      SET
        is_active = FALSE,
        unsubscribed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING
        id,
        email,
        is_active,
        unsubscribed_at
      `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subscription was found for this email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "You have been unsubscribed from the VINEORA Journal.",
      subscriber: result.rows[0],
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to unsubscribe from the newsletter",
    });
  }
};


/*
============================================================
EXPORT
============================================================
*/

module.exports = {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
};