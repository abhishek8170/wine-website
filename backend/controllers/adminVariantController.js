const pool = require("../config/db");

/* =========================================================
   GET ALL VARIANTS FOR A PRODUCT
========================================================= */

const getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const productCheck = await pool.query(
      `
      SELECT id, name
      FROM products
      WHERE id = $1
      LIMIT 1
      `,
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        product_id,
        bottle_size,
        vintage,
        sku,
        batch_lot,
        mrp,
        selling_price,
        stock_quantity,
        is_active,
        created_at,
        updated_at
      FROM product_variants
      WHERE product_id = $1
      ORDER BY
        is_active DESC,
        selling_price ASC,
        id ASC
      `,
      [productId]
    );

    return res.status(200).json({
      success: true,
      product: productCheck.rows[0],
      variants: result.rows,
    });
  } catch (error) {
    console.error("Get product variants error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load product variants",
    });
  }
};

/* =========================================================
   GET SINGLE VARIANT
========================================================= */

const getProductVariantById = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        product_id,
        bottle_size,
        vintage,
        sku,
        batch_lot,
        mrp,
        selling_price,
        stock_quantity,
        is_active,
        created_at,
        updated_at
      FROM product_variants
      WHERE id = $1
        AND product_id = $2
      LIMIT 1
      `,
      [variantId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      variant: result.rows[0],
    });
  } catch (error) {
    console.error("Get product variant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load product variant",
    });
  }
};

/* =========================================================
   CREATE VARIANT
========================================================= */

const createProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      bottle_size,
      vintage,
      sku,
      batch_lot,
      mrp,
      selling_price,
      stock_quantity,
    } = req.body || {};

    /* -----------------------------------------------------
       Required fields
    ----------------------------------------------------- */

    if (!bottle_size || !String(bottle_size).trim()) {
      return res.status(400).json({
        success: false,
        message: "Bottle size is required",
      });
    }

    if (!sku || !String(sku).trim()) {
      return res.status(400).json({
        success: false,
        message: "SKU is required",
      });
    }

    if (mrp === undefined || mrp === null || mrp === "") {
      return res.status(400).json({
        success: false,
        message: "MRP is required",
      });
    }

    if (
      selling_price === undefined ||
      selling_price === null ||
      selling_price === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Selling price is required",
      });
    }

    if (
      stock_quantity === undefined ||
      stock_quantity === null ||
      stock_quantity === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity is required",
      });
    }

    /* -----------------------------------------------------
       Convert numbers
    ----------------------------------------------------- */

    const mrpValue = Number(mrp);
    const sellingPriceValue = Number(selling_price);
    const stockValue = Number(stock_quantity);

    /* -----------------------------------------------------
       Validate numbers
    ----------------------------------------------------- */

    if (!Number.isFinite(mrpValue) || mrpValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid MRP",
      });
    }

    if (
      !Number.isFinite(sellingPriceValue) ||
      sellingPriceValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid selling price",
      });
    }

    if (!Number.isInteger(stockValue) || stockValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock quantity",
      });
    }

    if (sellingPriceValue > mrpValue) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be greater than MRP",
      });
    }

    /* -----------------------------------------------------
       Check product
    ----------------------------------------------------- */

    const productCheck = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
      LIMIT 1
      `,
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* -----------------------------------------------------
       Insert variant
    ----------------------------------------------------- */

    const result = await pool.query(
      `
      INSERT INTO product_variants (
        product_id,
        bottle_size,
        vintage,
        sku,
        batch_lot,
        mrp,
        selling_price,
        stock_quantity,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      RETURNING *
      `,
      [
        productId,
        String(bottle_size).trim(),
        vintage ? String(vintage).trim() : null,
        String(sku).trim(),
        batch_lot ? String(batch_lot).trim() : null,
        mrpValue,
        sellingPriceValue,
        stockValue,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Variant created successfully",
      variant: result.rows[0],
    });
  } catch (error) {
    console.error("Create product variant error:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "SKU already exists. Please use a unique SKU.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create product variant",
    });
  }
};

/* =========================================================
   UPDATE VARIANT
========================================================= */

const updateProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const {
      bottle_size,
      vintage,
      sku,
      batch_lot,
      mrp,
      selling_price,
      stock_quantity,
    } = req.body || {};

    /* -----------------------------------------------------
       Get existing variant
    ----------------------------------------------------- */

    const existingResult = await pool.query(
      `
      SELECT *
      FROM product_variants
      WHERE id = $1
        AND product_id = $2
      LIMIT 1
      `,
      [variantId, productId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const current = existingResult.rows[0];

    /* -----------------------------------------------------
       Final values
    ----------------------------------------------------- */

    const finalBottleSize =
      bottle_size !== undefined
        ? String(bottle_size).trim()
        : current.bottle_size;

    const finalVintage =
      vintage !== undefined
        ? String(vintage).trim() || null
        : current.vintage;

    const finalSku =
      sku !== undefined
        ? String(sku).trim()
        : current.sku;

    const finalBatchLot =
      batch_lot !== undefined
        ? String(batch_lot).trim() || null
        : current.batch_lot;

    const finalMrp =
      mrp !== undefined
        ? Number(mrp)
        : Number(current.mrp);

    const finalSellingPrice =
      selling_price !== undefined
        ? Number(selling_price)
        : Number(current.selling_price);

    const finalStock =
      stock_quantity !== undefined
        ? Number(stock_quantity)
        : Number(current.stock_quantity);

    /* -----------------------------------------------------
       Validation
    ----------------------------------------------------- */

    if (!finalBottleSize) {
      return res.status(400).json({
        success: false,
        message: "Bottle size is required",
      });
    }

    if (!finalSku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required",
      });
    }

    if (!Number.isFinite(finalMrp) || finalMrp < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid MRP",
      });
    }

    if (
      !Number.isFinite(finalSellingPrice) ||
      finalSellingPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid selling price",
      });
    }

    if (
      !Number.isInteger(finalStock) ||
      finalStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock quantity",
      });
    }

    if (finalSellingPrice > finalMrp) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be greater than MRP",
      });
    }

    /* -----------------------------------------------------
       Update
    ----------------------------------------------------- */

    const result = await pool.query(
      `
      UPDATE product_variants
      SET
        bottle_size = $1,
        vintage = $2,
        sku = $3,
        batch_lot = $4,
        mrp = $5,
        selling_price = $6,
        stock_quantity = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
        AND product_id = $9
      RETURNING *
      `,
      [
        finalBottleSize,
        finalVintage,
        finalSku,
        finalBatchLot,
        finalMrp,
        finalSellingPrice,
        finalStock,
        variantId,
        productId,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Variant updated successfully",
      variant: result.rows[0],
    });
  } catch (error) {
    console.error("Update product variant error:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "SKU already exists. Please use a unique SKU.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update product variant",
    });
  }
};

/* =========================================================
   DEACTIVATE VARIANT
========================================================= */

const deleteProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const result = await pool.query(
      `
      UPDATE product_variants
      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND product_id = $2
      RETURNING
        id,
        product_id,
        bottle_size,
        vintage,
        sku,
        batch_lot,
        is_active
      `,
      [variantId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Variant deactivated successfully",
      variant: result.rows[0],
    });
  } catch (error) {
    console.error("Delete product variant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate product variant",
    });
  }
};

/* =========================================================
   ACTIVATE VARIANT
========================================================= */

const activateProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const result = await pool.query(
      `
      UPDATE product_variants
      SET
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND product_id = $2
      RETURNING
        id,
        product_id,
        bottle_size,
        vintage,
        sku,
        batch_lot,
        is_active
      `,
      [variantId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Variant activated successfully",
      variant: result.rows[0],
    });
  } catch (error) {
    console.error("Activate product variant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to activate product variant",
    });
  }
};

module.exports = {
  getProductVariants,
  getProductVariantById,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  activateProductVariant,
};