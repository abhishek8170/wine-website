const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| GET ALL CUSTOMERS
|--------------------------------------------------------------------------
*/
const getCustomers = async (req, res) => {
  try {
    const query = `
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.is_active,
        c.created_at,
        c.updated_at,
        c.last_login_at,
        c.profile_image_url,

        (
          SELECT COUNT(*)
          FROM orders o
          WHERE o.customer_id = c.id
        ) AS total_orders,

        (
          SELECT COALESCE(SUM(o.total_amount), 0)
          FROM orders o
          WHERE
            o.customer_id = c.id
            AND LOWER(TRIM(COALESCE(o.order_status, ''))) NOT IN (
              'cancelled',
              'canceled',
              'refunded'
            )
            AND LOWER(TRIM(COALESCE(o.payment_status, ''))) IN (
              'paid',
              'completed',
              'success',
              'successful'
            )
        ) AS total_purchases,

        (
          SELECT COUNT(*)
          FROM wishlists w
          WHERE w.customer_id = c.id
        ) AS wishlist_count,

        (
          SELECT COUNT(*)
          FROM reviews r
          WHERE
            r.customer_id = c.id
            AND r.is_active = TRUE
        ) AS review_count

      FROM customers c

      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,

      customers: result.rows.map((customer) => ({
        id: customer.id,

        firstName: customer.first_name,
        lastName: customer.last_name,

        fullName: `${customer.first_name}${
          customer.last_name
            ? ` ${customer.last_name}`
            : ""
        }`,

        email: customer.email,
        phone: customer.phone,

        isActive: customer.is_active,

        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        lastLoginAt: customer.last_login_at,

        profileImageUrl:
          customer.profile_image_url,

        totalOrders: Number(
          customer.total_orders || 0
        ),

        totalPurchases: Number(
          customer.total_purchases || 0
        ),

        wishlistCount: Number(
          customer.wishlist_count || 0
        ),

        reviewCount: Number(
          customer.review_count || 0
        ),
      })),
    });
  } catch (error) {
    console.error(
      "Admin customers error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load customers",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET CUSTOMER BY ID
|--------------------------------------------------------------------------
*/
const getCustomerById = async (req, res) => {
  const customerId = Number(req.params.id);

  if (
    !Number.isInteger(customerId) ||
    customerId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer ID",
    });
  }

  try {
    /*
    |--------------------------------------------------------------------------
    | CUSTOMER PROFILE
    |--------------------------------------------------------------------------
    */

    const customerQuery = `
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.is_active,
        c.created_at,
        c.updated_at,
        c.last_login_at,
        c.profile_image_url,

        (
          SELECT COUNT(*)
          FROM orders o
          WHERE o.customer_id = c.id
        ) AS total_orders,

        (
          SELECT COALESCE(SUM(o.total_amount), 0)
          FROM orders o
          WHERE
            o.customer_id = c.id
            AND LOWER(TRIM(COALESCE(o.order_status, ''))) NOT IN (
              'cancelled',
              'canceled',
              'refunded'
            )
            AND LOWER(TRIM(COALESCE(o.payment_status, ''))) IN (
              'paid',
              'completed',
              'success',
              'successful'
            )
        ) AS total_purchases,

        (
          SELECT COUNT(*)
          FROM wishlists w
          WHERE w.customer_id = c.id
        ) AS wishlist_count,

        (
          SELECT COUNT(*)
          FROM reviews r
          WHERE
            r.customer_id = c.id
            AND r.is_active = TRUE
        ) AS review_count

      FROM customers c

      WHERE c.id = $1
    `;


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER ADDRESSES
    |--------------------------------------------------------------------------
    */

    const addressesQuery = `
      SELECT
        id,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        address_type,
        is_default,
        created_at,
        updated_at

      FROM customer_addresses

      WHERE customer_id = $1

      ORDER BY
        is_default DESC,
        created_at DESC
    `;


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER ORDERS
    |--------------------------------------------------------------------------
    */

    const ordersQuery = `
      SELECT
        o.id,
        o.order_number,
        o.order_status,
        o.payment_status,
        o.subtotal,
        o.discount_amount,
        o.shipping_amount,
        o.tax_amount,
        o.total_amount,
        o.coupon_code,
        o.delivery_instructions,
        o.created_at,
        o.updated_at,

        (
          SELECT COUNT(*)
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) AS item_count

      FROM orders o

      WHERE o.customer_id = $1

      ORDER BY o.created_at DESC
    `;


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER WISHLIST
    |--------------------------------------------------------------------------
    */

    const wishlistQuery = `
      SELECT
        w.id,
        w.product_id,
        w.created_at,

        p.name AS product_name,
        p.image_url,
        p.category_id,
        p.vintage,
        p.country,
        p.region

      FROM wishlists w

      INNER JOIN products p
        ON p.id = w.product_id

      WHERE w.customer_id = $1

      ORDER BY w.created_at DESC
    `;


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER REVIEWS
    |--------------------------------------------------------------------------
    */

    const reviewsQuery = `
      SELECT
        r.id,
        r.product_id,
        r.rating,
        r.review_title,
        r.review_text,
        r.is_verified_purchase,
        r.is_approved,
        r.is_active,
        r.created_at,
        r.updated_at,

        p.name AS product_name,
        p.image_url AS product_image

      FROM reviews r

      INNER JOIN products p
        ON p.id = r.product_id

      WHERE r.customer_id = $1

      ORDER BY r.created_at DESC
    `;


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    const orderItemsQuery = `
      SELECT
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.product_variant_id,
        oi.product_name,
        oi.bottle_size,
        oi.vintage,
        oi.quantity,
        oi.unit_price,
        oi.discount_amount,
        oi.subtotal,
        oi.created_at,

        o.order_number

      FROM order_items oi

      INNER JOIN orders o
        ON o.id = oi.order_id

      WHERE o.customer_id = $1

      ORDER BY oi.created_at DESC
    `;


    /*
    |--------------------------------------------------------------------------
    | RUN QUERIES
    |--------------------------------------------------------------------------
    */

    const [
      customerResult,
      addressesResult,
      ordersResult,
      wishlistResult,
      reviewsResult,
      orderItemsResult,
    ] = await Promise.all([
      pool.query(customerQuery, [
        customerId,
      ]),

      pool.query(addressesQuery, [
        customerId,
      ]),

      pool.query(ordersQuery, [
        customerId,
      ]),

      pool.query(wishlistQuery, [
        customerId,
      ]),

      pool.query(reviewsQuery, [
        customerId,
      ]),

      pool.query(orderItemsQuery, [
        customerId,
      ]),
    ]);


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }


    const customer =
      customerResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    res.json({
      success: true,

      customer: {
        id: customer.id,

        firstName: customer.first_name,
        lastName: customer.last_name,

        fullName: `${customer.first_name}${
          customer.last_name
            ? ` ${customer.last_name}`
            : ""
        }`,

        email: customer.email,
        phone: customer.phone,

        isActive: customer.is_active,

        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        lastLoginAt: customer.last_login_at,

        profileImageUrl:
          customer.profile_image_url,

        totalOrders: Number(
          customer.total_orders || 0
        ),

        totalPurchases: Number(
          customer.total_purchases || 0
        ),

        wishlistCount: Number(
          customer.wishlist_count || 0
        ),

        reviewCount: Number(
          customer.review_count || 0
        ),
      },


      /*
      |--------------------------------------------------------------------------
      | ADDRESSES
      |--------------------------------------------------------------------------
      */

      addresses:
        addressesResult.rows.map(
          (address) => ({
            id: address.id,

            addressLine1:
              address.address_line_1,

            addressLine2:
              address.address_line_2,

            city: address.city,
            state: address.state,

            postalCode:
              address.postal_code,

            country: address.country,

            addressType:
              address.address_type,

            isDefault:
              address.is_default,

            createdAt:
              address.created_at,

            updatedAt:
              address.updated_at,
          })
        ),


      /*
      |--------------------------------------------------------------------------
      | ORDERS
      |--------------------------------------------------------------------------
      */

      orders:
        ordersResult.rows.map(
          (order) => ({
            id: order.id,

            orderNumber:
              order.order_number,

            orderStatus:
              order.order_status,

            paymentStatus:
              order.payment_status,

            subtotal:
              Number(order.subtotal || 0),

            discountAmount:
              Number(
                order.discount_amount || 0
              ),

            shippingAmount:
              Number(
                order.shipping_amount || 0
              ),

            taxAmount:
              Number(
                order.tax_amount || 0
              ),

            totalAmount:
              Number(
                order.total_amount || 0
              ),

            couponCode:
              order.coupon_code,

            deliveryInstructions:
              order.delivery_instructions,

            itemCount:
              Number(
                order.item_count || 0
              ),

            createdAt:
              order.created_at,

            updatedAt:
              order.updated_at,
          })
        ),


      /*
      |--------------------------------------------------------------------------
      | ORDER ITEMS
      |--------------------------------------------------------------------------
      */

      orderItems:
        orderItemsResult.rows.map(
          (item) => ({
            id: item.id,

            orderId:
              item.order_id,

            orderNumber:
              item.order_number,

            productId:
              item.product_id,

            productVariantId:
              item.product_variant_id,

            productName:
              item.product_name,

            bottleSize:
              item.bottle_size,

            vintage:
              item.vintage,

            quantity:
              Number(item.quantity || 0),

            unitPrice:
              Number(
                item.unit_price || 0
              ),

            discountAmount:
              Number(
                item.discount_amount || 0
              ),

            subtotal:
              Number(
                item.subtotal || 0
              ),

            createdAt:
              item.created_at,
          })
        ),


      /*
      |--------------------------------------------------------------------------
      | WISHLIST
      |--------------------------------------------------------------------------
      */

      wishlist:
        wishlistResult.rows.map(
          (item) => ({
            id: item.id,

            productId:
              item.product_id,

            productName:
              item.product_name,

            imageUrl:
              item.image_url,

            categoryId:
              item.category_id,

            vintage:
              item.vintage,

            country:
              item.country,

            region:
              item.region,

            createdAt:
              item.created_at,
          })
        ),


      /*
      |--------------------------------------------------------------------------
      | REVIEWS
      |--------------------------------------------------------------------------
      */

      reviews:
        reviewsResult.rows.map(
          (review) => ({
            id: review.id,

            productId:
              review.product_id,

            productName:
              review.product_name,

            productImage:
              review.product_image,

            rating:
              review.rating,

            reviewTitle:
              review.review_title,

            reviewText:
              review.review_text,

            isVerifiedPurchase:
              review.is_verified_purchase,

            isApproved:
              review.is_approved,

            isActive:
              review.is_active,

            createdAt:
              review.created_at,

            updatedAt:
              review.updated_at,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Admin customer details error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load customer details",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE CUSTOMER ACCOUNT STATUS
|--------------------------------------------------------------------------
*/
const updateCustomerStatus = async (
  req,
  res
) => {
  const customerId = Number(
    req.params.id
  );

  if (
    !Number.isInteger(customerId) ||
    customerId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer ID",
    });
  }

  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message:
        "isActive must be true or false",
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE customers

        SET
          is_active = $1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $2

        RETURNING
          id,
          first_name,
          last_name,
          email,
          phone,
          is_active,
          updated_at
      `,
      [
        isActive,
        customerId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const customer =
      result.rows[0];

    res.json({
      success: true,

      message: isActive
        ? "Customer account activated"
        : "Customer account deactivated",

      customer: {
        id: customer.id,

        firstName:
          customer.first_name,

        lastName:
          customer.last_name,

        fullName:
          `${customer.first_name}${
            customer.last_name
              ? ` ${customer.last_name}`
              : ""
          }`,

        email:
          customer.email,

        phone:
          customer.phone,

        isActive:
          customer.is_active,

        updatedAt:
          customer.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "Admin customer status error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update customer status",
      error: error.message,
    });
  }
};


module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
};