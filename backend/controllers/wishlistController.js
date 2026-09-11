const pool = require("../config/db");

/*
  GET /api/wishlist
  Get the logged-in customer's wishlist
*/
const getWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const result = await pool.query(
      `
      SELECT
        w.id AS wishlist_id,
        p.id AS product_id,
        p.name,
        p.description,
        p.vintage,
        p.is_active,
        c.name AS category_name,

        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS image_url,

        (
          SELECT pv.id
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = true
          ORDER BY pv.id ASC
          LIMIT 1
        ) AS variant_id,

        (
          SELECT pv.selling_price
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = true
          ORDER BY pv.id ASC
          LIMIT 1
        ) AS selling_price,

        (
          SELECT pv.mrp
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = true
          ORDER BY pv.id ASC
          LIMIT 1
        ) AS mrp,

        (
          SELECT pv.bottle_size
          FROM product_variants pv
          WHERE pv.product_id = p.id
            AND pv.is_active = true
          ORDER BY pv.id ASC
          LIMIT 1
        ) AS bottle_size,

        w.created_at
      FROM wishlists w
      INNER JOIN products p
        ON p.id = w.product_id
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE w.customer_id = $1
      ORDER BY w.created_at DESC
      `,
      [customerId]
    );

    const items = result.rows.map((item) => ({
      wishlistId: item.wishlist_id,
      productId: item.product_id,
      name: item.name,
      description: item.description,
      vintage: item.vintage,
      category: item.category_name || "Wine",
      image: item.image_url || "/images/wine.png",
      variantId: item.variant_id,
      price: Number(item.selling_price || 0),
      mrp: Number(item.mrp || 0),
      bottleSize: item.bottle_size || "",
      createdAt: item.created_at,
    }));

    res.json({
      success: true,
      wishlist: items,
      count: items.length,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load wishlist",
    });
  }
};


/*
  POST /api/wishlist
  Add a product to wishlist
*/
const addToWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Make sure product exists and is active
    const productResult = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
        AND is_active = true
      `,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Prevent duplicate wishlist entries
    const existingResult = await pool.query(
      `
      SELECT id
      FROM wishlists
      WHERE customer_id = $1
        AND product_id = $2
      `,
      [customerId, product_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Product is already in wishlist",
        wishlist_id: existingResult.rows[0].id,
      });
    }

    const result = await pool.query(
      `
      INSERT INTO wishlists (
        customer_id,
        product_id
      )
      VALUES ($1, $2)
      RETURNING id
      `,
      [customerId, product_id]
    );

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      wishlist_id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Add wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist",
    });
  }
};


/*
  DELETE /api/wishlist/:productId
  Remove a product from wishlist
*/
const removeFromWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { productId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM wishlists
      WHERE customer_id = $1
        AND product_id = $2
      RETURNING id
      `,
      [customerId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product is not in wishlist",
      });
    }

    res.json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist",
    });
  }
};


/*
  DELETE /api/wishlist
  Clear the customer's complete wishlist
*/
const clearWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;

    await pool.query(
      `
      DELETE FROM wishlists
      WHERE customer_id = $1
      `,
      [customerId]
    );

    res.json({
      success: true,
      message: "Wishlist cleared",
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear wishlist",
    });
  }
};


module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};