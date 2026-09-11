const pool = require("../config/db");

// =====================================
// GET CUSTOMER CART
// =====================================

const getCart = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const cartResult = await pool.query(
      `
      SELECT id
      FROM carts
      WHERE customer_id = $1
      LIMIT 1
      `,
      [customerId]
    );

    // Customer does not have a cart yet
    if (cartResult.rows.length === 0) {
      return res.json({
        success: true,
        cart: {
          id: null,
          items: [],
        },
      });
    }

    const cartId = cartResult.rows[0].id;

    const itemsResult = await pool.query(
      `
      SELECT
        ci.id,
        ci.product_variant_id,
        ci.quantity,

        p.id AS product_id,
        p.name AS product_name,
        p.vintage,

        pv.bottle_size,
        pv.mrp,
        pv.selling_price,
        pv.stock_quantity,

        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.id ASC
          LIMIT 1
        ) AS image_url,

        c.name AS category_name

      FROM cart_items ci

      INNER JOIN product_variants pv
        ON pv.id = ci.product_variant_id

      INNER JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      WHERE ci.cart_id = $1

      ORDER BY ci.created_at ASC
      `,
      [cartId]
    );

    const items = itemsResult.rows.map((item) => ({
      id: item.id,
      productId: Number(item.product_id),
      variantId: Number(item.product_variant_id),

      name: item.product_name,
      category: item.category_name || "Wine",

      image: item.image_url || "/images/wine.png",

      bottleSize: item.bottle_size || "",
      vintage: item.vintage || "",

      price: Number(item.selling_price) || 0,
      mrp: Number(item.mrp) || 0,

      quantity: Number(item.quantity) || 0,
      stockQuantity: Number(item.stock_quantity) || 0,
    }));

    return res.json({
      success: true,
      cart: {
        id: cartId,
        items,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load cart",
    });
  }
};

// =====================================
// ADD ITEM TO CART
// =====================================

const addToCart = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { product_variant_id, quantity = 1 } = req.body;

    const variantId = Number(product_variant_id);
    const addQuantity = Number(quantity);

    if (
      !Number.isInteger(variantId) ||
      variantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product variant is required",
      });
    }

    if (
      !Number.isInteger(addQuantity) ||
      addQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // Check product variant
    const variantResult = await pool.query(
      `
      SELECT
        id,
        product_id,
        selling_price,
        mrp,
        stock_quantity
      FROM product_variants
      WHERE id = $1
      LIMIT 1
      `,
      [variantId]
    );

    if (variantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    const variant = variantResult.rows[0];

    const stockQuantity =
      Number(variant.stock_quantity) || 0;

    if (stockQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "This product is currently out of stock",
      });
    }

    // Find existing customer cart
    let cartResult = await pool.query(
      `
      SELECT id
      FROM carts
      WHERE customer_id = $1
      LIMIT 1
      `,
      [customerId]
    );

    let cartId;

    // Create cart if customer doesn't have one
    if (cartResult.rows.length === 0) {
      const newCart = await pool.query(
        `
        INSERT INTO carts (
          customer_id,
          created_at,
          updated_at
        )
        VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
        `,
        [customerId]
      );

      cartId = newCart.rows[0].id;
    } else {
      cartId = cartResult.rows[0].id;
    }

    // Check existing cart item
    const existingItemResult = await pool.query(
      `
      SELECT
        id,
        quantity
      FROM cart_items
      WHERE cart_id = $1
        AND product_variant_id = $2
      LIMIT 1
      `,
      [cartId, variantId]
    );

    if (existingItemResult.rows.length > 0) {
      const existingItem =
        existingItemResult.rows[0];

      const newQuantity =
        Number(existingItem.quantity) +
        addQuantity;

      if (newQuantity > stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${stockQuantity} bottle(s) available`,
        });
      }

      await pool.query(
        `
        UPDATE cart_items
        SET
          quantity = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [newQuantity, existingItem.id]
      );
    } else {
      if (addQuantity > stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${stockQuantity} bottle(s) available`,
        });
      }

      await pool.query(
        `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          quantity,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        `,
        [cartId, variantId, addQuantity]
      );
    }

    // Update cart timestamp
    await pool.query(
      `
      UPDATE carts
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [cartId]
    );

    return res.status(201).json({
      success: true,
      message: "Product added to cart successfully",
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
};

// =====================================
// UPDATE CART ITEM QUANTITY
// =====================================

const updateCartItem = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const variantId = Number(
      req.params.variantId
    );
    const quantity = Number(req.body.quantity);

    if (
      !Number.isInteger(variantId) ||
      variantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product variant",
      });
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a positive integer",
      });
    }

    const result = await pool.query(
      `
      SELECT
        ci.id,
        pv.stock_quantity

      FROM cart_items ci

      INNER JOIN carts c
        ON c.id = ci.cart_id

      INNER JOIN product_variants pv
        ON pv.id = ci.product_variant_id

      WHERE c.customer_id = $1
        AND ci.product_variant_id = $2

      LIMIT 1
      `,
      [customerId, variantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const item = result.rows[0];

    const stockQuantity =
      Number(item.stock_quantity) || 0;

    if (quantity > stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${stockQuantity} bottle(s) available`,
      });
    }

    await pool.query(
      `
      UPDATE cart_items
      SET
        quantity = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [quantity, item.id]
    );

    await pool.query(
      `
      UPDATE carts
      SET updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $1
      `,
      [customerId]
    );

    return res.json({
      success: true,
      message: "Cart quantity updated successfully",
    });
  } catch (error) {
    console.error(
      "Update cart item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update cart item",
    });
  }
};

// =====================================
// REMOVE CART ITEM
// =====================================

const removeCartItem = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const variantId = Number(
      req.params.variantId
    );

    if (
      !Number.isInteger(variantId) ||
      variantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product variant",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM cart_items ci
      USING carts c
      WHERE ci.cart_id = c.id
        AND c.customer_id = $1
        AND ci.product_variant_id = $2
      RETURNING ci.id
      `,
      [customerId, variantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    await pool.query(
      `
      UPDATE carts
      SET updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $1
      `,
      [customerId]
    );

    return res.json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error(
      "Remove cart item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
    });
  }
};

// =====================================
// CLEAR CART
// =====================================

const clearCart = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const result = await pool.query(
      `
      DELETE FROM cart_items ci
      USING carts c
      WHERE ci.cart_id = c.id
        AND c.customer_id = $1
      `,
      [customerId]
    );

    await pool.query(
      `
      UPDATE carts
      SET updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $1
      `,
      [customerId]
    );

    return res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};