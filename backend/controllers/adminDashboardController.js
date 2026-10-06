const pool = require("../config/db");

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

const getDashboardStats = async (req, res) => {
  try {
    /* =====================================================
       SALES
       -----------------------------------------------------
       Only paid orders count as actual sales.
    ===================================================== */

    const salesQuery = `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN LOWER(COALESCE(o.order_status, '')) NOT IN (
                'cancelled',
                'canceled',
                'refunded'
              )
              AND LOWER(COALESCE(o.payment_status, '')) IN (
                'paid',
                'completed',
                'success',
                'successful'
              )
              THEN o.total_amount
              ELSE 0
            END
          ),
          0
        ) AS total_sales,

        COALESCE(
          SUM(
            CASE
              WHEN DATE(o.created_at) = CURRENT_DATE
              AND LOWER(COALESCE(o.order_status, '')) NOT IN (
                'cancelled',
                'canceled',
                'refunded'
              )
              AND LOWER(COALESCE(o.payment_status, '')) IN (
                'paid',
                'completed',
                'success',
                'successful'
              )
              THEN o.total_amount
              ELSE 0
            END
          ),
          0
        ) AS today_sales

      FROM orders o
    `;

    /* =====================================================
       ORDER STATISTICS
    ===================================================== */

    const orderStatsQuery = `
      SELECT

        COUNT(*) AS total_orders,

        COUNT(*) FILTER (
          WHERE LOWER(TRIM(COALESCE(order_status, ''))) IN (
            'new order',
            'pending',
            'processing',
            'confirmed',
            'packed',
            'shipped',
            'out for delivery'
          )
        ) AS pending_orders,

        COUNT(*) FILTER (
          WHERE LOWER(TRIM(COALESCE(order_status, ''))) = 'delivered'
        ) AS delivered_orders,

        COUNT(*) FILTER (
          WHERE LOWER(TRIM(COALESCE(order_status, ''))) IN (
            'cancelled',
            'canceled'
          )
        ) AS cancelled_orders

      FROM orders
    `;

    /* =====================================================
       CUSTOMERS
    ===================================================== */

    const customersQuery = `
      SELECT COUNT(*) AS total_customers
      FROM customers
    `;

    /* =====================================================
       PRODUCTS
    ===================================================== */

    const productsQuery = `
      SELECT COUNT(*) AS total_products
      FROM products
      WHERE is_active = TRUE
    `;

    /* =====================================================
       LOW STOCK
       -----------------------------------------------------
       Currently using <= 10 bottles as low-stock threshold.
    ===================================================== */

    const lowStockQuery = `
      SELECT
        pv.id AS variant_id,
        p.id AS product_id,
        p.name AS product_name,
        pv.bottle_size,
        pv.vintage,
        pv.sku,
        pv.stock_quantity

      FROM product_variants pv

      INNER JOIN products p
        ON p.id = pv.product_id

      WHERE
        pv.is_active = TRUE
        AND p.is_active = TRUE
        AND pv.stock_quantity <= 10

      ORDER BY
        pv.stock_quantity ASC,
        p.name ASC

      LIMIT 10
    `;

    /* =====================================================
       BEST SELLING WINES
       -----------------------------------------------------
       Based on quantity ordered.

       At this stage your orders are still Pending, so these
       represent ordered quantities rather than completed
       sales.
    ===================================================== */

    const bestSellingQuery = `
      SELECT
        oi.product_id,
        oi.product_name,
        oi.bottle_size,
        oi.vintage,

        SUM(oi.quantity) AS total_quantity_sold,
        SUM(oi.subtotal) AS total_revenue

      FROM order_items oi

      INNER JOIN orders o
        ON o.id = oi.order_id

      WHERE LOWER(TRIM(COALESCE(o.order_status, ''))) NOT IN (
        'cancelled',
        'canceled',
        'refunded'
      )

      GROUP BY
        oi.product_id,
        oi.product_name,
        oi.bottle_size,
        oi.vintage

      ORDER BY
        total_quantity_sold DESC,
        total_revenue DESC

      LIMIT 5
    `;

    /* =====================================================
       REVENUE CHART
       -----------------------------------------------------
       Last 7 days.

       Only paid/completed/successful orders count.
    ===================================================== */

    const revenueQuery = `
      SELECT
        TO_CHAR(date_series.day, 'DD Mon') AS date,

        COALESCE(
          SUM(
            CASE
              WHEN LOWER(TRIM(COALESCE(o.order_status, ''))) NOT IN (
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
              THEN o.total_amount
              ELSE 0
            END
          ),
          0
        ) AS revenue

      FROM (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day
      ) date_series

      LEFT JOIN orders o
        ON DATE(o.created_at) = date_series.day

      GROUP BY
        date_series.day

      ORDER BY
        date_series.day ASC
    `;

    /* =====================================================
       RUN QUERIES
    ===================================================== */

    const [
      salesResult,
      orderStatsResult,
      customersResult,
      productsResult,
      lowStockResult,
      bestSellingResult,
      revenueResult,
    ] = await Promise.all([
      pool.query(salesQuery),
      pool.query(orderStatsQuery),
      pool.query(customersQuery),
      pool.query(productsQuery),
      pool.query(lowStockQuery),
      pool.query(bestSellingQuery),
      pool.query(revenueQuery),
    ]);

    /* =====================================================
       RESPONSE
    ===================================================== */

    const sales = salesResult.rows[0];
    const orderStats = orderStatsResult.rows[0];
    const customers = customersResult.rows[0];
    const products = productsResult.rows[0];

    res.json({
      success: true,

      stats: {
        totalSales: Number(sales.total_sales || 0),
        todaySales: Number(sales.today_sales || 0),

        totalOrders: Number(orderStats.total_orders || 0),

        totalCustomers: Number(
          customers.total_customers || 0
        ),

        pendingOrders: Number(
          orderStats.pending_orders || 0
        ),

        deliveredOrders: Number(
          orderStats.delivered_orders || 0
        ),

        cancelledOrders: Number(
          orderStats.cancelled_orders || 0
        ),

        totalProducts: Number(
          products.total_products || 0
        ),

        lowStockCount: lowStockResult.rows.length,
      },

      lowStockWines: lowStockResult.rows.map((item) => ({
        variantId: item.variant_id,
        productId: item.product_id,
        productName: item.product_name,
        bottleSize: item.bottle_size,
        vintage: item.vintage,
        sku: item.sku,
        stockQuantity: Number(
          item.stock_quantity || 0
        ),
      })),

      bestSellingWines: bestSellingResult.rows.map(
        (item) => ({
          productId: item.product_id,
          productName: item.product_name,
          bottleSize: item.bottle_size,
          vintage: item.vintage,

          totalQuantitySold: Number(
            item.total_quantity_sold || 0
          ),

          totalRevenue: Number(
            item.total_revenue || 0
          ),
        })
      ),

      revenueChart: revenueResult.rows.map((item) => ({
        date: item.date,
        revenue: Number(item.revenue || 0),
      })),
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};