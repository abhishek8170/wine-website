const pool = require("../config/db");

// =====================================================
// VALIDATE CUSTOMER COUPON
// =====================================================

const validateCoupon = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const { code } = req.body || {};

    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please enter a coupon code",
      });
    }

    const couponCode = code.trim().toUpperCase();

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: "Please enter a coupon code",
      });
    }

    // =====================================================
    // GET CUSTOMER CART
    // =====================================================

    const cartResult = await pool.query(
      `
      SELECT id
      FROM carts
      WHERE customer_id = $1
      LIMIT 1
      `,
      [customerId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const cartId = cartResult.rows[0].id;

    // =====================================================
    // GET ACTUAL CART ITEMS FROM DATABASE
    // =====================================================

    const cartItemsResult = await pool.query(
      `
      SELECT
        ci.id AS cart_item_id,
        ci.product_variant_id,
        ci.quantity,

        p.id AS product_id,
        p.category_id,

        pv.selling_price,
        pv.stock_quantity

      FROM cart_items ci

      INNER JOIN product_variants pv
        ON pv.id = ci.product_variant_id

      INNER JOIN products p
        ON p.id = pv.product_id

      WHERE ci.cart_id = $1

      ORDER BY ci.created_at ASC
      `,
      [cartId]
    );

    const cartItems = cartItemsResult.rows;

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // =====================================================
    // CALCULATE ACTUAL CART SUBTOTAL
    // =====================================================

    const cartSubtotal = cartItems.reduce(
      (total, item) => {
        const price =
          Number(item.selling_price) || 0;

        const quantity =
          Number(item.quantity) || 0;

        return total + price * quantity;
      },
      0
    );

    // =====================================================
    // GET COUPON
    // =====================================================

    const couponResult = await pool.query(
      `
      SELECT
        id,
        code,
        discount_type,
        discount_value,
        minimum_order_value,
        maximum_discount,
        expiry_date,
        usage_limit,
        used_count,
        is_active
      FROM coupons
      WHERE UPPER(code) = $1
      LIMIT 1
      `,
      [couponCode]
    );

    if (couponResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const coupon = couponResult.rows[0];

    // =====================================================
    // ACTIVE CHECK
    // =====================================================

    if (!coupon.is_active) {
      return res.status(400).json({
        success: false,
        message: "This coupon is no longer active",
      });
    }

    // =====================================================
    // EXPIRY CHECK
    // =====================================================

    if (
      coupon.expiry_date &&
      new Date(coupon.expiry_date).getTime() <=
        Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }

    // =====================================================
    // USAGE LIMIT CHECK
    // =====================================================

    if (
      coupon.usage_limit !== null &&
      Number(coupon.used_count) >=
        Number(coupon.usage_limit)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This coupon has reached its usage limit",
      });
    }

    // =====================================================
    // LOAD CUSTOMER RESTRICTIONS
    // =====================================================

    const customerRestrictionResult =
      await pool.query(
        `
        SELECT customer_id
        FROM coupon_customers
        WHERE coupon_id = $1
        `,
        [coupon.id]
      );

    const customerRestrictions =
      customerRestrictionResult.rows.map(
        (row) => Number(row.customer_id)
      );

    // =====================================================
    // CUSTOMER-SPECIFIC COUPON
    // =====================================================

    if (
      customerRestrictions.length > 0 &&
      !customerRestrictions.includes(
        Number(customerId)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This coupon is not available for your account",
      });
    }

    // =====================================================
    // LOAD PRODUCT RESTRICTIONS
    // =====================================================

    const productRestrictionResult =
      await pool.query(
        `
        SELECT product_id
        FROM coupon_products
        WHERE coupon_id = $1
        `,
        [coupon.id]
      );

    const productRestrictions =
      productRestrictionResult.rows.map(
        (row) => Number(row.product_id)
      );

    // =====================================================
    // LOAD CATEGORY RESTRICTIONS
    // =====================================================

    const categoryRestrictionResult =
      await pool.query(
        `
        SELECT category_id
        FROM coupon_categories
        WHERE coupon_id = $1
        `,
        [coupon.id]
      );

    const categoryRestrictions =
      categoryRestrictionResult.rows.map(
        (row) => Number(row.category_id)
      );

    // =====================================================
    // DETERMINE ELIGIBLE CART ITEMS
    // =====================================================

    let eligibleItems = cartItems;

    // -----------------------------------------------------
    // PRODUCT-SPECIFIC COUPON
    // -----------------------------------------------------

    if (productRestrictions.length > 0) {
      eligibleItems = cartItems.filter((item) =>
        productRestrictions.includes(
          Number(item.product_id)
        )
      );
    }

    // -----------------------------------------------------
    // CATEGORY-SPECIFIC COUPON
    // -----------------------------------------------------

    if (categoryRestrictions.length > 0) {
      eligibleItems = cartItems.filter((item) =>
        categoryRestrictions.includes(
          Number(item.category_id)
        )
      );
    }

    // =====================================================
    // CHECK WHETHER RESTRICTED COUPON HAS ELIGIBLE ITEMS
    // =====================================================

    if (
      (productRestrictions.length > 0 ||
        categoryRestrictions.length > 0) &&
      eligibleItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This coupon does not apply to the products in your cart",
      });
    }

    // =====================================================
    // ELIGIBLE SUBTOTAL
    // =====================================================

    const eligibleSubtotal =
      eligibleItems.reduce(
        (total, item) => {
          const price =
            Number(item.selling_price) || 0;

          const quantity =
            Number(item.quantity) || 0;

          return total + price * quantity;
        },
        0
      );

    // =====================================================
    // MINIMUM ORDER VALUE
    //
    // For unrestricted coupons:
    //     Full cart subtotal
    //
    // For product/category coupons:
    //     Eligible subtotal
    // =====================================================

    const minimumOrderValue =
      Number(coupon.minimum_order_value) || 0;

    const minimumCheckAmount =
      productRestrictions.length > 0 ||
      categoryRestrictions.length > 0
        ? eligibleSubtotal
        : cartSubtotal;

    if (
      minimumCheckAmount <
      minimumOrderValue
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${minimumOrderValue.toLocaleString(
          "en-IN"
        )} is required for this coupon`,
      });
    }

    // =====================================================
    // CALCULATE DISCOUNT
    // =====================================================

    const discountValue =
      Number(coupon.discount_value) || 0;

    let discountAmount = 0;

    if (
      coupon.discount_type ===
      "percentage"
    ) {
      discountAmount =
        (eligibleSubtotal *
          discountValue) /
        100;
    }

    if (
      coupon.discount_type === "flat"
    ) {
      discountAmount =
        discountValue;
    }

    // =====================================================
    // MAXIMUM DISCOUNT LIMIT
    // =====================================================

    if (
      coupon.maximum_discount !== null
    ) {
      const maximumDiscount =
        Number(coupon.maximum_discount);

      if (
        Number.isFinite(
          maximumDiscount
        ) &&
        maximumDiscount >= 0
      ) {
        discountAmount =
          Math.min(
            discountAmount,
            maximumDiscount
          );
      }
    }

    // =====================================================
    // DISCOUNT CANNOT EXCEED ELIGIBLE SUBTOTAL
    // =====================================================

    discountAmount =
      Math.min(
        discountAmount,
        eligibleSubtotal
      );

    // =====================================================
    // ROUND TO 2 DECIMAL PLACES
    // =====================================================

    discountAmount =
      Math.round(
        (discountAmount +
          Number.EPSILON) *
          100
      ) / 100;

    // =====================================================
    // FINAL TOTAL
    // =====================================================

    const finalTotal =
      Math.max(
        0,
        cartSubtotal -
          discountAmount
      );

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return res.json({
      success: true,

      message: `Coupon ${coupon.code} applied successfully`,

      coupon: {
        id: coupon.id,
        code: coupon.code,

        discountType:
          coupon.discount_type,

        discountValue:
          Number(
            coupon.discount_value
          ),

        minimumOrderValue,

        maximumDiscount:
          coupon.maximum_discount ===
          null
            ? null
            : Number(
                coupon.maximum_discount
              ),

        expiryDate:
          coupon.expiry_date,
      },

      cartSubtotal,

      eligibleSubtotal,

      discountAmount,

      finalTotal,
    });
  } catch (error) {
    console.error(
      "Validate customer coupon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to validate coupon",
    });
  }
};

module.exports = {
  validateCoupon,
};