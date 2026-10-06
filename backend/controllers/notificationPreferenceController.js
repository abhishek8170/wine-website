const pool = require("../config/db");

// =====================================================
// GET CUSTOMER NOTIFICATION PREFERENCES
// =====================================================

const getNotificationPreferences = async (req, res) => {
  try {
    const customerId = req.customer.id;

    let result = await pool.query(
      `
      SELECT *
      FROM customer_notification_preferences
      WHERE customer_id = $1
      `,
      [customerId]
    );

    // Create default preferences if they don't exist
    if (result.rows.length === 0) {
      result = await pool.query(
        `
        INSERT INTO customer_notification_preferences
        (customer_id)
        VALUES ($1)
        RETURNING *
        `,
        [customerId]
      );
    }

    res.json({
      success: true,
      preferences: result.rows[0],
    });
  } catch (error) {
    console.error("GET NOTIFICATION PREFERENCES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notification preferences",
    });
  }
};

// =====================================================
// UPDATE CUSTOMER NOTIFICATION PREFERENCES
// =====================================================

const updateNotificationPreferences = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const {
      order_confirmation_email,
      order_confirmation_sms,
      order_confirmation_whatsapp,

      payment_confirmation_email,
      payment_confirmation_sms,
      payment_confirmation_whatsapp,

      order_processing_email,
      order_processing_sms,
      order_processing_whatsapp,

      order_packed_email,
      order_packed_sms,
      order_packed_whatsapp,

      order_shipped_email,
      order_shipped_sms,
      order_shipped_whatsapp,

      order_out_for_delivery_email,
      order_out_for_delivery_sms,
      order_out_for_delivery_whatsapp,

      order_delivered_email,
      order_delivered_sms,
      order_delivered_whatsapp,

      promotional_offer_email,
      promotional_offer_sms,
      promotional_offer_whatsapp,

      price_change_email,
      price_change_sms,
      price_change_whatsapp,

      back_in_stock_email,
      back_in_stock_sms,
      back_in_stock_whatsapp,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO customer_notification_preferences (
        customer_id,

        order_confirmation_email,
        order_confirmation_sms,
        order_confirmation_whatsapp,

        payment_confirmation_email,
        payment_confirmation_sms,
        payment_confirmation_whatsapp,

        order_processing_email,
        order_processing_sms,
        order_processing_whatsapp,

        order_packed_email,
        order_packed_sms,
        order_packed_whatsapp,

        order_shipped_email,
        order_shipped_sms,
        order_shipped_whatsapp,

        order_out_for_delivery_email,
        order_out_for_delivery_sms,
        order_out_for_delivery_whatsapp,

        order_delivered_email,
        order_delivered_sms,
        order_delivered_whatsapp,

        promotional_offer_email,
        promotional_offer_sms,
        promotional_offer_whatsapp,

        price_change_email,
        price_change_sms,
        price_change_whatsapp,

        back_in_stock_email,
        back_in_stock_sms,
        back_in_stock_whatsapp
      )
      VALUES (
        $1,
        $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19,
        $20, $21, $22,
        $23, $24, $25,
        $26, $27, $28,
        $29, $30, $31
      )
      ON CONFLICT (customer_id)
      DO UPDATE SET

        order_confirmation_email = EXCLUDED.order_confirmation_email,
        order_confirmation_sms = EXCLUDED.order_confirmation_sms,
        order_confirmation_whatsapp = EXCLUDED.order_confirmation_whatsapp,

        payment_confirmation_email = EXCLUDED.payment_confirmation_email,
        payment_confirmation_sms = EXCLUDED.payment_confirmation_sms,
        payment_confirmation_whatsapp = EXCLUDED.payment_confirmation_whatsapp,

        order_processing_email = EXCLUDED.order_processing_email,
        order_processing_sms = EXCLUDED.order_processing_sms,
        order_processing_whatsapp = EXCLUDED.order_processing_whatsapp,

        order_packed_email = EXCLUDED.order_packed_email,
        order_packed_sms = EXCLUDED.order_packed_sms,
        order_packed_whatsapp = EXCLUDED.order_packed_whatsapp,

        order_shipped_email = EXCLUDED.order_shipped_email,
        order_shipped_sms = EXCLUDED.order_shipped_sms,
        order_shipped_whatsapp = EXCLUDED.order_shipped_whatsapp,

        order_out_for_delivery_email = EXCLUDED.order_out_for_delivery_email,
        order_out_for_delivery_sms = EXCLUDED.order_out_for_delivery_sms,
        order_out_for_delivery_whatsapp = EXCLUDED.order_out_for_delivery_whatsapp,

        order_delivered_email = EXCLUDED.order_delivered_email,
        order_delivered_sms = EXCLUDED.order_delivered_sms,
        order_delivered_whatsapp = EXCLUDED.order_delivered_whatsapp,

        promotional_offer_email = EXCLUDED.promotional_offer_email,
        promotional_offer_sms = EXCLUDED.promotional_offer_sms,
        promotional_offer_whatsapp = EXCLUDED.promotional_offer_whatsapp,

        price_change_email = EXCLUDED.price_change_email,
        price_change_sms = EXCLUDED.price_change_sms,
        price_change_whatsapp = EXCLUDED.price_change_whatsapp,

        back_in_stock_email = EXCLUDED.back_in_stock_email,
        back_in_stock_sms = EXCLUDED.back_in_stock_sms,
        back_in_stock_whatsapp = EXCLUDED.back_in_stock_whatsapp

      RETURNING *
      `,
      [
        customerId,

        order_confirmation_email,
        order_confirmation_sms,
        order_confirmation_whatsapp,

        payment_confirmation_email,
        payment_confirmation_sms,
        payment_confirmation_whatsapp,

        order_processing_email,
        order_processing_sms,
        order_processing_whatsapp,

        order_packed_email,
        order_packed_sms,
        order_packed_whatsapp,

        order_shipped_email,
        order_shipped_sms,
        order_shipped_whatsapp,

        order_out_for_delivery_email,
        order_out_for_delivery_sms,
        order_out_for_delivery_whatsapp,

        order_delivered_email,
        order_delivered_sms,
        order_delivered_whatsapp,

        promotional_offer_email,
        promotional_offer_sms,
        promotional_offer_whatsapp,

        price_change_email,
        price_change_sms,
        price_change_whatsapp,

        back_in_stock_email,
        back_in_stock_sms,
        back_in_stock_whatsapp,
      ]
    );

    res.json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE NOTIFICATION PREFERENCES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notification preferences",
    });
  }
};

module.exports = {
  getCustomerNotificationPreferences: getNotificationPreferences,
  updateCustomerNotificationPreferences: updateNotificationPreferences,
};