const pool = require("../config/db");

// =====================================================
// GET ALL ADDRESSES
// GET /api/addresses
// =====================================================
const getAddresses = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const result = await pool.query(
      `
      SELECT
        id,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        address_type,
        is_default,
        created_at,
        updated_at
      FROM customer_addresses
      WHERE customer_id = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [customerId]
    );

    res.json({
      success: true,
      addresses: result.rows,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
};

// =====================================================
// ADD ADDRESS
// POST /api/addresses
// =====================================================
const addAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const {
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      address_type,
      is_default,
    } = req.body || {};

    // Required fields
    if (!address_line_1 || !city || !state || !postal_code) {
      return res.status(400).json({
        success: false,
        message:
          "Address line 1, city, state and postal code are required",
      });
    }

    const shouldBeDefault = Boolean(is_default);

    // If this address is going to be default,
    // remove default status from existing addresses.
    if (shouldBeDefault) {
      await pool.query(
        `
        UPDATE customer_addresses
        SET
          is_default = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $1
        `,
        [customerId]
      );
    }

    const result = await pool.query(
      `
      INSERT INTO customer_addresses (
        customer_id,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        address_type,
        is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        address_type,
        is_default,
        created_at,
        updated_at
      `,
      [
        customerId,
        address_line_1.trim(),
        address_line_2?.trim() || null,
        city.trim(),
        state.trim(),
        postal_code.trim(),
        country?.trim() || "India",
        address_type?.trim() || "Home",
        shouldBeDefault,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error("Add address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add address",
    });
  }
};

// =====================================================
// UPDATE ADDRESS
// PUT /api/addresses/:id
// =====================================================
const updateAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const addressId = req.params.id;

    const {
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      address_type,
      is_default,
    } = req.body || {};

    // Required fields
    if (!address_line_1 || !city || !state || !postal_code) {
      return res.status(400).json({
        success: false,
        message:
          "Address line 1, city, state and postal code are required",
      });
    }

    // Make sure address belongs to logged-in customer
    const existingAddress = await pool.query(
      `
      SELECT id
      FROM customer_addresses
      WHERE id = $1
      AND customer_id = $2
      `,
      [addressId, customerId]
    );

    if (existingAddress.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const shouldBeDefault = Boolean(is_default);

    // If updated address becomes default,
    // remove default from all other addresses.
    if (shouldBeDefault) {
      await pool.query(
        `
        UPDATE customer_addresses
        SET
          is_default = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $1
        AND id != $2
        `,
        [customerId, addressId]
      );
    }

    const result = await pool.query(
      `
      UPDATE customer_addresses
      SET
        address_line_1 = $1,
        address_line_2 = $2,
        city = $3,
        state = $4,
        postal_code = $5,
        country = $6,
        address_type = $7,
        is_default = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      AND customer_id = $10
      RETURNING
        id,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        address_type,
        is_default,
        created_at,
        updated_at
      `,
      [
        address_line_1.trim(),
        address_line_2?.trim() || null,
        city.trim(),
        state.trim(),
        postal_code.trim(),
        country?.trim() || "India",
        address_type?.trim() || "Home",
        shouldBeDefault,
        addressId,
        customerId,
      ]
    );

    res.json({
      success: true,
      message: "Address updated successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error("Update address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
};

// =====================================================
// DELETE ADDRESS
// DELETE /api/addresses/:id
// =====================================================
const deleteAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const addressId = req.params.id;

    // First check ownership
    const existingAddress = await pool.query(
      `
      SELECT id, is_default
      FROM customer_addresses
      WHERE id = $1
      AND customer_id = $2
      `,
      [addressId, customerId]
    );

    if (existingAddress.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = existingAddress.rows[0].is_default;

    await pool.query(
      `
      DELETE FROM customer_addresses
      WHERE id = $1
      AND customer_id = $2
      `,
      [addressId, customerId]
    );

    // If we deleted the default address,
    // automatically make the newest remaining address default.
    if (wasDefault) {
      await pool.query(
        `
        UPDATE customer_addresses
        SET
          is_default = true,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = (
          SELECT id
          FROM customer_addresses
          WHERE customer_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        )
        `,
        [customerId]
      );
    }

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
};

// =====================================================
// SET DEFAULT ADDRESS
// PATCH /api/addresses/:id/default
// =====================================================
const setDefaultAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const addressId = req.params.id;

    // Check address belongs to customer
    const existingAddress = await pool.query(
      `
      SELECT id
      FROM customer_addresses
      WHERE id = $1
      AND customer_id = $2
      `,
      [addressId, customerId]
    );

    if (existingAddress.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove default from all customer's addresses
    await pool.query(
      `
      UPDATE customer_addresses
      SET
        is_default = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $1
      `,
      [customerId]
    );

    // Set selected address as default
    const result = await pool.query(
      `
      UPDATE customer_addresses
      SET
        is_default = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      AND customer_id = $2
      RETURNING
        id,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        address_type,
        is_default,
        created_at,
        updated_at
      `,
      [addressId, customerId]
    );

    res.json({
      success: true,
      message: "Default address updated successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error("Set default address error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to set default address",
    });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};