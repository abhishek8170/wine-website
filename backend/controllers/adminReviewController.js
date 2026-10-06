const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| GET ALL REVIEWS
|--------------------------------------------------------------------------
*/

const getAdminReviews = async (req, res) => {
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
        r.is_approved,
        r.is_active,
        r.created_at,
        r.updated_at,

        p.name AS product_name,

        CONCAT_WS(
  ' ',
  c.first_name,
  c.last_name
) AS customer_name,
        c.email AS customer_email

      FROM reviews r

      LEFT JOIN products p
        ON p.id = r.product_id

      LEFT JOIN customers c
        ON c.id = r.customer_id

      ORDER BY r.created_at DESC
    `);

        return res.status(200).json({
            success: true,
            reviews: result.rows,
        });
    } catch (error) {
        console.error("Get admin reviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load reviews",
        });
    }
};


/*
|--------------------------------------------------------------------------
| UPDATE REVIEW STATUS
|--------------------------------------------------------------------------
|
| Status values:
| pending  -> is_approved false, is_active true
| approved -> is_approved true,  is_active true
| rejected -> is_approved false, is_active false
| inactive -> is_approved true,  is_active false
|
|--------------------------------------------------------------------------
*/

const updateReviewStatus = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);
        const { status } = req.body || {};

        if (!Number.isInteger(reviewId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID",
            });
        }

        const allowedStatuses = [
            "pending",
            "approved",
            "rejected",
            "inactive",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review status",
            });
        }

        let isApproved = false;
        let isActive = true;

        if (status === "approved") {
            isApproved = true;
            isActive = true;
        }

        if (status === "rejected") {
            isApproved = false;
            isActive = false;
        }

        if (status === "inactive") {
            isApproved = true;
            isActive = false;
        }

        const result = await pool.query(
            `
      UPDATE reviews
      SET
        is_approved = $1,
        is_active = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
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
            [isApproved, isActive, reviewId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Review status updated successfully",
            review: result.rows[0],
        });
    } catch (error) {
        console.error("Update admin review status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update review status",
        });
    }
};


/*
|--------------------------------------------------------------------------
| DELETE REVIEW
|--------------------------------------------------------------------------
*/

const deleteReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);

        if (!Number.isInteger(reviewId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID",
            });
        }

        const result = await pool.query(
            `
      DELETE FROM reviews
      WHERE id = $1
      RETURNING id
      `,
            [reviewId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            id: result.rows[0].id,
        });
    } catch (error) {
        console.error("Delete admin review error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete review",
        });
    }
};


module.exports = {
    getAdminReviews,
    updateReviewStatus,
    deleteReview,
};