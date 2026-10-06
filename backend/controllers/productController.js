const pool = require("../config/db");

console.log("NEW PRODUCT CONTROLLER LOADED");

// =====================================================
// GET ALL PRODUCTS + SEARCH + FILTERS + SORT
// =====================================================

const getProducts = async (req, res) => {
  try {
    const {
      category,
      winery,
      country,
      region,
      grape_variety,
      vintage,
      min_price,
      max_price,
      bottle_size,
      min_alcohol,
      max_alcohol,
      body,
      sweetness,
      min_rating,
      availability,
      food_pairing,
      collection,
      sort,
    } = req.query;

    const conditions = ["p.is_active = TRUE"];
    const values = [];

    // -------------------------------------------------
    // CATEGORY
    // -------------------------------------------------

    if (category) {
      values.push(category);

      conditions.push(`
        c.slug = $${values.length}
      `);
    }

    // -------------------------------------------------
    // WINERY / BRAND
    // -------------------------------------------------

    if (winery) {
      values.push(winery);

      conditions.push(`
        w.name = $${values.length}
      `);
    }

    // -------------------------------------------------
    // COUNTRY
    // -------------------------------------------------

    if (country) {
      values.push(country);

      conditions.push(`
        LOWER(p.country) = LOWER($${values.length})
      `);
    }

    // -------------------------------------------------
    // REGION
    // -------------------------------------------------

    if (region) {
      values.push(region);

      conditions.push(`
        LOWER(p.region) = LOWER($${values.length})
      `);
    }

    // -------------------------------------------------
    // GRAPE VARIETY
    // -------------------------------------------------

    if (grape_variety) {
      values.push(grape_variety);

      conditions.push(`
        LOWER(p.grape_variety) = LOWER($${values.length})
      `);
    }

    // -------------------------------------------------
    // VINTAGE
    // -------------------------------------------------

    if (vintage) {
      values.push(vintage);

      conditions.push(`
        p.vintage = $${values.length}
      `);
    }

    // -------------------------------------------------
    // BODY
    // -------------------------------------------------

    if (body) {
      values.push(body);

      conditions.push(`
        LOWER(p.body) = LOWER($${values.length})
      `);
    }

    // -------------------------------------------------
    // SWEETNESS
    // -------------------------------------------------

    if (sweetness) {
      values.push(sweetness);

      conditions.push(`
        LOWER(p.sweetness) = LOWER($${values.length})
      `);
    }

    // -------------------------------------------------
    // MIN ALCOHOL %
    // -------------------------------------------------

    if (min_alcohol) {
      values.push(Number(min_alcohol));

      conditions.push(`
        p.alcohol_percentage >= $${values.length}
      `);
    }

    // -------------------------------------------------
    // MAX ALCOHOL %
    // -------------------------------------------------

    if (max_alcohol) {
      values.push(Number(max_alcohol));

      conditions.push(`
        p.alcohol_percentage <= $${values.length}
      `);
    }

    // -------------------------------------------------
    // BOTTLE SIZE
    // -------------------------------------------------

    if (bottle_size) {
      values.push(bottle_size);

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM product_variants pv_filter
          WHERE pv_filter.product_id = p.id
            AND pv_filter.is_active = TRUE
            AND pv_filter.bottle_size = $${values.length}
        )
      `);
    }

    // -------------------------------------------------
    // MIN PRICE
    // -------------------------------------------------

    if (min_price) {
      values.push(Number(min_price));

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM product_variants pv_filter
          WHERE pv_filter.product_id = p.id
            AND pv_filter.is_active = TRUE
            AND pv_filter.selling_price >= $${values.length}
        )
      `);
    }

    // -------------------------------------------------
    // MAX PRICE
    // -------------------------------------------------

    if (max_price) {
      values.push(Number(max_price));

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM product_variants pv_filter
          WHERE pv_filter.product_id = p.id
            AND pv_filter.is_active = TRUE
            AND pv_filter.selling_price <= $${values.length}
        )
      `);
    }

    // -------------------------------------------------
    // RATING
    // -------------------------------------------------

    if (min_rating) {
      values.push(Number(min_rating));

      conditions.push(`
        COALESCE(review_stats.average_rating, 0) >= $${values.length}
      `);
    }

    // -------------------------------------------------
    // AVAILABILITY
    // -------------------------------------------------

    if (availability === "in-stock") {
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM product_variants pv_filter
          WHERE pv_filter.product_id = p.id
            AND pv_filter.is_active = TRUE
            AND pv_filter.stock_quantity > 0
        )
      `);
    }

    if (availability === "out-of-stock") {
      conditions.push(`
        NOT EXISTS (
          SELECT 1
          FROM product_variants pv_filter
          WHERE pv_filter.product_id = p.id
            AND pv_filter.is_active = TRUE
            AND pv_filter.stock_quantity > 0
        )
      `);
    }

    // -------------------------------------------------
    // FOOD PAIRING
    // -------------------------------------------------

    if (food_pairing) {
      values.push(`%${food_pairing}%`);

      conditions.push(`
        p.food_pairing ILIKE $${values.length}
      `);
    }

    // -------------------------------------------------
    // SPECIAL COLLECTION
    // -------------------------------------------------

    // BEST SELLERS:
  

    if (collection === "best-sellers") {
      conditions.push(`
        COALESCE(sales_stats.total_sold, 0) > 0
      `);
    } else if (collection) {
      values.push(collection);

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM product_collections pc_filter
          INNER JOIN collections col_filter
            ON pc_filter.collection_id = col_filter.id
          WHERE pc_filter.product_id = p.id
            AND col_filter.slug = $${values.length}
            AND col_filter.is_active = TRUE
        )
      `);
    }

    // -------------------------------------------------
    // SORT
    // -------------------------------------------------

    let orderBy = "p.created_at DESC";

    // -------------------------------------------------
    // BEST SELLERS SORT
    // -------------------------------------------------


    if (collection === "best-sellers") {
      orderBy = `
        COALESCE(sales_stats.total_sold, 0) DESC,
        p.created_at DESC,
        p.id DESC
      `;
    } else {
      switch (sort) {
        case "price-low":
          orderBy = `
            (
              SELECT MIN(pv_sort.selling_price)
              FROM product_variants pv_sort
              WHERE pv_sort.product_id = p.id
                AND pv_sort.is_active = TRUE
            ) ASC NULLS LAST
          `;
          break;

        case "price-high":
          orderBy = `
            (
              SELECT MIN(pv_sort.selling_price)
              FROM product_variants pv_sort
              WHERE pv_sort.product_id = p.id
                AND pv_sort.is_active = TRUE
            ) DESC NULLS LAST
          `;
          break;

        case "highest-rated":
          orderBy = `
            COALESCE(review_stats.average_rating, 0) DESC,
            COALESCE(review_stats.review_count, 0) DESC
          `;
          break;

        case "newest":
          orderBy = "p.created_at DESC";
          break;

        case "popular":
          orderBy = `
            COALESCE(review_stats.review_count, 0) DESC,
            COALESCE(review_stats.average_rating, 0) DESC
          `;
          break;

        default:
          orderBy = "p.created_at DESC";
      }
    }

    // -------------------------------------------------
    // FINAL QUERY
    // -------------------------------------------------

    const query = `
      SELECT
        p.id,
        p.name,
        p.description,

        -- PRODUCT IMAGE
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
        p.is_active,

        c.name AS category_name,
        c.slug AS category_slug,

        w.name AS winery_name,

        COALESCE(review_stats.average_rating, 0) AS average_rating,
        COALESCE(review_stats.review_count, 0) AS review_count,

        -- TOTAL UNITS SOLD
        COALESCE(sales_stats.total_sold, 0)::integer AS total_sold,

        (
          SELECT json_agg(
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
          )
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = TRUE
        ) AS variants,

        (
          SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'alt_text', pi.alt_text,
              'sort_order', pi.sort_order,
              'is_primary', pi.is_primary
            )
            ORDER BY pi.sort_order ASC
          )
          FROM product_images pi
          WHERE pi.product_id = p.id
        ) AS images

      FROM products p

      INNER JOIN categories c
        ON p.category_id = c.id

      LEFT JOIN wineries w
        ON p.winery_id = w.id

      -- -------------------------------------------------
      -- REVIEW STATISTICS
      -- -------------------------------------------------

      LEFT JOIN (
        SELECT
          product_id,
          ROUND(AVG(rating)::numeric, 1) AS average_rating,
          COUNT(*) AS review_count
        FROM reviews
        WHERE is_approved = TRUE
          AND is_active = TRUE
        GROUP BY product_id
      ) review_stats
        ON p.id = review_stats.product_id

      -- -------------------------------------------------
      -- SALES STATISTICS
      -- -------------------------------------------------
      --
      -- Actual quantity purchased from order_items.
      -- Cancelled orders are excluded.
      -- -------------------------------------------------

      LEFT JOIN (
        SELECT
          oi.product_id,
          SUM(oi.quantity) AS total_sold
        FROM order_items oi

        INNER JOIN orders o
          ON o.id = oi.order_id

        WHERE LOWER(COALESCE(o.order_status, '')) <> 'cancelled'

        GROUP BY oi.product_id
      ) sales_stats
        ON p.id = sales_stats.product_id

      WHERE ${conditions.join(" AND ")}

      ORDER BY ${orderBy}
    `;

    console.log("PRODUCT FILTER QUERY:");
    console.log(query);

    console.log("PRODUCT FILTER VALUES:");
    console.log(values);

    const result = await pool.query(query, values);

    console.log("PRODUCT API RESULT:");
    console.log(JSON.stringify(result.rows, null, 2));

    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows,
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// =====================================================
// GET BEST SELLERS
// Automatically calculated from actual purchases
// =====================================================

const getBestSellers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.description,

        -- PRODUCT IMAGE
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
        p.is_active,

        c.name AS category_name,
        c.slug AS category_slug,

        w.name AS winery_name,

        COALESCE(review_stats.average_rating, 0) AS average_rating,
        COALESCE(review_stats.review_count, 0) AS review_count,

        -- TOTAL NUMBER OF UNITS PURCHASED
        COALESCE(sales_stats.total_sold, 0)::integer AS total_sold,

        (
          SELECT json_agg(
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
          )
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = TRUE
        ) AS variants,

        (
          SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'alt_text', pi.alt_text,
              'sort_order', pi.sort_order,
              'is_primary', pi.is_primary
            )
            ORDER BY pi.sort_order ASC
          )
          FROM product_images pi
          WHERE pi.product_id = p.id
        ) AS images

      FROM products p

      INNER JOIN categories c
        ON p.category_id = c.id

      LEFT JOIN wineries w
        ON p.winery_id = w.id

      -- -------------------------------------------------
      -- REVIEW STATISTICS
      -- -------------------------------------------------

      LEFT JOIN (
        SELECT
          product_id,
          ROUND(AVG(rating)::numeric, 1) AS average_rating,
          COUNT(*) AS review_count
        FROM reviews
        WHERE is_approved = TRUE
          AND is_active = TRUE
        GROUP BY product_id
      ) review_stats
        ON p.id = review_stats.product_id

      -- -------------------------------------------------
      -- SALES STATISTICS
      --
      -- Count actual quantity purchased from order_items.
      -- Cancelled orders are excluded.
      -- -------------------------------------------------

      LEFT JOIN (
        SELECT
          oi.product_id,
          SUM(oi.quantity) AS total_sold
        FROM order_items oi

        INNER JOIN orders o
          ON o.id = oi.order_id

        WHERE LOWER(COALESCE(o.order_status, '')) <> 'cancelled'

        GROUP BY oi.product_id
      ) sales_stats
        ON p.id = sales_stats.product_id

      WHERE p.is_active = TRUE

      -- Highest number of purchased units first.
      -- created_at is used only to break ties.
      ORDER BY
        COALESCE(sales_stats.total_sold, 0) DESC,
        p.created_at DESC,
        p.id DESC
    `);

    console.log("BEST SELLERS API RESULT:");
    console.log(JSON.stringify(result.rows, null, 2));

    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows,
    });
  } catch (error) {
    console.error("Error fetching best sellers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch best sellers",
    });
  }
};

// =====================================================
// GET SINGLE PRODUCT BY ID
// =====================================================

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const productResult = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.description,

        -- PRODUCT IMAGE
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
        p.is_active,

        c.name AS category_name,
        c.slug AS category_slug,

        w.name AS winery_name,

        COALESCE(review_stats.average_rating, 0) AS average_rating,
        COALESCE(review_stats.review_count, 0) AS review_count,

        (
          SELECT json_agg(
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
          )
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = TRUE
        ) AS variants,

        (
          SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'alt_text', pi.alt_text,
              'sort_order', pi.sort_order,
              'is_primary', pi.is_primary
            )
            ORDER BY pi.sort_order ASC
          )
          FROM product_images pi
          WHERE pi.product_id = p.id
        ) AS images

      FROM products p

      INNER JOIN categories c
        ON p.category_id = c.id

      LEFT JOIN wineries w
        ON p.winery_id = w.id

      LEFT JOIN (
        SELECT
          product_id,
          ROUND(AVG(rating)::numeric, 1) AS average_rating,
          COUNT(*) AS review_count
        FROM reviews
        WHERE is_approved = TRUE
          AND is_active = TRUE
        GROUP BY product_id
      ) review_stats
        ON p.id = review_stats.product_id

      WHERE p.id = $1
        AND p.is_active = TRUE
      `,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: productResult.rows[0],
    });
  } catch (error) {
    console.error("Error fetching product by ID:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  getProducts,
  getBestSellers,
  getProductById,
};