const pool = require("../config/db");

const {
  notifyNewReview,
  emitCreatedAdminNotification,
} = require("../utils/adminNotificationEvents");

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

// ==========================================
// CREATE CUSTOMER REVIEW
// ==========================================

const createReview = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const {
      product_id,
      rating,
      review_title,
      review_text,
    } = req.body || {};

    // ==========================================
    // CUSTOMER AUTH CHECK
    // ==========================================

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ==========================================
    // VALIDATE PRODUCT
    // ==========================================

    const productId = Number(product_id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product",
      });
    }

    // ==========================================
    // VALIDATE RATING
    // ==========================================

    const ratingValue = Number(rating);

    if (
      !Number.isInteger(ratingValue) ||
      ratingValue < 1 ||
      ratingValue > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // ==========================================
    // VALIDATE REVIEW
    // ==========================================

    const reviewText = String(
      review_text || ""
    ).trim();

    if (!reviewText) {
      return res.status(400).json({
        success: false,
        message: "Review text is required",
      });
    }

    // ==========================================
    // CHECK PRODUCT EXISTS
    // ==========================================

    const productResult = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // CHECK IF CUSTOMER ALREADY REVIEWED
    // ==========================================

    const existingReview = await pool.query(
      `
      SELECT id
      FROM reviews
      WHERE product_id = $1
        AND customer_id = $2
      LIMIT 1
      `,
      [productId, customerId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "You have already reviewed this product",
      });
    }

    // ==========================================
    // CHECK VERIFIED PURCHASE
    // ==========================================

    const purchaseResult = await pool.query(
      `
      SELECT oi.id
      FROM order_items oi

      INNER JOIN orders o
        ON o.id = oi.order_id

      WHERE o.customer_id = $1
        AND oi.product_id = $2
        AND LOWER(COALESCE(o.order_status, '')) = 'delivered'

      LIMIT 1
      `,
      [customerId, productId]
    );

    const isVerifiedPurchase =
      purchaseResult.rows.length > 0;

    // ==========================================
    // INSERT REVIEW
    // ==========================================

    const result = await pool.query(
      `
      INSERT INTO reviews (
        product_id,
        customer_id,
        rating,
        review_title,
        review_text,
        is_verified_purchase,
        is_approved,
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
        FALSE,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING
        id,
        product_id,
        customer_id,
        rating,
        review_title,
        review_text,
        is_verified_purchase,
        is_approved,
        is_active,
        created_at,
        updated_at
      `,
      [
        productId,
        customerId,
        ratingValue,
        review_title
          ? String(review_title).trim()
          : null,
        reviewText,
        isVerifiedPurchase,
      ]
    );

    // Admin notification (must never break review submission)
    try {
      const productResult = await pool.query(
        "SELECT name FROM products WHERE id = $1",
        [productId]
      );

      const adminNotification = await notifyNewReview(pool, {
        reviewId: result.rows[0].id,
        productName: productResult.rows[0]?.name || null,
        rating: ratingValue,
      });

      emitCreatedAdminNotification(adminNotification);
    } catch (notificationError) {
      console.error(
        "New review admin notification error:",
        notificationError
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Review submitted successfully. It will appear after approval.",
      review: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
    });
  }
};

module.exports = {
  getReviews,
  getProductReviews,
  createReview,
};