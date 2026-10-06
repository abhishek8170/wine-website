const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| GET ALL NEWSLETTER SUBSCRIBERS
|--------------------------------------------------------------------------
*/

const getNewsletterSubscribers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email,
        first_name,
        is_active,
        subscribed_at,
        unsubscribed_at,
        created_at,
        updated_at
      FROM newsletter_subscribers
      ORDER BY subscribed_at DESC, id DESC
      `
    );

    const subscribers = result.rows;

    const totalSubscribers = subscribers.length;

    const activeSubscribers = subscribers.filter(
      (subscriber) => subscriber.is_active
    ).length;

    const inactiveSubscribers =
      totalSubscribers - activeSubscribers;

    return res.status(200).json({
      success: true,

      subscribers,

      counts: {
        total: totalSubscribers,
        active: activeSubscribers,
        inactive: inactiveSubscribers,
      },
    });
  } catch (error) {
    console.error(
      "Get newsletter subscribers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load newsletter subscribers",
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE NEWSLETTER SUBSCRIBER STATUS
|--------------------------------------------------------------------------
*/

const updateNewsletterSubscriberStatus = async (
  req,
  res
) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "is_active must be true or false",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE newsletter_subscribers
      SET
        is_active = $1,
        unsubscribed_at =
          CASE
            WHEN $1 = TRUE THEN NULL
            ELSE CURRENT_TIMESTAMP
          END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        email,
        first_name,
        is_active,
        subscribed_at,
        unsubscribed_at,
        created_at,
        updated_at
      `,
      [
        is_active,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Newsletter subscriber not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: is_active
        ? "Subscriber activated successfully"
        : "Subscriber deactivated successfully",
      subscriber: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update newsletter subscriber status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update subscriber status",
    });
  }
};


module.exports = {
  getNewsletterSubscribers,
  updateNewsletterSubscriberStatus,
};