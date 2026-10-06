const pool = require("../config/db");

const {
  notifyLowStock,
  notifyOutOfStock,
  emitCreatedAdminNotification,
} = require("../utils/adminNotificationEvents");

// =====================================
// GET INVENTORY
// =====================================

const getInventory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pv.id AS variant_id,
        pv.product_id,
        p.name AS product_name,
        p.is_active AS product_active,

        c.name AS category_name,

        pv.bottle_size,
        pv.vintage,
        pv.sku,
        pv.batch_lot,
        pv.mrp,
        pv.selling_price,
        pv.stock_quantity,
        pv.is_active AS variant_active,

        CASE
          WHEN pv.stock_quantity <= 0 THEN 'Out of Stock'
          WHEN pv.stock_quantity <= 10 THEN 'Low Stock'
          ELSE 'In Stock'
        END AS stock_status,

        pv.created_at,
        pv.updated_at

      FROM product_variants pv

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      ORDER BY
        p.name ASC,
        pv.bottle_size ASC,
        pv.vintage ASC,
        pv.id ASC
    `);

    return res.json({
      success: true,

      inventory: result.rows.map((item) => ({
        variantId:
          item.variant_id,

        productId:
          item.product_id,

        productName:
          item.product_name,

        productActive:
          item.product_active,

        categoryName:
          item.category_name,

        bottleSize:
          item.bottle_size,

        vintage:
          item.vintage,

        sku:
          item.sku,

        batchLot:
          item.batch_lot,

        mrp:
          Number(item.mrp || 0),

        sellingPrice:
          Number(item.selling_price || 0),

        stockQuantity:
          Number(item.stock_quantity || 0),

        variantActive:
          item.variant_active,

        stockStatus:
          item.stock_status,

        createdAt:
          item.created_at,

        updatedAt:
          item.updated_at,
      })),
    });
  } catch (error) {
    console.error(
      "Get inventory error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load inventory",
      error:
        error.message,
    });
  }
};

// =====================================
// ADD STOCK
// =====================================

const addStock = async (req, res) => {
  const client = await pool.connect();

  try {
    const variantId =
      Number(req.params.variantId);

    const {
      quantity,
      batch_lot = null,
      notes = "",
    } = req.body || {};

    const stockQuantity =
      Number(quantity);

    if (
      !Number.isInteger(variantId) ||
      variantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product variant ID",
      });
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock quantity must be a positive whole number",
      });
    }

    await client.query("BEGIN");

    // =====================================
    // LOCK VARIANT
    // =====================================

    const variantResult =
      await client.query(
        `
        SELECT
          pv.id,
          pv.product_id,
          pv.stock_quantity,
          pv.batch_lot,
          p.name AS product_name

        FROM product_variants pv

        INNER JOIN products p
          ON p.id = pv.product_id

        WHERE pv.id = $1

        FOR UPDATE
        `,
        [variantId]
      );

    if (
      variantResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Product variant not found",
      });
    }

    const variant =
      variantResult.rows[0];

    const oldStock =
      Number(
        variant.stock_quantity || 0
      );

    const newStock =
      oldStock + stockQuantity;

    // =====================================
    // UPDATE STOCK
    // =====================================

    await client.query(
      `
      UPDATE product_variants

      SET
        stock_quantity = $1,
        batch_lot =
          COALESCE($2, batch_lot),
        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $3
      `,
      [
        newStock,
        batch_lot || null,
        variantId,
      ]
    );

    // =====================================
    // CREATE INVENTORY MOVEMENT
    // =====================================

    await client.query(
      `
      INSERT INTO inventory_movements (
        product_variant_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        NULL,
        $5,
        CURRENT_TIMESTAMP
      )
      `,
      [
        variantId,
        "Stock In",
        stockQuantity,
        "ADMIN",
        notes ||
          `Stock added by admin`,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,

      message:
        "Stock added successfully",

      inventory: {
        variantId,

        productId:
          variant.product_id,

        productName:
          variant.product_name,

        previousStock:
          oldStock,

        addedQuantity:
          stockQuantity,

        currentStock:
          newStock,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Add stock rollback error:",
        rollbackError
      );
    }

    console.error(
      "Add stock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add stock",
      error:
        error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================
// REMOVE STOCK
// =====================================

const removeStock = async (req, res) => {
  const client = await pool.connect();

  try {
    const variantId =
      Number(req.params.variantId);

    const {
      quantity,
      notes = "",
    } = req.body || {};

    const stockQuantity =
      Number(quantity);

    if (
      !Number.isInteger(variantId) ||
      variantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product variant ID",
      });
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock quantity must be a positive whole number",
      });
    }

    await client.query("BEGIN");

    // =====================================
    // LOCK VARIANT
    // =====================================

    const variantResult =
      await client.query(
        `
        SELECT
          pv.id,
          pv.product_id,
          pv.stock_quantity,
          p.name AS product_name

        FROM product_variants pv

        INNER JOIN products p
          ON p.id = pv.product_id

        WHERE pv.id = $1

        FOR UPDATE
        `,
        [variantId]
      );

    if (
      variantResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Product variant not found",
      });
    }

    const variant =
      variantResult.rows[0];

    const oldStock =
      Number(
        variant.stock_quantity || 0
      );

    // =====================================
    // PREVENT NEGATIVE STOCK
    // =====================================

    if (
      stockQuantity > oldStock
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          `Cannot remove ${stockQuantity} bottle(s). Current stock is only ${oldStock}.`,
      });
    }

    const newStock =
      oldStock - stockQuantity;

    // =====================================
    // UPDATE STOCK
    // =====================================

    await client.query(
      `
      UPDATE product_variants

      SET
        stock_quantity = $1,
        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $2
      `,
      [
        newStock,
        variantId,
      ]
    );

    // =====================================
    // CREATE INVENTORY MOVEMENT
    // =====================================

    await client.query(
      `
      INSERT INTO inventory_movements (
        product_variant_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        NULL,
        $5,
        CURRENT_TIMESTAMP
      )
      `,
      [
        variantId,
        "Stock Out",
        stockQuantity,
        "ADMIN",
        notes ||
          `Stock removed by admin`,
      ]
    );

    // =====================================
    // CREATE STOCK NOTIFICATION
    // =====================================

    let adminNotification = null;

    // =====================================
    // OUT OF STOCK
    // =====================================

    if (newStock === 0) {
      adminNotification =
        await notifyOutOfStock(
          client,
          {
            variantId,

            productName:
              variant.product_name,
          }
        );
    }

    // =====================================
    // LOW STOCK
    // =====================================

    else if (newStock <= 10) {
      adminNotification =
        await notifyLowStock(
          client,
          {
            variantId,

            productName:
              variant.product_name,

            stockQuantity:
              newStock,
          }
        );
    }

    // =====================================
    // COMMIT
    // =====================================

    await client.query("COMMIT");

    // =====================================
    // EMIT AFTER COMMIT
    // =====================================

    if (adminNotification) {
      emitCreatedAdminNotification(
        adminNotification
      );
    }

    return res.json({
      success: true,

      message:
        "Stock removed successfully",

      inventory: {
        variantId,

        productId:
          variant.product_id,

        productName:
          variant.product_name,

        previousStock:
          oldStock,

        removedQuantity:
          stockQuantity,

        currentStock:
          newStock,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Remove stock rollback error:",
        rollbackError
      );
    }

    console.error(
      "Remove stock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove stock",
      error:
        error.message,
    });
  } finally {
    client.release();
  }
};

// =====================================
// GET INVENTORY HISTORY
// =====================================

const getInventoryHistory = async (
  req,
  res
) => {
  try {
    const variantId =
      Number(req.params.variantId);

    if (
      !Number.isInteger(variantId) ||
      variantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product variant ID",
      });
    }

    const result =
      await pool.query(
        `
        SELECT
          im.id,
          im.product_variant_id,
          im.movement_type,
          im.quantity,
          im.reference_type,
          im.reference_id,
          im.notes,
          im.created_at,

          pv.sku,
          pv.bottle_size,
          pv.vintage,
          pv.batch_lot,

          p.name AS product_name,

          o.order_number

        FROM inventory_movements im

        INNER JOIN product_variants pv
          ON pv.id =
            im.product_variant_id

        INNER JOIN products p
          ON p.id =
            pv.product_id

        LEFT JOIN orders o
          ON im.reference_type = 'ORDER'
          AND o.id = im.reference_id

        WHERE im.product_variant_id = $1

        ORDER BY
          im.created_at DESC,
          im.id DESC
        `,
        [variantId]
      );

    return res.json({
      success: true,

      history:
        result.rows.map(
          (item) => ({
            id:
              item.id,

            productVariantId:
              item.product_variant_id,

            productName:
              item.product_name,

            sku:
              item.sku,

            bottleSize:
              item.bottle_size,

            vintage:
              item.vintage,

            batchLot:
              item.batch_lot,

            movementType:
              item.movement_type,

            quantity:
              Number(
                item.quantity || 0
              ),

            referenceType:
              item.reference_type,

            referenceId:
              item.reference_id,

            orderNumber:
              item.order_number ||
              null,

            notes:
              item.notes || "",

            createdAt:
              item.created_at,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Get inventory history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load inventory history",
      error:
        error.message,
    });
  }
};

// =====================================
// EXPORT
// =====================================

module.exports = {
  getInventory,
  addStock,
  removeStock,
  getInventoryHistory,
};
