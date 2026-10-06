const pool = require("../config/db");
const { uploadLogo } = require("../middleware/logoUploadMiddleware");

// =====================================
// GET ADMIN SETTINGS
// =====================================

const getAdminSettings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,

        brand_name,
        logo_url,
        favicon_url,
        contact_email,
        contact_phone,
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
        age_verification_redirect_url,

        whatsapp_support_enabled,
        whatsapp_number,

        created_at,
        updated_at

      FROM general_settings

      ORDER BY updated_at DESC, id DESC

      LIMIT 1
    `);

    // =====================================
    // CREATE DEFAULT SETTINGS IF NONE EXIST
    // =====================================

    if (result.rows.length === 0) {
      const insertResult = await pool.query(`
        INSERT INTO general_settings (
          brand_name,
          currency,
          age_verification_enabled,
          age_verification_method,
          age_verification_message
        )
        VALUES (
          'VINEORA',
          'INR',
          TRUE,
          'birthdate',
          'You must be of legal drinking age to enter this website.'
        )
        RETURNING *
      `);

      return res.json({
        success: true,
        settings: insertResult.rows[0],
      });
    }

    return res.json({
      success: true,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get admin settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin settings",
    });
  }
};

// =====================================
// UPDATE ADMIN SETTINGS
// =====================================

const updateAdminSettings = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      brand_name,
      logo_url,
      favicon_url,
      contact_email,
      contact_phone,
      address,

      currency,
      tax_percentage,
      shipping_charge,
      minimum_order_value,
      coupon_enabled,

      local_pickup_enabled,
      delivery_timings,

      whatsapp_support_enabled,
      whatsapp_number,

      age_verification_enabled,
      age_verification_method,
      age_verification_message,
      age_verification_redirect_url,
    } = req.body || {};

    // =====================================
    // VALIDATION
    // =====================================

    if (
      brand_name !== undefined &&
      (
        typeof brand_name !== "string" ||
        !brand_name.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    if (
      currency !== undefined &&
      (
        typeof currency !== "string" ||
        !currency.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Currency is required",
      });
    }

    // =====================================
    // NUMERIC VALUES
    // =====================================

    const taxValue =
      tax_percentage === undefined ||
      tax_percentage === null ||
      tax_percentage === ""
        ? 0
        : Number(tax_percentage);

    const shippingValue =
      shipping_charge === undefined ||
      shipping_charge === null ||
      shipping_charge === ""
        ? 0
        : Number(shipping_charge);

    const minimumOrderValue =
      minimum_order_value === undefined ||
      minimum_order_value === null ||
      minimum_order_value === ""
        ? 0
        : Number(minimum_order_value);

    // =====================================
    // NUMERIC VALIDATION
    // =====================================

    if (
      !Number.isFinite(taxValue) ||
      taxValue < 0 ||
      taxValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tax percentage must be between 0 and 100",
      });
    }

    if (
      !Number.isFinite(shippingValue) ||
      shippingValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Shipping charge cannot be negative",
      });
    }

    if (
      !Number.isFinite(minimumOrderValue) ||
      minimumOrderValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum order value cannot be negative",
      });
    }

    // =====================================
    // NORMALIZE VALUES
    // =====================================

    const normalizedBrandName =
      brand_name === undefined
        ? "VINEORA"
        : brand_name.trim();

    const normalizedCurrency =
      currency === undefined
        ? "INR"
        : currency.trim();

    const normalizedAgeMethod =
      age_verification_method === undefined ||
      age_verification_method === null ||
      age_verification_method === ""
        ? "birthdate"
        : String(age_verification_method).trim();

    // =====================================
    // START TRANSACTION
    // =====================================

    await client.query("BEGIN");

    // =====================================
    // FIND EXISTING SETTINGS ROW
    // =====================================

    const existingResult = await client.query(`
      SELECT id
      FROM general_settings
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `);

    let result;

    // =====================================
    // UPDATE EXISTING SETTINGS
    // =====================================

    if (existingResult.rows.length > 0) {
      const settingsId = existingResult.rows[0].id;

      result = await client.query(
        `
        UPDATE general_settings
        SET

          brand_name = $1,
          logo_url = $2,
          favicon_url = $3,
          contact_email = $4,
          contact_phone = $5,
          address = $6,

          currency = $7,
          tax_percentage = $8,
          shipping_charge = $9,
          minimum_order_value = $10,
          coupon_enabled = $11,

          local_pickup_enabled = $12,
          delivery_timings = $13,

          age_verification_enabled = $14,
          age_verification_method = $15,
          age_verification_message = $16,
          age_verification_redirect_url = $17,

          whatsapp_support_enabled = $18,
          whatsapp_number = $19,

          updated_at = CURRENT_TIMESTAMP

        WHERE id = $20

        RETURNING *
        `,
        [
          normalizedBrandName,

          logo_url || null,

          favicon_url || null,

          contact_email || null,

          contact_phone || null,

          address || null,

          normalizedCurrency,

          taxValue,

          shippingValue,

          minimumOrderValue,

          coupon_enabled === undefined
            ? true
            : Boolean(coupon_enabled),

          local_pickup_enabled === undefined
            ? false
            : Boolean(local_pickup_enabled),

          delivery_timings || null,

          age_verification_enabled === undefined
            ? true
            : Boolean(age_verification_enabled),

          normalizedAgeMethod,

          age_verification_message || null,

          age_verification_redirect_url || null,

          whatsapp_support_enabled === undefined
            ? false
            : Boolean(whatsapp_support_enabled),

          whatsapp_number
            ? String(whatsapp_number).trim()
            : null,

          settingsId,
        ]
      );
    }

    // =====================================
    // CREATE SETTINGS IF NONE EXIST
    // =====================================

    else {
      result = await client.query(
        `
        INSERT INTO general_settings (
          brand_name,
          logo_url,
          favicon_url,
          contact_email,
          contact_phone,
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
          age_verification_redirect_url,

          whatsapp_support_enabled,
          whatsapp_number,

          updated_at
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,

          $7,
          $8,
          $9,
          $10,
          $11,

          $12,
          $13,

          $14,
          $15,
          $16,
          $17,

          $18,
          $19,

          CURRENT_TIMESTAMP
        )

        RETURNING *
        `,
        [
          normalizedBrandName,

          logo_url || null,

          favicon_url || null,

          contact_email || null,

          contact_phone || null,

          address || null,

          normalizedCurrency,

          taxValue,

          shippingValue,

          minimumOrderValue,

          coupon_enabled === undefined
            ? true
            : Boolean(coupon_enabled),

          local_pickup_enabled === undefined
            ? false
            : Boolean(local_pickup_enabled),

          delivery_timings || null,

          age_verification_enabled === undefined
            ? true
            : Boolean(age_verification_enabled),

          normalizedAgeMethod,

          age_verification_message || null,

          age_verification_redirect_url || null,

          whatsapp_support_enabled === undefined
            ? false
            : Boolean(whatsapp_support_enabled),

          whatsapp_number
            ? String(whatsapp_number).trim()
            : null,
        ]
      );
    }

    // =====================================
    // COMMIT
    // =====================================

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Admin settings updated successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    // =====================================
    // ROLLBACK
    // =====================================

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Settings rollback error:",
        rollbackError
      );
    }

    console.error(
      "Update admin settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update admin settings",
    });
  } finally {
    client.release();
  }
};

// =====================================
// UPLOAD ADMIN LOGO
// =====================================

const uploadAdminLogo = async (req, res) => {
  uploadLogo(req, res, async (error) => {
    if (error) {
      console.error(
        "Admin logo upload error:",
        error
      );

      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message:
            "Logo size must be 5MB or less.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Logo upload failed.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a logo image.",
      });
    }

    try {
      const logoUrl =
        `/uploads/${req.file.filename}`;

      // =====================================
      // FIND CURRENT SETTINGS
      // =====================================

      const existingResult = await pool.query(`
        SELECT id
        FROM general_settings
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `);

      // =====================================
      // UPDATE EXISTING SETTINGS
      // =====================================

      if (existingResult.rows.length > 0) {
        await pool.query(
          `
          UPDATE general_settings
          SET
            logo_url = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          `,
          [
            logoUrl,
            existingResult.rows[0].id,
          ]
        );
      }

      // =====================================
      // CREATE SETTINGS IF NONE EXIST
      // =====================================

      else {
        await pool.query(
          `
          INSERT INTO general_settings (
            brand_name,
            logo_url,
            currency,
            age_verification_enabled,
            age_verification_method,
            age_verification_message,
            updated_at
          )
          VALUES (
            'VINEORA',
            $1,
            'INR',
            TRUE,
            'birthdate',
            'You must be of legal drinking age to enter this website.',
            CURRENT_TIMESTAMP
          )
          `,
          [logoUrl]
        );
      }

      console.log(
        "ADMIN LOGO UPLOADED:",
        logoUrl
      );

      return res.status(201).json({
        success: true,
        message:
          "Logo uploaded successfully.",
        logoUrl,
      });
    } catch (dbError) {
      console.error(
        "Save admin logo error:",
        dbError
      );

      return res.status(500).json({
        success: false,
        message:
          "Logo uploaded but could not be saved to settings.",
      });
    }
  });
};

// =====================================
// EXPORT
// =====================================

module.exports = {
  getAdminSettings,
  updateAdminSettings,
  uploadAdminLogo,
};