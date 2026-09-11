const pool = require("../config/db");

console.log("ORDER CONTROLLER WITH INVENTORY MOVEMENTS LOADED");

// =====================================
// GENERATE UNIQUE ORDER NUMBER
// =====================================

const generateOrderNumber = () => {
  const timestamp = Date.now();

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `VIN-${timestamp}-${random}`;
};

// =====================================
// CREATE ORDER FROM CUSTOMER CART
// =====================================

const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const customerId = req.customer.id;

    const {
      address_id,
      delivery_instructions = "",
    } = req.body || {};

    const addressId = Number(address_id);

    if (
      !Number.isInteger(addressId) ||
      addressId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid delivery address is required",
      });
    }

    await client.query("BEGIN");

    // =====================================
    // VERIFY ADDRESS
    // =====================================

    const addressResult = await client.query(
      `
      SELECT
        id,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country
      FROM customer_addresses
      WHERE id = $1
        AND customer_id = $2
      LIMIT 1
      `,
      [addressId, customerId]
    );

    if (addressResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Delivery address not found",
      });
    }

    // =====================================
    // GET CART
    // =====================================

    const cartResult = await client.query(
      `
      SELECT id
      FROM carts
      WHERE customer_id = $1
      LIMIT 1
      `,
      [customerId]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const cartId = cartResult.rows[0].id;

    // =====================================
    // GET CART ITEMS + LOCK STOCK
    // =====================================

    const cartItemsResult = await client.query(
      `
      SELECT
        ci.id AS cart_item_id,
        ci.product_variant_id,
        ci.quantity,

        p.id AS product_id,
        p.name AS product_name,
        p.vintage,

        pv.bottle_size,
        pv.mrp,
        pv.selling_price,
        pv.stock_quantity

      FROM cart_items ci

      INNER JOIN product_variants pv
        ON pv.id = ci.product_variant_id

      INNER JOIN products p
        ON p.id = pv.product_id

      WHERE ci.cart_id = $1

      ORDER BY ci.created_at ASC

      FOR UPDATE OF pv
      `,
      [cartId]
    );

    if (cartItemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // =====================================
    // CHECK STOCK
    // =====================================

    let subtotal = 0;

    for (const item of cartItemsResult.rows) {
      const quantity =
        Number(item.quantity) || 0;

      const stockQuantity =
        Number(item.stock_quantity) || 0;

      const sellingPrice =
        Number(item.selling_price) || 0;

      if (quantity <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Invalid quantity in cart",
        });
      }

      if (stockQuantity <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `${item.product_name} is currently out of stock`,
        });
      }

      if (quantity > stockQuantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `Only ${stockQuantity} bottle(s) of ${item.product_name} are available`,
        });
      }

      subtotal +=
        sellingPrice * quantity;
    }

    // =====================================
    // ORDER CALCULATIONS
    // =====================================

    const discountAmount = 0;
    const shippingAmount = 0;
    const taxAmount = 0;

    const totalAmount =
      subtotal -
      discountAmount +
      shippingAmount +
      taxAmount;

    const orderNumber =
      generateOrderNumber();

    // =====================================
    // CREATE ORDER
    // =====================================

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        customer_id,
        address_id,
        order_number,
        order_status,
        payment_status,
        subtotal,
        discount_amount,
        shipping_amount,
        tax_amount,
        total_amount,
        coupon_code,
        created_at,
        updated_at,
        delivery_instructions
      )
      VALUES (
        $1,
        $2,
        $3,
        'New Order',
        'Pending',
        $4,
        $5,
        $6,
        $7,
        $8,
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        $9
      )
      RETURNING
        id,
        order_number,
        order_status,
        payment_status,
        subtotal,
        discount_amount,
        shipping_amount,
        tax_amount,
        total_amount,
        created_at
      `,
      [
        customerId,
        addressId,
        orderNumber,
        subtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        totalAmount,
        delivery_instructions,
      ]
    );

    const order = orderResult.rows[0];

    // =====================================
    // CREATE ORDER ITEMS
    // REDUCE STOCK
    // CREATE INVENTORY MOVEMENT
    // =====================================

    for (const item of cartItemsResult.rows) {
      const quantity =
        Number(item.quantity);

      const unitPrice =
        Number(item.selling_price) || 0;

      const itemSubtotal =
        unitPrice * quantity;

      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_variant_id,
          product_name,
          bottle_size,
          vintage,
          quantity,
          unit_price,
          discount_amount,
          subtotal,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          CURRENT_TIMESTAMP
        )
        `,
        [
          order.id,
          item.product_id,
          item.product_variant_id,
          item.product_name,
          item.bottle_size,
          item.vintage,
          quantity,
          unitPrice,
          0,
          itemSubtotal,
        ]
      );

      // =====================================
      // REDUCE INVENTORY
      // =====================================

      const inventoryUpdateResult =
        await client.query(
          `
          UPDATE product_variants
          SET
            stock_quantity =
              stock_quantity - $1,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $2
            AND stock_quantity >= $1
          RETURNING
            id,
            stock_quantity
          `,
          [
            quantity,
            item.product_variant_id,
          ]
        );

      if (
        inventoryUpdateResult.rows.length === 0
      ) {
        throw new Error(
          `Stock could not be updated for product variant ${item.product_variant_id}`
        );
      }

      // =====================================
      // INVENTORY MOVEMENT
      // =====================================

      await client.query(
        `
        INSERT INTO inventory_movements (
          product_variant_id,
          movement_type,
          quantity,
          reference_type,
          reference_id,
          notes,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          CURRENT_TIMESTAMP
        )
        `,
        [
          item.product_variant_id,
          "Stock Out",
          quantity,
          "ORDER",
          order.id,
          `Stock deducted for order ${order.order_number}`,
        ]
      );
    }

    // =====================================
    // CLEAR CART
    // =====================================

    await client.query(
      `
      DELETE FROM cart_items
      WHERE cart_id = $1
      `,
      [cartId]
    );

    // =====================================
    // UPDATE CART
    // =====================================

    await client.query(
      `
      UPDATE carts
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [cartId]
    );

    // =====================================
    // COMMIT
    // =====================================

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,

      message:
        "Order placed successfully",

      order: {
        id: order.id,

        orderNumber:
          order.order_number,

        orderStatus:
          order.order_status,

        paymentStatus:
          order.payment_status,

        subtotal:
          Number(order.subtotal),

        discountAmount:
          Number(
            order.discount_amount
          ),

        shippingAmount:
          Number(
            order.shipping_amount
          ),

        taxAmount:
          Number(order.tax_amount),

        totalAmount:
          Number(
            order.total_amount
          ),

        createdAt:
          order.created_at,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create order",
    });
  } finally {
    client.release();
  }
};

// =====================================
// GET CUSTOMER ORDERS
// =====================================

const getCustomerOrders = async (
  req,
  res
) => {
  try {
    const customerId =
      req.customer.id;

    const result =
      await pool.query(
        `
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
          o.created_at,

          COUNT(oi.id)::integer
            AS item_count,

          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productVariantId', oi.product_variant_id,
                'productName', oi.product_name,
                'bottleSize', oi.bottle_size,
                'vintage', oi.vintage,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'subtotal', oi.subtotal,
                'imageUrl', pi.image_url,
                'imageAlt', pi.alt_text
              )
              ORDER BY oi.id ASC
            ) FILTER (
              WHERE oi.id IS NOT NULL
            ),
            '[]'::json
          ) AS items

        FROM orders o

        LEFT JOIN order_items oi
          ON oi.order_id = o.id

        LEFT JOIN LATERAL (
          SELECT
            image_url,
            alt_text

          FROM product_images

          WHERE product_id = oi.product_id

          ORDER BY
            is_primary DESC,
            sort_order ASC,
            id ASC

          LIMIT 1
        ) pi ON true

        WHERE o.customer_id = $1

        GROUP BY o.id

        ORDER BY o.created_at DESC
        `,
        [customerId]
      );

    const orders =
      result.rows.map(
        (order) => ({
          id:
            order.id,

          orderNumber:
            order.order_number,

          orderStatus:
            order.order_status,

          paymentStatus:
            order.payment_status,

          subtotal:
            Number(order.subtotal),

          discountAmount:
            Number(
              order.discount_amount
            ),

          shippingAmount:
            Number(
              order.shipping_amount
            ),

          taxAmount:
            Number(
              order.tax_amount
            ),

          totalAmount:
            Number(
              order.total_amount
            ),

          itemCount:
            Number(
              order.item_count
            ),

          createdAt:
            order.created_at,

          items:
            Array.isArray(order.items)
              ? order.items.map(
                  (item) => ({
                    id:
                      item.id,

                    productId:
                      item.productId,

                    productVariantId:
                      item.productVariantId,

                    productName:
                      item.productName,

                    bottleSize:
                      item.bottleSize,

                    vintage:
                      item.vintage,

                    quantity:
                      Number(
                        item.quantity || 0
                      ),

                    unitPrice:
                      Number(
                        item.unitPrice || 0
                      ),

                    subtotal:
                      Number(
                        item.subtotal || 0
                      ),

                    imageUrl:
                      item.imageUrl ||
                      null,

                    imageAlt:
                      item.imageAlt ||
                      item.productName,
                  })
                )
              : [],
        })
      );

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get customer orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load orders",
    });
  }
};

// =====================================
// GET CUSTOMER ORDER DETAILS
// =====================================

const getCustomerOrderDetails = async (
  req,
  res
) => {
  try {
    const customerId = req.customer.id;
    const orderId = Number(req.params.id);

    // =====================================
    // VALIDATE ORDER ID
    // =====================================

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // =====================================
    // GET ORDER + ADDRESS
    // =====================================

    const orderResult = await pool.query(
      `
      SELECT
        o.id,
        o.customer_id,
        o.address_id,
        o.order_number,
        o.order_status,
        o.payment_status,
        o.subtotal,
        o.discount_amount,
        o.shipping_amount,
        o.tax_amount,
        o.total_amount,
        o.coupon_code,
        o.created_at,
        o.updated_at,
        o.delivery_instructions,

        a.id AS delivery_address_id,
        a.address_line_1,
        a.address_line_2,
        a.city,
        a.state,
        a.postal_code,
        a.country

      FROM orders o

      LEFT JOIN customer_addresses a
        ON a.id = o.address_id

      WHERE o.id = $1
        AND o.customer_id = $2

      LIMIT 1
      `,
      [orderId, customerId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderRow = orderResult.rows[0];

    // =====================================
    // GET ORDER ITEMS + PRODUCT IMAGE
    // =====================================

    const itemsResult = await pool.query(
      `
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

        pi.image_url AS "imageUrl",
        pi.alt_text AS "imageAlt"

      FROM order_items oi

      LEFT JOIN LATERAL (
        SELECT
          image_url,
          alt_text

        FROM product_images

        WHERE product_id = oi.product_id

        ORDER BY
          is_primary DESC,
          sort_order ASC,
          id ASC

        LIMIT 1
      ) pi ON true

      WHERE oi.order_id = $1

      ORDER BY oi.id ASC
      `,
      [orderId]
    );

    console.log(
      "ORDER ITEMS FROM DATABASE:",
      itemsResult.rows
    );

    // =====================================
    // FORMAT ITEMS
    // =====================================

    const items = itemsResult.rows.map(
      (item) => ({
        id:
          item.id,

        orderId:
          item.order_id,

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
          Number(item.quantity),

        unitPrice:
          Number(item.unit_price),

        discountAmount:
          Number(item.discount_amount),

        subtotal:
          Number(item.subtotal),

        imageUrl:
          item.imageUrl ||
          null,

        imageAlt:
          item.imageAlt ||
          item.product_name,

        createdAt:
          item.created_at,
      })
    );

    // =====================================
    // FORMAT ADDRESS
    // =====================================

    let address = null;

    if (orderRow.delivery_address_id) {
      address = {
        id:
          orderRow.delivery_address_id,

        addressLine1:
          orderRow.address_line_1,

        addressLine2:
          orderRow.address_line_2,

        city:
          orderRow.city,

        state:
          orderRow.state,

        postalCode:
          orderRow.postal_code,

        country:
          orderRow.country,
      };
    }

    // =====================================
    // FORMAT ORDER
    // =====================================

    const order = {
      id:
        orderRow.id,

      orderNumber:
        orderRow.order_number,

      orderStatus:
        orderRow.order_status,

      paymentStatus:
        orderRow.payment_status,

      subtotal:
        Number(orderRow.subtotal),

      discountAmount:
        Number(orderRow.discount_amount),

      shippingAmount:
        Number(orderRow.shipping_amount),

      taxAmount:
        Number(orderRow.tax_amount),

      totalAmount:
        Number(orderRow.total_amount),

      couponCode:
        orderRow.coupon_code,

      deliveryInstructions:
        orderRow.delivery_instructions,

      createdAt:
        orderRow.created_at,

      updatedAt:
        orderRow.updated_at,

      address,

      items,
    };

    console.log(
      "FINAL ORDER RESPONSE:",
      JSON.stringify(order, null, 2)
    );

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get customer order details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load order details",
    });
  }
};

// =====================================
// EXPORT
// =====================================

module.exports = {
  createOrder,
  getCustomerOrders,
  getCustomerOrderDetails,
};