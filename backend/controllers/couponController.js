const pool = require("../config/db");

// =====================================================
// GET ALL COUPONS
// GET /api/admin/coupons
// =====================================================

const getCoupons = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.code,
        c.discount_type,
        c.discount_value,
        c.minimum_order_value,
        c.maximum_discount,
        c.expiry_date,
        c.usage_limit,
        c.used_count,
        c.is_active,
        c.created_at,
        c.updated_at,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', cc.customer_id,
                'name',
                  TRIM(
                    COALESCE(cu.first_name, '') ||
                    ' ' ||
                    COALESCE(cu.last_name, '')
                  ),
                'email', cu.email
              )
            )
            FROM coupon_customers cc
            JOIN customers cu
              ON cu.id = cc.customer_id
            WHERE cc.coupon_id = c.id
          ),
          '[]'::json
        ) AS customers,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', cp.product_id,
                'name', p.name
              )
            )
            FROM coupon_products cp
            JOIN products p
              ON p.id = cp.product_id
            WHERE cp.coupon_id = c.id
          ),
          '[]'::json
        ) AS products,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', cat.id,
                'name', cat.name
              )
            )
            FROM coupon_categories ccat
            JOIN categories cat
              ON cat.id = ccat.category_id
            WHERE ccat.coupon_id = c.id
          ),
          '[]'::json
        ) AS categories

      FROM coupons c
      ORDER BY c.created_at DESC, c.id DESC
    `);

    return res.json({
      success: true,
      coupons: result.rows,
    });
  } catch (error) {
    console.error("Get coupons error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load coupons",
    });
  }
};

// =====================================================
// GET SINGLE COUPON
// GET /api/admin/coupons/:id
// =====================================================

const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.code,
        c.discount_type,
        c.discount_value,
        c.minimum_order_value,
        c.maximum_discount,
        c.expiry_date,
        c.usage_limit,
        c.used_count,
        c.is_active,
        c.created_at,
        c.updated_at,

        COALESCE(
          (
            SELECT json_agg(cc.customer_id)
            FROM coupon_customers cc
            WHERE cc.coupon_id = c.id
          ),
          '[]'::json
        ) AS customer_ids,

        COALESCE(
          (
            SELECT json_agg(cp.product_id)
            FROM coupon_products cp
            WHERE cp.coupon_id = c.id
          ),
          '[]'::json
        ) AS product_ids,

        COALESCE(
          (
            SELECT json_agg(ccat.category_id)
            FROM coupon_categories ccat
            WHERE ccat.coupon_id = c.id
          ),
          '[]'::json
        ) AS category_ids

      FROM coupons c
      WHERE c.id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.json({
      success: true,
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error("Get coupon error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load coupon",
    });
  }
};

// =====================================================
// CREATE COUPON
// POST /api/admin/coupons
// =====================================================

const createCoupon = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      code,
      discount_type,
      discount_value,
      minimum_order_value,
      maximum_discount,
      expiry_date,
      usage_limit,
      customer_ids,
      product_ids,
      category_ids,
    } = req.body || {};

    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (
      typeof code !== "string" ||
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const normalizedCode = code
      .trim()
      .toUpperCase();

    if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message:
          "Coupon code can contain only letters, numbers, hyphens and underscores",
      });
    }

    if (
      discount_type !== "percentage" &&
      discount_type !== "flat"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount type must be percentage or flat",
      });
    }

    const discountValue = Number(discount_value);

    if (
      !Number.isFinite(discountValue) ||
      discountValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount value",
      });
    }

    if (
      discount_type === "percentage" &&
      discountValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot be greater than 100",
      });
    }

    // =================================================
    // OPTIONAL NUMERIC VALUES
    // =================================================

    const minimumOrderValue =
      minimum_order_value === undefined ||
      minimum_order_value === null ||
      minimum_order_value === ""
        ? 0
        : Number(minimum_order_value);

    const maximumDiscount =
      maximum_discount === undefined ||
      maximum_discount === null ||
      maximum_discount === ""
        ? null
        : Number(maximum_discount);

    const usageLimit =
      usage_limit === undefined ||
      usage_limit === null ||
      usage_limit === ""
        ? null
        : Number(usage_limit);

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

    if (
      maximumDiscount !== null &&
      (
        !Number.isFinite(maximumDiscount) ||
        maximumDiscount < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum discount cannot be negative",
      });
    }

    if (
      usageLimit !== null &&
      (
        !Number.isInteger(usageLimit) ||
        usageLimit <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Usage limit must be a positive whole number",
      });
    }

    // =================================================
    // EXPIRY DATE
    // =================================================

    let expiryDate = null;

    if (
      expiry_date !== undefined &&
      expiry_date !== null &&
      expiry_date !== ""
    ) {
      const parsedDate = new Date(expiry_date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiry date",
        });
      }

      expiryDate = parsedDate;
    }

    // =================================================
    // ARRAY NORMALIZATION
    // =================================================

    const customerIds = Array.isArray(customer_ids)
      ? customer_ids
          .map(Number)
          .filter(Number.isInteger)
      : [];

    const productIds = Array.isArray(product_ids)
      ? product_ids
          .map(Number)
          .filter(Number.isInteger)
      : [];

    const categoryIds = Array.isArray(category_ids)
      ? category_ids
          .map(Number)
          .filter(Number.isInteger)
      : [];

    // =================================================
    // START TRANSACTION
    // =================================================

    await client.query("BEGIN");

    // =================================================
    // CHECK DUPLICATE COUPON CODE
    // =================================================

    const existingCoupon = await client.query(
      `
      SELECT id
      FROM coupons
      WHERE UPPER(code) = UPPER($1)
      LIMIT 1
      `,
      [normalizedCode]
    );

    if (existingCoupon.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // =================================================
    // CREATE COUPON
    // =================================================

    const couponResult = await client.query(
      `
      INSERT INTO coupons (
        code,
        discount_type,
        discount_value,
        minimum_order_value,
        maximum_discount,
        expiry_date,
        usage_limit,
        used_count,
        is_active
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        0,
        TRUE
      )
      RETURNING *
      `,
      [
        normalizedCode,
        discount_type,
        discountValue,
        minimumOrderValue,
        maximumDiscount,
        expiryDate,
        usageLimit,
      ]
    );

    const couponId = couponResult.rows[0].id;

    // =================================================
    // CUSTOMER RESTRICTIONS
    // =================================================

    for (const customerId of customerIds) {
      await client.query(
        `
        INSERT INTO coupon_customers (
          coupon_id,
          customer_id
        )
        VALUES ($1, $2)
        ON CONFLICT (coupon_id, customer_id)
        DO NOTHING
        `,
        [couponId, customerId]
      );
    }

    // =================================================
    // PRODUCT RESTRICTIONS
    // =================================================

    for (const productId of productIds) {
      await client.query(
        `
        INSERT INTO coupon_products (
          coupon_id,
          product_id
        )
        VALUES ($1, $2)
        ON CONFLICT (coupon_id, product_id)
        DO NOTHING
        `,
        [couponId, productId]
      );
    }

    // =================================================
    // CATEGORY RESTRICTIONS
    // =================================================

    for (const categoryId of categoryIds) {
      await client.query(
        `
        INSERT INTO coupon_categories (
          coupon_id,
          category_id
        )
        VALUES ($1, $2)
        ON CONFLICT (coupon_id, category_id)
        DO NOTHING
        `,
        [couponId, categoryId]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon: couponResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create coupon error:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected customers, products or categories do not exist",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
    });
  } finally {
    client.release();
  }
};

// =====================================================
// UPDATE COUPON
// PUT /api/admin/coupons/:id
// =====================================================

const updateCoupon = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const {
      code,
      discount_type,
      discount_value,
      minimum_order_value,
      maximum_discount,
      expiry_date,
      usage_limit,
      customer_ids,
      product_ids,
      category_ids,
    } = req.body || {};

    // =================================================
    // CHECK COUPON
    // =================================================

    const existing = await client.query(
      `
      SELECT *
      FROM coupons
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const currentCoupon = existing.rows[0];

    // =================================================
    // NORMALIZE VALUES
    // =================================================

    const normalizedCode =
      code === undefined
        ? currentCoupon.code
        : String(code)
            .trim()
            .toUpperCase();

    const normalizedDiscountType =
      discount_type === undefined
        ? currentCoupon.discount_type
        : discount_type;

    const discountValue =
      discount_value === undefined ||
      discount_value === null ||
      discount_value === ""
        ? Number(currentCoupon.discount_value)
        : Number(discount_value);

    const minimumOrderValue =
      minimum_order_value === undefined ||
      minimum_order_value === null ||
      minimum_order_value === ""
        ? 0
        : Number(minimum_order_value);

    const maximumDiscount =
      maximum_discount === undefined ||
      maximum_discount === null ||
      maximum_discount === ""
        ? null
        : Number(maximum_discount);

    const usageLimit =
      usage_limit === undefined ||
      usage_limit === null ||
      usage_limit === ""
        ? null
        : Number(usage_limit);

    // =================================================
    // VALIDATION
    // =================================================

    if (!normalizedCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message:
          "Coupon code can contain only letters, numbers, hyphens and underscores",
      });
    }

    if (
      normalizedDiscountType !== "percentage" &&
      normalizedDiscountType !== "flat"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount type must be percentage or flat",
      });
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount value",
      });
    }

    if (
      normalizedDiscountType === "percentage" &&
      discountValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot be greater than 100",
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

    if (
      maximumDiscount !== null &&
      (
        !Number.isFinite(maximumDiscount) ||
        maximumDiscount < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum discount cannot be negative",
      });
    }

    if (
      usageLimit !== null &&
      (
        !Number.isInteger(usageLimit) ||
        usageLimit <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Usage limit must be a positive whole number",
      });
    }

    // Do not allow lowering the usage limit
    // below the number already used.
    if (
      usageLimit !== null &&
      usageLimit < Number(currentCoupon.used_count)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Usage limit cannot be lower than current usage count",
      });
    }

    // =================================================
    // EXPIRY DATE
    // =================================================

    let expiryDate = null;

    if (
      expiry_date !== undefined &&
      expiry_date !== null &&
      expiry_date !== ""
    ) {
      const parsedDate = new Date(expiry_date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiry date",
        });
      }

      expiryDate = parsedDate;
    }

    // =================================================
    // ARRAYS
    // =================================================

    const customerIds =
      Array.isArray(customer_ids)
        ? customer_ids
            .map(Number)
            .filter(Number.isInteger)
        : [];

    const productIds =
      Array.isArray(product_ids)
        ? product_ids
            .map(Number)
            .filter(Number.isInteger)
        : [];

    const categoryIds =
      Array.isArray(category_ids)
        ? category_ids
            .map(Number)
            .filter(Number.isInteger)
        : [];

    await client.query("BEGIN");

    // =================================================
    // DUPLICATE CODE CHECK
    // =================================================

    const duplicate = await client.query(
      `
      SELECT id
      FROM coupons
      WHERE UPPER(code) = UPPER($1)
        AND id <> $2
      LIMIT 1
      `,
      [normalizedCode, id]
    );

    if (duplicate.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // =================================================
    // UPDATE COUPON
    // =================================================

    const updateResult = await client.query(
      `
      UPDATE coupons
      SET
        code = $1,
        discount_type = $2,
        discount_value = $3,
        minimum_order_value = $4,
        maximum_discount = $5,
        expiry_date = $6,
        usage_limit = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
      `,
      [
        normalizedCode,
        normalizedDiscountType,
        discountValue,
        minimumOrderValue,
        maximumDiscount,
        expiryDate,
        usageLimit,
        id,
      ]
    );

    // =================================================
    // REPLACE CUSTOMER RESTRICTIONS
    // =================================================

    await client.query(
      `
      DELETE FROM coupon_customers
      WHERE coupon_id = $1
      `,
      [id]
    );

    for (const customerId of customerIds) {
      await client.query(
        `
        INSERT INTO coupon_customers (
          coupon_id,
          customer_id
        )
        VALUES ($1, $2)
        ON CONFLICT (coupon_id, customer_id)
        DO NOTHING
        `,
        [id, customerId]
      );
    }

    // =================================================
    // REPLACE PRODUCT RESTRICTIONS
    // =================================================

    await client.query(
      `
      DELETE FROM coupon_products
      WHERE coupon_id = $1
      `,
      [id]
    );

    for (const productId of productIds) {
      await client.query(
        `
        INSERT INTO coupon_products (
          coupon_id,
          product_id
        )
        VALUES ($1, $2)
        ON CONFLICT (coupon_id, product_id)
        DO NOTHING
        `,
        [id, productId]
      );
    }

    // =================================================
    // REPLACE CATEGORY RESTRICTIONS
    // =================================================

    await client.query(
      `
      DELETE FROM coupon_categories
      WHERE coupon_id = $1
      `,
      [id]
    );

    for (const categoryId of categoryIds) {
      await client.query(
        `
        INSERT INTO coupon_categories (
          coupon_id,
          category_id
        )
        VALUES ($1, $2)
        ON CONFLICT (coupon_id, category_id)
        DO NOTHING
        `,
        [id, categoryId]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update coupon error:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected customers, products or categories do not exist",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  } finally {
    client.release();
  }
};

// =====================================================
// ACTIVATE / DEACTIVATE COUPON
// PATCH /api/admin/coupons/:id/status
// =====================================================

const updateCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body || {};

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message:
          "is_active must be true or false",
      });
    }

    const result = await pool.query(
      `
      UPDATE coupons
      SET
        is_active = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.json({
      success: true,
      message: is_active
        ? "Coupon activated successfully"
        : "Coupon deactivated successfully",
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update coupon status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update coupon status",
    });
  }
};

// =====================================================
// DELETE COUPON
// DELETE /api/admin/coupons/:id
// =====================================================

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM coupons
      WHERE id = $1
      RETURNING id, code
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.json({
      success: true,
      message: "Coupon deleted successfully",
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error("Delete coupon error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
};