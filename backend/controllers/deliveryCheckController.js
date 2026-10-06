const pool = require("../config/db");

const checkDeliveryAvailability = async (req, res) => {
  try {
    const { pincode } = req.query;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required",
      });
    }

    const cleanPincode = String(pincode).trim();

    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit pincode",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        state,
        city,
        postal_code,
        country,
        delivery_available,
        delivery_charge,
        estimated_delivery_days
      FROM delivery_zones
      WHERE postal_code = $1
      ORDER BY id DESC
      LIMIT 1
      `,
      [cleanPincode]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        delivery: {
          available: false,
          message: "Delivery is not available for this pincode",
          charge: 0,
          estimated_delivery_days: null,
        },
      });
    }

    const zone = result.rows[0];

    return res.status(200).json({
      success: true,
      delivery: {
        available: Boolean(zone.delivery_available),
        message: zone.delivery_available
          ? "Delivery is available for this pincode"
          : "Delivery is currently not available for this pincode",
        charge: Number(zone.delivery_charge || 0),
        estimated_delivery_days: zone.estimated_delivery_days,
        zone_id: zone.id,
        zone_name: zone.name,
        city: zone.city,
        state: zone.state,
        postal_code: zone.postal_code,
      },
    });
  } catch (error) {
    console.error("Delivery availability check error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check delivery availability",
    });
  }
};

module.exports = {
  checkDeliveryAvailability,
};