const pool = require("../config/db");

// ==========================================
// GET APPROVED REVIEWS
// Public website reviews
// ==========================================

const getReviews = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.product_id,
        r.customer_id,
        r.rating,
        r.review_title,
        r.review_text,
        r.is_verified_purchase,
        r.created_at,

        c.first_name,
        c.last_name,

        p.name AS product_name

      FROM reviews r

      INNER JOIN customers c
        ON r.customer_id = c.id

      INNER JOIN products p
        ON r.product_id = p.id

      WHERE
        r.is_approved = TRUE
        AND r.is_active = TRUE

      ORDER BY r.created_at DESC
    `);

    const reviews = result.rows.map((review) => ({
      id: review.id,
      productId: review.product_id,
      customerId: review.customer_id,

      customerName: [review.first_name, review.last_name]
        .filter(Boolean)
        .join(" "),

      productName: review.product_name,

      rating: review.rating,
      reviewTitle: review.review_title,
      reviewText: review.review_text,

      isVerifiedPurchase: review.is_verified_purchase,

      createdAt: review.created_at,
    }));

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};


// ==========================================
// GET REVIEWS FOR ONE PRODUCT
// ==========================================

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.product_id,
        r.customer_id,
        r.rating,
        r.review_title,
        r.review_text,
        r.is_verified_purchase,
        r.created_at,

        c.first_name,
        c.last_name,

        p.name AS product_name

      FROM reviews r

      INNER JOIN customers c
        ON r.customer_id = c.id

      INNER JOIN products p
        ON r.product_id = p.id

      WHERE
        r.product_id = $1
        AND r.is_approved = TRUE
        AND r.is_active = TRUE

      ORDER BY r.created_at DESC
      `,
      [productId]
    );

    const reviews = result.rows.map((review) => ({
      id: review.id,
      productId: review.product_id,
      customerId: review.customer_id,

      customerName: [review.first_name, review.last_name]
        .filter(Boolean)
        .join(" "),

      productName: review.product_name,

      rating: review.rating,
      reviewTitle: review.review_title,
      reviewText: review.review_text,

      isVerifiedPurchase: review.is_verified_purchase,

      createdAt: review.created_at,
    }));

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Get product reviews error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product reviews",
    });
  }
};


module.exports = {
  getReviews,
  getProductReviews,
};