const pool = require("../config/db");

// GET all delivery zones
const getDeliveryZones = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        state,
        city,
        postal_code,
        country,
        delivery_available,
        delivery_charge,
        estimated_delivery_days,
        created_at,
        updated_at
      FROM delivery_zones
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      zones: result.rows,
    });
  } catch (error) {
    console.error("Get delivery zones error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery zones",
    });
  }
};


// CREATE delivery zone
const createDeliveryZone = async (req, res) => {
  const {
    name,
    state,
    city,
    postal_code,
    country,
    delivery_available = true,
    delivery_charge = 0,
    estimated_delivery_days = 1,
  } = req.body;

  try {
    if (!name || !postal_code) {
      return res.status(400).json({
        success: false,
        message: "Zone name and postal code are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO delivery_zones (
        name,
        state,
        city,
        postal_code,
        country,
        delivery_available,
        delivery_charge,
        estimated_delivery_days
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        name.trim(),
        state?.trim() || null,
        city?.trim() || null,
        postal_code.trim(),
        country?.trim() || "India",
        delivery_available,
        Number(delivery_charge) || 0,
        Number(estimated_delivery_days) || 1,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Delivery zone created successfully",
      zone: result.rows[0],
    });
  } catch (error) {
    console.error("Create delivery zone error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create delivery zone",
    });
  }
};


// UPDATE delivery zone
const updateDeliveryZone = async (req, res) => {
  const { id } = req.params;

  const {
    name,
    state,
    city,
    postal_code,
    country,
    delivery_available,
    delivery_charge,
    estimated_delivery_days,
  } = req.body;

  try {
    const existing = await pool.query(
      `SELECT id FROM delivery_zones WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found",
      });
    }

    const result = await pool.query(
      `
      UPDATE delivery_zones
      SET
        name = $1,
        state = $2,
        city = $3,
        postal_code = $4,
        country = $5,
        delivery_available = $6,
        delivery_charge = $7,
        estimated_delivery_days = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
      `,
      [
        name?.trim(),
        state?.trim() || null,
        city?.trim() || null,
        postal_code?.trim(),
        country?.trim() || "India",
        delivery_available ?? true,
        Number(delivery_charge) || 0,
        Number(estimated_delivery_days) || 1,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Delivery zone updated successfully",
      zone: result.rows[0],
    });
  } catch (error) {
    console.error("Update delivery zone error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update delivery zone",
    });
  }
};


// DELETE delivery zone
const deleteDeliveryZone = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM delivery_zones WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Delivery zone not found",
      });
    }

    res.json({
      success: true,
      message: "Delivery zone deleted successfully",
    });
  } catch (error) {
    console.error("Delete delivery zone error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete delivery zone",
    });
  }
};


// PUBLIC: check delivery availability by pincode
const checkDeliveryAvailability = async (req, res) => {
  const { pincode } = req.query;

  try {
    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required",
      });
    }

    const cleanPincode = String(pincode).trim();

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
  WHERE TRIM(CAST(postal_code AS TEXT)) = $1
  ORDER BY delivery_available DESC, id DESC
  LIMIT 1
  `,
      [cleanPincode]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        available: false,
        message: "Delivery is not available in this location.",
      });
    }

    const zone = result.rows[0];

    if (!zone.delivery_available) {
      return res.json({
        success: true,
        available: false,
        message: "Delivery is currently unavailable in this location.",
        zone,
      });
    }

    res.json({
      success: true,
      available: true,
      pincode: cleanPincode,
      deliveryCharge: Number(zone.delivery_charge),
      estimatedDeliveryDays: Number(zone.estimated_delivery_days),
      zone,
    });
  } catch (error) {
    console.error("Check delivery availability error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to check delivery availability",
    });
  }
};


module.exports = {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  checkDeliveryAvailability,
};