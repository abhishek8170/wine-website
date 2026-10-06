const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const normalizeIdArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    ),
  ];
};


const normalizeCode = (code) => {
  if (
    typeof code !== "string"
  ) {
    return "";
  }

  return code
    .trim()
    .toUpperCase();
};


/*
|--------------------------------------------------------------------------
| GET ALL COUPONS
|--------------------------------------------------------------------------
|
| GET /api/admin/coupons
|
*/

const getAdminCoupons = async (
  req,
  res
) => {
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
            SELECT json_agg(cct.category_id)
            FROM coupon_categories cct
            WHERE cct.coupon_id = c.id
          ),
          '[]'::json
        ) AS category_ids

      FROM coupons c

      ORDER BY
        c.created_at DESC,
        c.id DESC
    `);

    return res.status(200).json({
      success: true,
      coupons: result.rows,
    });
  } catch (error) {
    console.error(
      "Get admin coupons error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load coupons",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE COUPON
|--------------------------------------------------------------------------
|
| GET /api/admin/coupons/:id
|
*/

const getAdminCouponById = async (
  req,
  res
) => {
  const couponId = Number(
    req.params.id
  );

  if (
    !Number.isInteger(couponId) ||
    couponId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid coupon ID",
    });
  }

  try {
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
            SELECT json_agg(cct.category_id)
            FROM coupon_categories cct
            WHERE cct.coupon_id = c.id
          ),
          '[]'::json
        ) AS category_ids

      FROM coupons c

      WHERE c.id = $1
      `,
      [couponId]
    );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get admin coupon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load coupon",
    });
  }
};


/*
|--------------------------------------------------------------------------
| VALIDATE COUPON DATA
|--------------------------------------------------------------------------
*/

const validateCouponData = (
  body
) => {
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
  } = body || {};

  const normalizedCode =
    normalizeCode(code);

  if (!normalizedCode) {
    return {
      valid: false,
      message: "Coupon code is required",
    };
  }

  if (
    !/^[A-Z0-9_-]+$/.test(
      normalizedCode
    )
  ) {
    return {
      valid: false,
      message:
        "Coupon code can contain only letters, numbers, hyphens and underscores",
    };
  }

  if (
    !["percentage", "flat"].includes(
      discount_type
    )
  ) {
    return {
      valid: false,
      message:
        "Discount type must be percentage or flat",
    };
  }

  const discountValue =
    Number(discount_value);

  if (
    !Number.isFinite(
      discountValue
    ) ||
    discountValue <= 0
  ) {
    return {
      valid: false,
      message:
        "Discount value must be greater than 0",
    };
  }

  if (
    discount_type ===
      "percentage" &&
    discountValue > 100
  ) {
    return {
      valid: false,
      message:
        "Percentage discount cannot exceed 100",
    };
  }

  const minimumOrderValue =
    minimum_order_value ===
      undefined ||
    minimum_order_value ===
      null ||
    minimum_order_value === ""
      ? 0
      : Number(
          minimum_order_value
        );

  if (
    !Number.isFinite(
      minimumOrderValue
    ) ||
    minimumOrderValue < 0
  ) {
    return {
      valid: false,
      message:
        "Minimum order value cannot be negative",
    };
  }

  const maximumDiscount =
    maximum_discount ===
      undefined ||
    maximum_discount ===
      null ||
    maximum_discount === ""
      ? null
      : Number(
          maximum_discount
        );

  if (
    maximumDiscount !==
      null &&
    (
      !Number.isFinite(
        maximumDiscount
      ) ||
      maximumDiscount < 0
    )
  ) {
    return {
      valid: false,
      message:
        "Maximum discount cannot be negative",
    };
  }

  const usageLimit =
    usage_limit ===
      undefined ||
    usage_limit ===
      null ||
    usage_limit === ""
      ? null
      : Number(
          usage_limit
        );

  if (
    usageLimit !== null &&
    (
      !Number.isInteger(
        usageLimit
      ) ||
      usageLimit <= 0
    )
  ) {
    return {
      valid: false,
      message:
        "Usage limit must be a positive whole number",
    };
  }

  let expiryDate = null;

  if (
    expiry_date !==
      undefined &&
    expiry_date !==
      null &&
    expiry_date !== ""
  ) {
    const parsedDate =
      new Date(expiry_date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return {
        valid: false,
        message:
          "Invalid expiry date",
      };
    }

    expiryDate = expiry_date;
  }

  const customerIds =
    normalizeIdArray(
      customer_ids
    );

  const productIds =
    normalizeIdArray(
      product_ids
    );

  const categoryIds =
    normalizeIdArray(
      category_ids
    );

  /*
  |--------------------------------------------------------------------------
  | One applicability type at a time
  |--------------------------------------------------------------------------
  |
  | Everyone OR specific customers OR specific products OR specific categories
  |
  */

  const restrictionCount =
    Number(
      customerIds.length > 0
    ) +
    Number(
      productIds.length > 0
    ) +
    Number(
      categoryIds.length > 0
    );

  if (
    restrictionCount > 1
  ) {
    return {
      valid: false,
      message:
        "A coupon can target customers, products, or categories, but not multiple restriction types at the same time",
    };
  }

  return {
    valid: true,

    data: {
      code: normalizedCode,
      discount_type,
      discount_value:
        discountValue,
      minimum_order_value:
        minimumOrderValue,
      maximum_discount:
        maximumDiscount,
      expiry_date:
        expiryDate,
      usage_limit:
        usageLimit,

      customer_ids:
        customerIds,

      product_ids:
        productIds,

      category_ids:
        categoryIds,
    },
  };
};


/*
|--------------------------------------------------------------------------
| CREATE COUPON
|--------------------------------------------------------------------------
|
| POST /api/admin/coupons
|
*/

const createAdminCoupon = async (
  req,
  res
) => {
  const validation =
    validateCouponData(
      req.body
    );

  if (
    !validation.valid
  ) {
    return res.status(400).json({
      success: false,
      message:
        validation.message,
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
  } = validation.data;

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
    |--------------------------------------------------------------------------
    | Check duplicate coupon code
    |--------------------------------------------------------------------------
    */

    const existing =
      await client.query(
        `
        SELECT id
        FROM coupons
        WHERE LOWER(code) = LOWER($1)
        LIMIT 1
        `,
        [code]
      );

    if (
      existing.rows.length >
      0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(409).json({
        success: false,
        message:
          "A coupon with this code already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create coupon
    |--------------------------------------------------------------------------
    */

    const couponResult =
      await client.query(
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
          code,
          discount_type,
          discount_value,
          minimum_order_value,
          maximum_discount,
          expiry_date,
          usage_limit,
        ]
      );

    const coupon =
      couponResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Customer-specific coupon
    |--------------------------------------------------------------------------
    */

    for (
      const customerId of customer_ids
    ) {
      await client.query(
        `
        INSERT INTO coupon_customers (
          coupon_id,
          customer_id
        )
        VALUES ($1, $2)
        ON CONFLICT (
          coupon_id,
          customer_id
        )
        DO NOTHING
        `,
        [
          coupon.id,
          customerId,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Product-specific coupon
    |--------------------------------------------------------------------------
    */

    for (
      const productId of product_ids
    ) {
      await client.query(
        `
        INSERT INTO coupon_products (
          coupon_id,
          product_id
        )
        VALUES ($1, $2)
        ON CONFLICT (
          coupon_id,
          product_id
        )
        DO NOTHING
        `,
        [
          coupon.id,
          productId,
        ]
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Category-specific coupon
    |--------------------------------------------------------------------------
    */

    for (
      const categoryId of category_ids
    ) {
      await client.query(
        `
        INSERT INTO coupon_categories (
          coupon_id,
          category_id
        )
        VALUES ($1, $2)
        ON CONFLICT (
          coupon_id,
          category_id
        )
        DO NOTHING
        `,
        [
          coupon.id,
          categoryId,
        ]
      );
    }

    await client.query(
      "COMMIT"
    );

    return res.status(201).json({
      success: true,
      message:
        "Coupon created successfully",
      coupon: {
        ...coupon,
        customer_ids,
        product_ids,
        category_ids,
      },
    });
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    console.error(
      "Create admin coupon error:",
      error
    );

    if (
      error.code ===
      "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A coupon with this code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create coupon",
    });
  } finally {
    client.release();
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE COUPON
|--------------------------------------------------------------------------
|
| PUT /api/admin/coupons/:id
|
*/

const updateAdminCoupon = async (
  req,
  res
) => {
  const couponId = Number(
    req.params.id
  );

  if (
    !Number.isInteger(
      couponId
    ) ||
    couponId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid coupon ID",
    });
  }

  const validation =
    validateCouponData(
      req.body
    );

  if (
    !validation.valid
  ) {
    return res.status(400).json({
      success: false,
      message:
        validation.message,
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
  } = validation.data;

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
    |--------------------------------------------------------------------------
    | Check coupon exists
    |--------------------------------------------------------------------------
    */

    const existingCoupon =
      await client.query(
        `
        SELECT id
        FROM coupons
        WHERE id = $1
        FOR UPDATE
        `,
        [couponId]
      );

    if (
      existingCoupon.rows.length ===
      0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        success: false,
        message:
          "Coupon not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check duplicate code
    |--------------------------------------------------------------------------
    */

    const duplicate =
      await client.query(
        `
        SELECT id
        FROM coupons
        WHERE LOWER(code) = LOWER($1)
          AND id <> $2
        LIMIT 1
        `,
        [
          code,
          couponId,
        ]
      );

    if (
      duplicate.rows.length >
      0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(409).json({
        success: false,
        message:
          "A coupon with this code already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update coupon
    |--------------------------------------------------------------------------
    */

    const updateResult =
      await client.query(
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
          code,
          discount_type,
          discount_value,
          minimum_order_value,
          maximum_discount,
          expiry_date,
          usage_limit,
          couponId,
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | Reset applicability
    |--------------------------------------------------------------------------
    */

    await client.query(
      `
      DELETE FROM coupon_customers
      WHERE coupon_id = $1
      `,
      [couponId]
    );

    await client.query(
      `
      DELETE FROM coupon_products
      WHERE coupon_id = $1
      `,
      [couponId]
    );

    await client.query(
      `
      DELETE FROM coupon_categories
      WHERE coupon_id = $1
      `,
      [couponId]
    );

    /*
    |--------------------------------------------------------------------------
    | Re-create applicability
    |--------------------------------------------------------------------------
    */

    for (
      const customerId of customer_ids
    ) {
      await client.query(
        `
        INSERT INTO coupon_customers (
          coupon_id,
          customer_id
        )
        VALUES ($1, $2)
        ON CONFLICT (
          coupon_id,
          customer_id
        )
        DO NOTHING
        `,
        [
          couponId,
          customerId,
        ]
      );
    }

    for (
      const productId of product_ids
    ) {
      await client.query(
        `
        INSERT INTO coupon_products (
          coupon_id,
          product_id
        )
        VALUES ($1, $2)
        ON CONFLICT (
          coupon_id,
          product_id
        )
        DO NOTHING
        `,
        [
          couponId,
          productId,
        ]
      );
    }

    for (
      const categoryId of category_ids
    ) {
      await client.query(
        `
        INSERT INTO coupon_categories (
          coupon_id,
          category_id
        )
        VALUES ($1, $2)
        ON CONFLICT (
          coupon_id,
          category_id
        )
        DO NOTHING
        `,
        [
          couponId,
          categoryId,
        ]
      );
    }

    await client.query(
      "COMMIT"
    );

    return res.status(200).json({
      success: true,
      message:
        "Coupon updated successfully",

      coupon: {
        ...updateResult.rows[0],

        customer_ids,
        product_ids,
        category_ids,
      },
    });
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    console.error(
      "Update admin coupon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update coupon",
    });
  } finally {
    client.release();
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE COUPON STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/coupons/:id/status
|
*/

const updateAdminCouponStatus =
  async (
    req,
    res
  ) => {
    const couponId =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(
        couponId
      ) ||
      couponId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid coupon ID",
      });
    }

    const {
      is_active,
    } = req.body || {};

    if (
      typeof is_active !==
      "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "is_active must be true or false",
      });
    }

    try {
      const result =
        await pool.query(
          `
          UPDATE coupons
          SET
            is_active = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
          `,
          [
            is_active,
            couponId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Coupon not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          is_active
            ? "Coupon activated successfully"
            : "Coupon deactivated successfully",
        coupon:
          result.rows[0],
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


/*
|--------------------------------------------------------------------------
| DELETE COUPON
|--------------------------------------------------------------------------
|
| DELETE /api/admin/coupons/:id
|
*/

const deleteAdminCoupon =
  async (
    req,
    res
  ) => {
    const couponId =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(
        couponId
      ) ||
      couponId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid coupon ID",
      });
    }

    try {
      const result =
        await pool.query(
          `
          DELETE FROM coupons
          WHERE id = $1
          RETURNING id, code
          `,
          [couponId]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Coupon not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Coupon deleted successfully",
        coupon:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Delete admin coupon error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete coupon",
      });
    }
  };


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getAdminCoupons,
  getAdminCouponById,
  createAdminCoupon,
  updateAdminCoupon,
  updateAdminCouponStatus,
  deleteAdminCoupon,
};