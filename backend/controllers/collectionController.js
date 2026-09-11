const pool = require("../config/db");

// Get all active collections
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
        COUNT(pc.product_id)::int AS product_count
      FROM collections c
      LEFT JOIN product_collections pc
        ON pc.collection_id = c.id
      LEFT JOIN products p
        ON p.id = pc.product_id
        AND p.is_active = true
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

// Get a single collection by slug
const getCollectionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

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

    const productsResult = await pool.query(
      `
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
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

        c.name AS category_name,
        c.slug AS category_slug,

        pv.id AS variant_id,
        pv.bottle_size,
        pv.sku,
        pv.mrp,
        pv.selling_price,
        pv.stock_quantity,

        pi.image_url,
        pi.alt_text

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
        ORDER BY is_primary DESC, sort_order ASC, id ASC
        LIMIT 1
      ) pi ON true

      WHERE pc.collection_id = $1

      ORDER BY p.id DESC;
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

module.exports = {
  getCollections,
  getCollectionBySlug,
};