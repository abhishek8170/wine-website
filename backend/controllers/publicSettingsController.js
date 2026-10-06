const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| GET PUBLIC STORE SETTINGS
|--------------------------------------------------------------------------
|
| This endpoint is intentionally PUBLIC.
|
| It returns only settings that are safe for:
| - Customer frontend
| - Admin login page
| - Public pages
|
| Sensitive admin information is NOT returned.
|
|--------------------------------------------------------------------------
*/

const getPublicSettings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        brand_name,
        logo_url,
        favicon_url,
        contact_email,
        contact_phone,
        whatsapp_support_enabled,
        whatsapp_number,
        address,

        currency,
        tax_percentage,
        shipping_charge,
        minimum_order_value,
        coupon_enabled,

        local_pickup_enabled,
        delivery_timings,

        age_verification_enabled,
        age_verification_method,
        age_verification_message,
        age_verification_redirect_url

      FROM general_settings
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        settings: {
          brand_name: "VINEORA",
          logo_url: null,
          favicon_url: null,
          contact_email: null,
          contact_phone: null,
          whatsapp_support_enabled: false,
          whatsapp_number: null,
          address: null,

          currency: "INR",
          tax_percentage: 0,
          shipping_charge: 0,
          minimum_order_value: 0,
          coupon_enabled: true,

          local_pickup_enabled: false,
          delivery_timings: null,

          age_verification_enabled: true,
          age_verification_method: "birthdate",
          age_verification_message:
            "You must be of legal drinking age to enter this website.",
          age_verification_redirect_url: null,
        },
      });
    }

    const settings = result.rows[0];

    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Get public settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load public settings",
    });
  }
};

module.exports = {
  getPublicSettings,
};