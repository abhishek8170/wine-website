const pool = require("../config/db");

// ============================================================
// GET ALL ACTIVE COLLECTIONS
// ============================================================
const getCollections = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.is_active,
        c.created_at,
        c.updated_at,

        CASE
          WHEN c.slug = 'new-arrivals' THEN (
            SELECT COUNT(*)::int
            FROM products p
            WHERE p.is_active = true
          )
          ELSE COUNT(
            CASE
              WHEN p.is_active = true THEN pc.product_id
            END
          )::int
        END AS product_count

      FROM collections c

      LEFT JOIN product_collections pc
        ON pc.collection_id = c.id

      LEFT JOIN products p
        ON p.id = pc.product_id

      WHERE c.is_active = true

      GROUP BY
        c.id,
        c.name,
        c.slug,
        c.description,
        c.is_active,
        c.created_at,
        c.updated_at

      ORDER BY c.id;
    `);

    res.json({
      success: true,
      collections: result.rows,
    });
  } catch (error) {
    console.error("Get collections error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch collections",
    });
  }
};


// ============================================================
// GET SINGLE COLLECTION BY SLUG
// ============================================================
const getCollectionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // ========================================================
    // NEW ARRIVALS
    //
    // New Arrivals are AUTOMATIC.
    // They do NOT depend on product_collections.
    //
    // Every active product is considered a New Arrival,
    // ordered by newest created_at first.
    // ========================================================
    if (slug === "new-arrivals") {
      const productsResult = await pool.query(`
        SELECT
          p.id,
          p.name,
          p.description,

          -- Product-level image
          -- If products.image_url is empty,
          -- use the primary product_images image.
          COALESCE(
            p.image_url,
            pi.image_url
          ) AS image_url,

          pi.alt_text,

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

          c.name AS category_name,
          c.slug AS category_slug,

          pv.id AS variant_id,
          pv.bottle_size,
          pv.sku,
          pv.mrp,
          pv.selling_price,
          pv.stock_quantity

        FROM products p

        LEFT JOIN categories c
          ON c.id = p.category_id

        LEFT JOIN LATERAL (
          SELECT
            id,
            bottle_size,
            sku,
            mrp,
            selling_price,
            stock_quantity
          FROM product_variants
          WHERE product_id = p.id
            AND is_active = true
          ORDER BY id
          LIMIT 1
        ) pv ON true

        LEFT JOIN LATERAL (
          SELECT
            image_url,
            alt_text
          FROM product_images
          WHERE product_id = p.id
          ORDER BY
            is_primary DESC,
            sort_order ASC,
            id ASC
          LIMIT 1
        ) pi ON true

        WHERE p.is_active = true

        ORDER BY
          p.created_at DESC,
          p.id DESC;
      `);

      return res.json({
        success: true,

        collection: {
          id: null,
          name: "New Arrivals",
          slug: "new-arrivals",
          description: "Our newest wines",
          is_active: true,
        },

        products: productsResult.rows,
      });
    }


    // ========================================================
    // ALL OTHER COLLECTIONS
    //
    // Premium / Limited Edition / Best Sellers etc.
    // continue using product_collections.
    // ========================================================
    const collectionResult = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM collections
      WHERE slug = $1
        AND is_active = true
      LIMIT 1;
      `,
      [slug]
    );

    if (collectionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const collection = collectionResult.rows[0];


    // ========================================================
    // GET PRODUCTS FOR NORMAL COLLECTION
    // ========================================================
    const productsResult = await pool.query(
      `
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,

        -- Use product image first.
        -- If not available, use primary product_images image.
        COALESCE(
          p.image_url,
          pi.image_url
        ) AS image_url,

        pi.alt_text,

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

        c.name AS category_name,
        c.slug AS category_slug,

        pv.id AS variant_id,
        pv.bottle_size,
        pv.sku,
        pv.mrp,
        pv.selling_price,
        pv.stock_quantity

      FROM product_collections pc

      INNER JOIN products p
        ON p.id = pc.product_id
        AND p.is_active = true

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN LATERAL (
        SELECT
          id,
          bottle_size,
          sku,
          mrp,
          selling_price,
          stock_quantity
        FROM product_variants
        WHERE product_id = p.id
          AND is_active = true
        ORDER BY id
        LIMIT 1
      ) pv ON true

      LEFT JOIN LATERAL (
        SELECT
          image_url,
          alt_text
        FROM product_images
        WHERE product_id = p.id
        ORDER BY
          is_primary DESC,
          sort_order ASC,
          id ASC
        LIMIT 1
      ) pi ON true

      WHERE pc.collection_id = $1

      ORDER BY
        p.created_at DESC,
        p.id DESC;
      `,
      [collection.id]
    );

    res.json({
      success: true,
      collection,
      products: productsResult.rows,
    });
  } catch (error) {
    console.error("Get collection by slug error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch collection",
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  getCollections,
  getCollectionBySlug,
};