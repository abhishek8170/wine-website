const pool = require("../config/db");

/* =========================================================
   SYNC PRIMARY PRODUCT IMAGE
========================================================= */

const syncPrimaryProductImage = async (
  client,
  productId,
  imageUrl,
  productName
) => {
  if (!imageUrl) {
    return;
  }

  const existingImage = await client.query(
    `
    SELECT id
    FROM product_images
    WHERE product_id = $1
      AND is_primary = TRUE
    ORDER BY id ASC
    LIMIT 1
    `,
    [productId]
  );

  if (existingImage.rows.length > 0) {
    await client.query(
      `
      UPDATE product_images
      SET
        image_url = $1,
        alt_text = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [
        imageUrl,
        productName || null,
        existingImage.rows[0].id,
      ]
    );

    return;
  }

  await client.query(
    `
    INSERT INTO product_images (
      product_id,
      image_url,
      alt_text,
      sort_order,
      is_primary
    )
    VALUES (
      $1,
      $2,
      $3,
      1,
      TRUE
    )
    `,
    [
      productId,
      imageUrl,
      productName || null,
    ]
  );
};


/* =========================================================
   GET ALL ADMIN PRODUCTS
========================================================= */

const getAdminProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.vintage,
        p.alcohol_percentage,
        p.region,
        p.country,
        p.grape_variety,
        p.tasting_notes,
        p.aroma,
        p.taste_profile,
        p.body,
        p.sweetness,
        p.acidity,
        p.food_pairing,
        p.serving_temperature,
        p.storage_instructions,
        p.winery_story,
        p.awards_certifications,
        p.is_active,
        p.created_at,
        p.updated_at,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', pv.id,
                'bottle_size', pv.bottle_size,
                'sku', pv.sku,
                'mrp', pv.mrp,
                'selling_price', pv.selling_price,
                'stock_quantity', pv.stock_quantity,
                'is_active', pv.is_active
              )
              ORDER BY pv.selling_price ASC
            ),
            '[]'::json
          )
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = TRUE
        ) AS variants

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      ORDER BY p.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error(
      "Get admin products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load products",
    });
  }
};


/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.vintage,
        p.alcohol_percentage,
        p.region,
        p.country,
        p.grape_variety,
        p.tasting_notes,
        p.aroma,
        p.taste_profile,
        p.body,
        p.sweetness,
        p.acidity,
        p.food_pairing,
        p.serving_temperature,
        p.storage_instructions,
        p.winery_story,
        p.awards_certifications,
        p.is_active,
        p.created_at,
        p.updated_at,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', pv.id,
                'bottle_size', pv.bottle_size,
                'sku', pv.sku,
                'mrp', pv.mrp,
                'selling_price', pv.selling_price,
                'stock_quantity', pv.stock_quantity,
                'is_active', pv.is_active
              )
              ORDER BY pv.selling_price ASC
            ),
            '[]'::json
          )
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = TRUE
        ) AS variants

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      WHERE p.id = $1

      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get admin product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load product",
    });
  }
};


/* =========================================================
   CREATE PRODUCT
========================================================= */

const createAdminProduct = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      description,
      category_id,
      image_url,

      vintage,
      alcohol_percentage,
      region,
      country,
      grape_variety,

      tasting_notes,
      aroma,
      taste_profile,

      body,
      sweetness,
      acidity,

      food_pairing,
      serving_temperature,
      storage_instructions,

      winery_story,
      awards_certifications,

      bottle_size,
      sku,
      mrp,
      selling_price,
      stock_quantity,
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (
      !bottle_size ||
      !String(bottle_size).trim()
    ) {
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

    if (
      mrp === undefined ||
      mrp === null ||
      mrp === ""
    ) {
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

    const mrpValue = Number(mrp);
    const sellingPriceValue =
      Number(selling_price);
    const stockValue =
      Number(stock_quantity);

    if (
      !Number.isFinite(mrpValue) ||
      mrpValue < 0
    ) {
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

    if (
      !Number.isInteger(stockValue) ||
      stockValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock quantity",
      });
    }

    if (
      sellingPriceValue > mrpValue
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selling price cannot be greater than MRP",
      });
    }

    const categoryCheck =
      await client.query(
        `
        SELECT id
        FROM categories
        WHERE id = $1
        LIMIT 1
        `,
        [category_id]
      );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Selected category does not exist",
      });
    }

    await client.query("BEGIN");

    const productResult =
      await client.query(
        `
        INSERT INTO products (
          name,
          description,
          category_id,
          image_url,
          vintage,
          alcohol_percentage,
          region,
          country,
          grape_variety,
          tasting_notes,
          aroma,
          taste_profile,
          body,
          sweetness,
          acidity,
          food_pairing,
          serving_temperature,
          storage_instructions,
          winery_story,
          awards_certifications,
          is_active
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,TRUE
        )
        RETURNING *
        `,
        [
          String(name).trim(),
          description || null,
          category_id,
          image_url || null,

          vintage || null,
          alcohol_percentage || null,
          region || null,
          country || null,
          grape_variety || null,

          tasting_notes || null,
          aroma || null,
          taste_profile || null,

          body || null,
          sweetness || null,
          acidity || null,

          food_pairing || null,
          serving_temperature || null,
          storage_instructions || null,

          winery_story || null,
          awards_certifications || null,
        ]
      );

    const product =
      productResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | CREATE PRIMARY PRODUCT IMAGE
    |--------------------------------------------------------------------------
    */

    if (image_url) {
      await syncPrimaryProductImage(
        client,
        product.id,
        image_url,
        product.name
      );
    }

    const variantResult =
      await client.query(
        `
        INSERT INTO product_variants (
          product_id,
          bottle_size,
          sku,
          mrp,
          selling_price,
          stock_quantity,
          is_active
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,TRUE
        )
        RETURNING *
        `,
        [
          product.id,
          String(bottle_size).trim(),
          String(sku).trim(),
          mrpValue,
          sellingPriceValue,
          stockValue,
        ]
      );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully",

      product: {
        ...product,
        variants: [
          variantResult.rows[0],
        ],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Create admin product error:",
      error
    );

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message:
          "SKU already exists. Please use a unique SKU.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create product",
    });
  } finally {
    client.release();
  }
};


/* =========================================================
   UPDATE PRODUCT
========================================================= */

const updateAdminProduct = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      name,
      description,
      category_id,
      image_url,

      vintage,
      alcohol_percentage,
      region,
      country,
      grape_variety,

      tasting_notes,
      aroma,
      taste_profile,

      body,
      sweetness,
      acidity,

      food_pairing,
      serving_temperature,
      storage_instructions,

      winery_story,
      awards_certifications,

      bottle_size,
      sku,
      mrp,
      selling_price,
      stock_quantity,
    } = req.body || {};

    const existingProduct =
      await client.query(
        `
        SELECT *
        FROM products
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );

    if (
      existingProduct.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const current =
      existingProduct.rows[0];

    if (category_id !== undefined) {
      const categoryCheck =
        await client.query(
          `
          SELECT id
          FROM categories
          WHERE id = $1
          LIMIT 1
          `,
          [category_id]
        );

      if (
        categoryCheck.rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected category does not exist",
        });
      }
    }

    const existingVariant =
      await client.query(
        `
        SELECT *
        FROM product_variants
        WHERE product_id = $1
          AND is_active = TRUE
        ORDER BY id ASC
        LIMIT 1
        `,
        [id]
      );

    const currentVariant =
      existingVariant.rows[0] || null;

    const finalBottleSize =
      bottle_size !== undefined
        ? String(bottle_size).trim()
        : currentVariant?.bottle_size ||
          "750ml";

    const finalSku =
      sku !== undefined
        ? String(sku).trim()
        : currentVariant?.sku ||
          `PRODUCT-${id}`;

    const finalMrp =
      mrp !== undefined
        ? Number(mrp)
        : Number(
            currentVariant?.mrp || 0
          );

    const finalSellingPrice =
      selling_price !== undefined
        ? Number(selling_price)
        : Number(
            currentVariant?.selling_price ||
              0
          );

    const finalStock =
      stock_quantity !== undefined
        ? Number(stock_quantity)
        : Number(
            currentVariant?.stock_quantity ||
              0
          );

    if (
      !Number.isFinite(finalMrp) ||
      finalMrp < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid MRP",
      });
    }

    if (
      !Number.isFinite(
        finalSellingPrice
      ) ||
      finalSellingPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid selling price",
      });
    }

    if (
      finalSellingPrice >
      finalMrp
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selling price cannot be greater than MRP",
      });
    }

    if (
      finalStock < 0 ||
      !Number.isInteger(finalStock)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock quantity",
      });
    }

    await client.query("BEGIN");

    const finalImageUrl =
      image_url !== undefined
        ? image_url || null
        : current.image_url || null;

    const finalProductName =
      name !== undefined
        ? String(name).trim()
        : current.name;

    const productResult =
      await client.query(
        `
        UPDATE products

        SET
          name = $1,
          description = $2,
          category_id = $3,
          image_url = $4,
          vintage = $5,
          alcohol_percentage = $6,
          region = $7,
          country = $8,
          grape_variety = $9,
          tasting_notes = $10,
          aroma = $11,
          taste_profile = $12,
          body = $13,
          sweetness = $14,
          acidity = $15,
          food_pairing = $16,
          serving_temperature = $17,
          storage_instructions = $18,
          winery_story = $19,
          awards_certifications = $20,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $21

        RETURNING *
        `,
        [
          finalProductName,

          description !== undefined
            ? description
            : current.description,

          category_id !== undefined
            ? category_id
            : current.category_id,

          finalImageUrl,

          vintage !== undefined
            ? vintage || null
            : current.vintage,

          alcohol_percentage !== undefined
            ? alcohol_percentage || null
            : current.alcohol_percentage,

          region !== undefined
            ? region || null
            : current.region,

          country !== undefined
            ? country || null
            : current.country,

          grape_variety !== undefined
            ? grape_variety || null
            : current.grape_variety,

          tasting_notes !== undefined
            ? tasting_notes || null
            : current.tasting_notes,

          aroma !== undefined
            ? aroma || null
            : current.aroma,

          taste_profile !== undefined
            ? taste_profile || null
            : current.taste_profile,

          body !== undefined
            ? body || null
            : current.body,

          sweetness !== undefined
            ? sweetness || null
            : current.sweetness,

          acidity !== undefined
            ? acidity || null
            : current.acidity,

          food_pairing !== undefined
            ? food_pairing || null
            : current.food_pairing,

          serving_temperature !== undefined
            ? serving_temperature || null
            : current.serving_temperature,

          storage_instructions !== undefined
            ? storage_instructions || null
            : current.storage_instructions,

          winery_story !== undefined
            ? winery_story || null
            : current.winery_story,

          awards_certifications !== undefined
            ? awards_certifications || null
            : current.awards_certifications,

          id,
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | SYNC IMAGE INTO product_images
    |--------------------------------------------------------------------------
    */

    if (
      image_url !== undefined &&
      image_url
    ) {
      await syncPrimaryProductImage(
        client,
        id,
        image_url,
        finalProductName
      );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE / CREATE VARIANT
    |--------------------------------------------------------------------------
    */

    let variant;

    if (currentVariant) {
      const variantResult =
        await client.query(
          `
          UPDATE product_variants

          SET
            bottle_size = $1,
            sku = $2,
            mrp = $3,
            selling_price = $4,
            stock_quantity = $5,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $6

          RETURNING *
          `,
          [
            finalBottleSize,
            finalSku,
            finalMrp,
            finalSellingPrice,
            finalStock,
            currentVariant.id,
          ]
        );

      variant =
        variantResult.rows[0];
    } else {
      const variantResult =
        await client.query(
          `
          INSERT INTO product_variants (
            product_id,
            bottle_size,
            sku,
            mrp,
            selling_price,
            stock_quantity,
            is_active
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,TRUE
          )
          RETURNING *
          `,
          [
            id,
            finalBottleSize,
            finalSku,
            finalMrp,
            finalSellingPrice,
            finalStock,
          ]
        );

      variant =
        variantResult.rows[0];
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        "Product updated successfully",

      product: {
        ...productResult.rows[0],
        variants: [variant],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update admin product error:",
      error
    );

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message:
          "SKU already exists. Please use a unique SKU.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update product",
    });
  } finally {
    client.release();
  }
};


/* =========================================================
   DEACTIVATE PRODUCT
========================================================= */

const deleteAdminProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE products

      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $1

      RETURNING
        id,
        name,
        is_active
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Product deactivated successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Deactivate product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to deactivate product",
    });
  }
};


/* =========================================================
   ACTIVATE PRODUCT
========================================================= */

const activateAdminProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE products

      SET
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $1

      RETURNING
        id,
        name,
        is_active
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Product activated successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Activate product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to activate product",
    });
  }
};


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  activateAdminProduct,
};