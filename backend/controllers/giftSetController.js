const pool = require("../config/db");

// =====================================================
// GET ALL GIFT SETS / COMBOS
// =====================================================

const getGiftSets = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        gs.id,
        gs.name,
        gs.description,
        gs.selling_price,
        gs.mrp,
        gs.image_url,
        gs.stock_quantity,
        gs.is_active,
        gs.created_at,
        gs.updated_at,

        COALESCE(
          json_agg(
            json_build_object(
              'id', gsi.id,
              'gift_set_id', gsi.gift_set_id,
              'product_variant_id', gsi.product_variant_id,
              'quantity', gsi.quantity,
              'product_id', p.id,
              'product_name', p.name,
              'bottle_size', pv.bottle_size,
              'sku', pv.sku,
              'selling_price', pv.selling_price,
              'stock_quantity', pv.stock_quantity
            )
            ORDER BY gsi.id ASC
          ) FILTER (WHERE gsi.id IS NOT NULL),
          '[]'::json
        ) AS items

      FROM gift_sets gs

      LEFT JOIN gift_set_items gsi
        ON gsi.gift_set_id = gs.id

      LEFT JOIN product_variants pv
        ON pv.id = gsi.product_variant_id

      LEFT JOIN products p
        ON p.id = pv.product_id

      GROUP BY
        gs.id,
        gs.name,
        gs.description,
        gs.selling_price,
        gs.mrp,
        gs.image_url,
        gs.stock_quantity,
        gs.is_active,
        gs.created_at,
        gs.updated_at

      ORDER BY gs.created_at DESC, gs.id DESC;
    `);

    return res.json({
      success: true,
      giftSets: result.rows,
    });
  } catch (error) {
    console.error("Get gift sets error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch gift sets",
    });
  }
};


// =====================================================
// GET SINGLE GIFT SET
// =====================================================

const getGiftSetById = async (req, res) => {
  try {
    const giftSetId = Number(req.params.id);

    if (!Number.isInteger(giftSetId) || giftSetId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gift set ID",
      });
    }

    const giftSetResult = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        selling_price,
        mrp,
        image_url,
        stock_quantity,
        is_active,
        created_at,
        updated_at
      FROM gift_sets
      WHERE id = $1
      LIMIT 1;
      `,
      [giftSetId]
    );

    if (giftSetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Gift set not found",
      });
    }

    const itemsResult = await pool.query(
      `
      SELECT
        gsi.id,
        gsi.gift_set_id,
        gsi.product_variant_id,
        gsi.quantity,

        pv.product_id,
        pv.bottle_size,
        pv.sku,
        pv.mrp,
        pv.selling_price,
        pv.stock_quantity,

        p.name AS product_name

      FROM gift_set_items gsi

      INNER JOIN product_variants pv
        ON pv.id = gsi.product_variant_id

      INNER JOIN products p
        ON p.id = pv.product_id

      WHERE gsi.gift_set_id = $1

      ORDER BY gsi.id ASC;
      `,
      [giftSetId]
    );

    return res.json({
      success: true,
      giftSet: {
        ...giftSetResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get gift set by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch gift set",
    });
  }
};


// =====================================================
// CREATE GIFT SET / COMBO
// =====================================================

const createGiftSet = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      description = "",
      selling_price,
      mrp,
      image_url = null,
      stock_quantity = 0,
      is_active = true,
      items = [],
    } = req.body || {};

    const cleanName = String(name || "").trim();

    const sellingPrice = Number(selling_price);
    const mrpPrice = Number(mrp);
    const stockQuantity = Number(stock_quantity);

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Gift set name is required",
      });
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid selling price is required",
      });
    }

    if (!Number.isFinite(mrpPrice) || mrpPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid MRP is required",
      });
    }

    if (sellingPrice > mrpPrice) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be greater than MRP",
      });
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity must be a valid non-negative integer",
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Gift set items must be an array",
      });
    }

    await client.query("BEGIN");

    // -------------------------------------------------
    // CREATE GIFT SET
    // -------------------------------------------------

    const giftSetResult = await client.query(
      `
      INSERT INTO gift_sets (
        name,
        description,
        selling_price,
        mrp,
        image_url,
        stock_quantity,
        is_active,
        created_at,
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
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING
        id,
        name,
        description,
        selling_price,
        mrp,
        image_url,
        stock_quantity,
        is_active,
        created_at,
        updated_at;
      `,
      [
        cleanName,
        description,
        sellingPrice,
        mrpPrice,
        image_url,
        stockQuantity,
        Boolean(is_active),
      ]
    );

    const giftSet = giftSetResult.rows[0];

    // -------------------------------------------------
    // ADD COMBO ITEMS
    // -------------------------------------------------

    const createdItems = [];

    for (const item of items) {
      const productVariantId =
        Number(item.product_variant_id);

      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(productVariantId) ||
        productVariantId <= 0
      ) {
        throw new Error(
          "Invalid product variant in gift set items"
        );
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          "Gift set item quantity must be greater than zero"
        );
      }

      // Verify variant exists and is active
      const variantResult = await client.query(
        `
        SELECT
          id,
          product_id
        FROM product_variants
        WHERE id = $1
          AND is_active = TRUE
        LIMIT 1;
        `,
        [productVariantId]
      );

      if (variantResult.rows.length === 0) {
        throw new Error(
          `Product variant ${productVariantId} not found or inactive`
        );
      }

      const itemResult = await client.query(
        `
        INSERT INTO gift_set_items (
          gift_set_id,
          product_variant_id,
          quantity,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          gift_set_id,
          product_variant_id,
          quantity,
          created_at;
        `,
        [
          giftSet.id,
          productVariantId,
          quantity,
        ]
      );

      createdItems.push(itemResult.rows[0]);
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Gift set created successfully",
      giftSet: {
        ...giftSet,
        items: createdItems,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Gift set rollback error:",
        rollbackError
      );
    }

    console.error("Create gift set error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create gift set",
    });
  } finally {
    client.release();
  }
};


// =====================================================
// UPDATE GIFT SET / COMBO
// =====================================================

const updateGiftSet = async (req, res) => {
  const client = await pool.connect();

  try {
    const giftSetId = Number(req.params.id);

    if (!Number.isInteger(giftSetId) || giftSetId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gift set ID",
      });
    }

    const {
      name,
      description = "",
      selling_price,
      mrp,
      image_url = null,
      stock_quantity = 0,
      is_active = true,
      items = [],
    } = req.body || {};

    const cleanName = String(name || "").trim();

    const sellingPrice = Number(selling_price);
    const mrpPrice = Number(mrp);
    const stockQuantity = Number(stock_quantity);

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Gift set name is required",
      });
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid selling price is required",
      });
    }

    if (!Number.isFinite(mrpPrice) || mrpPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid MRP is required",
      });
    }

    if (sellingPrice > mrpPrice) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be greater than MRP",
      });
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity must be a valid non-negative integer",
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Gift set items must be an array",
      });
    }

    await client.query("BEGIN");

    // -------------------------------------------------
    // VERIFY GIFT SET
    // -------------------------------------------------

    const existingResult = await client.query(
      `
      SELECT id
      FROM gift_sets
      WHERE id = $1
      LIMIT 1;
      `,
      [giftSetId]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Gift set not found",
      });
    }

    // -------------------------------------------------
    // UPDATE GIFT SET
    // -------------------------------------------------

    const giftSetResult = await client.query(
      `
      UPDATE gift_sets
      SET
        name = $1,
        description = $2,
        selling_price = $3,
        mrp = $4,
        image_url = $5,
        stock_quantity = $6,
        is_active = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING
        id,
        name,
        description,
        selling_price,
        mrp,
        image_url,
        stock_quantity,
        is_active,
        created_at,
        updated_at;
      `,
      [
        cleanName,
        description,
        sellingPrice,
        mrpPrice,
        image_url,
        stockQuantity,
        Boolean(is_active),
        giftSetId,
      ]
    );

    const giftSet = giftSetResult.rows[0];

    // -------------------------------------------------
    // REPLACE COMBO ITEMS
    // -------------------------------------------------

    await client.query(
      `
      DELETE FROM gift_set_items
      WHERE gift_set_id = $1;
      `,
      [giftSetId]
    );

    const updatedItems = [];

    for (const item of items) {
      const productVariantId =
        Number(item.product_variant_id);

      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(productVariantId) ||
        productVariantId <= 0
      ) {
        throw new Error(
          "Invalid product variant in gift set items"
        );
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          "Gift set item quantity must be greater than zero"
        );
      }

      const variantResult = await client.query(
        `
        SELECT
          id,
          product_id
        FROM product_variants
        WHERE id = $1
          AND is_active = TRUE
        LIMIT 1;
        `,
        [productVariantId]
      );

      if (variantResult.rows.length === 0) {
        throw new Error(
          `Product variant ${productVariantId} not found or inactive`
        );
      }

      const itemResult = await client.query(
        `
        INSERT INTO gift_set_items (
          gift_set_id,
          product_variant_id,
          quantity,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          gift_set_id,
          product_variant_id,
          quantity,
          created_at;
        `,
        [
          giftSetId,
          productVariantId,
          quantity,
        ]
      );

      updatedItems.push(itemResult.rows[0]);
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Gift set updated successfully",
      giftSet: {
        ...giftSet,
        items: updatedItems,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Gift set update rollback error:",
        rollbackError
      );
    }

    console.error("Update gift set error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update gift set",
    });
  } finally {
    client.release();
  }
};


// =====================================================
// UPDATE GIFT SET STATUS
// =====================================================

const updateGiftSetStatus = async (req, res) => {
  try {
    const giftSetId = Number(req.params.id);

    if (!Number.isInteger(giftSetId) || giftSetId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gift set ID",
      });
    }

    const { is_active } = req.body || {};

    const active =
      is_active === true ||
      is_active === "true";

    const result = await pool.query(
      `
      UPDATE gift_sets
      SET
        is_active = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        name,
        is_active,
        updated_at;
      `,
      [active, giftSetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Gift set not found",
      });
    }

    return res.json({
      success: true,
      message: active
        ? "Gift set activated successfully"
        : "Gift set deactivated successfully",
      giftSet: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update gift set status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update gift set status",
    });
  }
};


// =====================================================
// DELETE GIFT SET
// =====================================================

const deleteGiftSet = async (req, res) => {
  const client = await pool.connect();

  try {
    const giftSetId = Number(req.params.id);

    if (!Number.isInteger(giftSetId) || giftSetId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gift set ID",
      });
    }

    await client.query("BEGIN");

    const existingResult = await client.query(
      `
      SELECT id
      FROM gift_sets
      WHERE id = $1
      LIMIT 1;
      `,
      [giftSetId]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Gift set not found",
      });
    }

    // Remove combo items first
    await client.query(
      `
      DELETE FROM gift_set_items
      WHERE gift_set_id = $1;
      `,
      [giftSetId]
    );

    // Remove combo
    await client.query(
      `
      DELETE FROM gift_sets
      WHERE id = $1;
      `,
      [giftSetId]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Gift set deleted successfully",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Gift set delete rollback error:",
        rollbackError
      );
    }

    console.error("Delete gift set error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete gift set",
    });
  } finally {
    client.release();
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getGiftSets,
  getGiftSetById,
  createGiftSet,
  updateGiftSet,
  updateGiftSetStatus,
  deleteGiftSet,
};