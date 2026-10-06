const pool = require("../config/db");

// =====================================
// ADMIN SHIPMENT CONTROLLER
// =====================================

// Get all shipments
const getAdminShipments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.order_id,
        s.tracking_id,
        s.carrier,
        s.shipping_status,
        s.estimated_delivery_date,
        s.shipped_at,
        s.delivered_at,
        s.created_at,
        s.updated_at,

        o.order_number,
        o.order_status,
        o.payment_status,
        o.total_amount,

        c.id AS customer_id,
        CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,

        ca.address_line_1,
        ca.address_line_2,
        ca.city,
        ca.state,
        ca.postal_code,
        ca.country

      FROM shipments s

      INNER JOIN orders o
        ON o.id = s.order_id

      LEFT JOIN customers c
        ON c.id = o.customer_id

      LEFT JOIN customer_addresses ca
        ON ca.id = o.address_id

      ORDER BY s.created_at DESC
    `);

    return res.json({
      success: true,
      shipments: result.rows,
    });
  } catch (error) {
    console.error(
      "Get admin shipments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
    });
  }
};


// Get shipment by ID
const getAdminShipmentById = async (req, res) => {
  const { id } = req.params;

  try {
    const shipmentResult = await pool.query(
      `
      SELECT
        s.id,
        s.order_id,
        s.tracking_id,
        s.carrier,
        s.shipping_status,
        s.estimated_delivery_date,
        s.shipped_at,
        s.delivered_at,
        s.created_at,
        s.updated_at,

        o.order_number,
        o.order_status,
        o.payment_status,
        o.subtotal,
        o.discount_amount,
        o.shipping_amount,
        o.tax_amount,
        o.total_amount,
        o.delivery_instructions,
        o.created_at AS order_created_at,

        c.id AS customer_id,
        CONCAT(
          c.first_name,
          ' ',
          COALESCE(c.last_name, '')
        ) AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,

        ca.address_line_1,
        ca.address_line_2,
        ca.city,
        ca.state,
        ca.postal_code,
        ca.country,
        ca.address_type

      FROM shipments s

      INNER JOIN orders o
        ON o.id = s.order_id

      LEFT JOIN customers c
        ON c.id = o.customer_id

      LEFT JOIN customer_addresses ca
        ON ca.id = o.address_id

      WHERE s.id = $1
      `,
      [id]
    );

    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    const shipment = shipmentResult.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      `
      SELECT
        oi.id,
        oi.product_id,
        oi.product_variant_id,
        oi.product_name,
        oi.bottle_size,
        oi.vintage,
        oi.quantity,
        oi.unit_price,
        oi.discount_amount,
        oi.subtotal,

        pi.image_url

      FROM order_items oi

      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = oi.product_id
          AND is_primary = TRUE
        ORDER BY id ASC
        LIMIT 1
      ) pi ON TRUE

      WHERE oi.order_id = $1

      ORDER BY oi.id ASC
      `,
      [shipment.order_id]
    );

    return res.json({
      success: true,
      shipment: {
        ...shipment,
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error(
      "Get admin shipment details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipment details",
    });
  }
};


// Create shipment
const createAdminShipment = async (req, res) => {
  const {
    order_id,
    tracking_id,
    carrier,
    shipping_status,
    estimated_delivery_date,
  } = req.body;

  if (!order_id) {
    return res.status(400).json({
      success: false,
      message: "Order ID is required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check order
    const orderResult = await client.query(
      `
      SELECT
        id,
        order_number,
        order_status
      FROM orders
      WHERE id = $1
      FOR UPDATE
      `,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // One shipment per order
    const existingShipment = await client.query(
      `
      SELECT id
      FROM shipments
      WHERE order_id = $1
      LIMIT 1
      `,
      [order_id]
    );

    if (existingShipment.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "A shipment already exists for this order",
        shipmentId: existingShipment.rows[0].id,
      });
    }

    const status =
      shipping_status?.trim() || "Pending";

    const result = await client.query(
      `
      INSERT INTO shipments (
        order_id,
        tracking_id,
        carrier,
        shipping_status,
        estimated_delivery_date
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        order_id,
        tracking_id?.trim() || null,
        carrier?.trim() || null,
        status,
        estimated_delivery_date || null,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      shipment: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Create admin shipment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create shipment",
    });
  } finally {
    client.release();
  }
};


// Update shipment
const updateAdminShipment = async (req, res) => {
  const { id } = req.params;

  const {
    tracking_id,
    carrier,
    shipping_status,
    estimated_delivery_date,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `
      SELECT *
      FROM shipments
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    const existing = existingResult.rows[0];

    const nextStatus =
      shipping_status?.trim() ||
      existing.shipping_status ||
      "Pending";

    let shippedAt = existing.shipped_at;
    let deliveredAt = existing.delivered_at;

    // Automatically set shipped_at
    if (
      nextStatus.toLowerCase() === "shipped" &&
      !shippedAt
    ) {
      shippedAt = new Date();
    }

    // Automatically set shipped_at for later statuses
    if (
      [
        "in transit",
        "out for delivery",
        "delivered",
      ].includes(nextStatus.toLowerCase()) &&
      !shippedAt
    ) {
      shippedAt = new Date();
    }

    // Automatically set delivered_at
    if (
      nextStatus.toLowerCase() === "delivered" &&
      !deliveredAt
    ) {
      deliveredAt = new Date();
    }

        const result = await client.query(
      `
      UPDATE shipments
      SET
        tracking_id = $1,
        carrier = $2,
        shipping_status = $3,
        estimated_delivery_date = $4,
        shipped_at = $5,
        delivered_at = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        tracking_id !== undefined
          ? tracking_id?.trim() || null
          : existing.tracking_id,

        carrier !== undefined
          ? carrier?.trim() || null
          : existing.carrier,

        nextStatus,

        estimated_delivery_date !== undefined
          ? estimated_delivery_date || null
          : existing.estimated_delivery_date,

        shippedAt,

        deliveredAt,

        id,
      ]
    );

    // =====================================
    // SYNC SHIPMENT STATUS WITH ORDER STATUS
    // =====================================

    const normalizedStatus =
      nextStatus.toLowerCase();

    const orderStatusMap = {
      pending: "New Order",
      shipped: "Shipped",
      "in transit": "Shipped",
      "out for delivery": "Out for Delivery",
      delivered: "Delivered",
    };

    const syncedOrderStatus =
      orderStatusMap[normalizedStatus];

    if (syncedOrderStatus) {
      await client.query(
        `
        UPDATE orders
        SET
          order_status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          syncedOrderStatus,
          existing.order_id,
        ]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Shipment updated successfully",
      shipment: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update admin shipment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update shipment",
    });
  } finally {
    client.release();
  }
};


module.exports = {
  getAdminShipments,
  getAdminShipmentById,
  createAdminShipment,
  updateAdminShipment,
};