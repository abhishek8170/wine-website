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
        ci.gift_set_id,
        ci.quantity,

        /* Normal product */
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

        c.name AS category_name,

        /* Gift set */
        gs.name AS gift_set_name,
        gs.description AS gift_set_description,
        gs.selling_price AS gift_set_price,
        gs.mrp AS gift_set_mrp,
        gs.image_url AS gift_set_image_url,
        gs.stock_quantity AS gift_set_stock_quantity,
        gs.is_active AS gift_set_is_active

      FROM cart_items ci

      LEFT JOIN product_variants pv
        ON pv.id = ci.product_variant_id

      LEFT JOIN products p
        ON p.id = pv.product_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN gift_sets gs
        ON gs.id = ci.gift_set_id

      WHERE ci.cart_id = $1

      ORDER BY ci.created_at ASC
      `,
      [cartId]
    );

    const items = itemsResult.rows.map((item) => {
      const giftSetId = Number(item.gift_set_id || 0);

      /* ---------------------------------
         GIFT SET CART ITEM
      --------------------------------- */

      if (giftSetId > 0) {
        return {
          id: item.id,

          isGiftSet: true,

          giftSetId,

          productId: null,
          variantId: null,

          name:
            item.gift_set_name ||
            "Wine Gift Set",

          category: "Gift Set",

          image:
            item.gift_set_image_url ||
            "/images/wine.png",

          bottleSize: "",
          vintage: "",

          price:
            Number(item.gift_set_price) || 0,

          mrp:
            Number(item.gift_set_mrp) || 0,

          quantity:
            Number(item.quantity) || 0,

          stockQuantity:
            Number(
              item.gift_set_stock_quantity
            ) || 0,

          giftSetName:
            item.gift_set_name ||
            "Wine Gift Set",

          giftSetDescription:
            item.gift_set_description || "",

          giftSetImage:
            item.gift_set_image_url ||
            "/images/wine.png",

          giftSetPrice:
            Number(item.gift_set_price) || 0,

          giftSetMrp:
            Number(item.gift_set_mrp) || 0,

          giftSetStockQuantity:
            Number(
              item.gift_set_stock_quantity
            ) || 0,

          giftSetActive:
            item.gift_set_is_active ?? true,
        };
      }

      /* ---------------------------------
         NORMAL WINE CART ITEM
      --------------------------------- */

      return {
        id: item.id,

        isGiftSet: false,

        giftSetId: null,

        productId:
          Number(item.product_id),

        variantId:
          Number(item.product_variant_id),

        name:
          item.product_name || "Wine",

        category:
          item.category_name || "Wine",

        image:
          item.image_url ||
          "/images/wine.png",

        bottleSize:
          item.bottle_size || "",

        vintage:
          item.vintage || "",

        price:
          Number(item.selling_price) || 0,

        mrp:
          Number(item.mrp) || 0,

        quantity:
          Number(item.quantity) || 0,

        stockQuantity:
          Number(item.stock_quantity) || 0,
      };
    });

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
// ADD NORMAL ITEM TO CART
// =====================================

const addToCart = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const {
      product_variant_id,
      quantity = 1,
    } = req.body;

    const variantId =
      Number(product_variant_id);

    const addQuantity =
      Number(quantity);

    if (
      !Number.isInteger(variantId) ||
      variantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid product variant is required",
      });
    }

    if (
      !Number.isInteger(addQuantity) ||
      addQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a positive integer",
      });
    }

    const variantResult =
      await pool.query(
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

    if (
      variantResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product variant not found",
      });
    }

    const variant =
      variantResult.rows[0];

    const stockQuantity =
      Number(variant.stock_quantity) || 0;

    if (stockQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "This product is currently out of stock",
      });
    }

    let cartResult =
      await pool.query(
        `
        SELECT id
        FROM carts
        WHERE customer_id = $1
        LIMIT 1
        `,
        [customerId]
      );

    let cartId;

    if (cartResult.rows.length === 0) {
      const newCart =
        await pool.query(
          `
          INSERT INTO carts (
            customer_id,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING id
          `,
          [customerId]
        );

      cartId = newCart.rows[0].id;
    } else {
      cartId = cartResult.rows[0].id;
    }

    const existingItemResult =
      await pool.query(
        `
        SELECT
          id,
          quantity
        FROM cart_items
        WHERE cart_id = $1
          AND product_variant_id = $2
          AND gift_set_id IS NULL
        LIMIT 1
        `,
        [cartId, variantId]
      );

    if (
      existingItemResult.rows.length > 0
    ) {
      const existingItem =
        existingItemResult.rows[0];

      const newQuantity =
        Number(existingItem.quantity) +
        addQuantity;

      if (
        newQuantity > stockQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Only ${stockQuantity} bottle(s) available`,
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
        [
          newQuantity,
          existingItem.id,
        ]
      );
    } else {
      if (
        addQuantity > stockQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Only ${stockQuantity} bottle(s) available`,
        });
      }

      await pool.query(
        `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          gift_set_id,
          quantity,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          NULL,
          $3,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        `,
        [
          cartId,
          variantId,
          addQuantity,
        ]
      );
    }

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
      message:
        "Product added to cart successfully",
    });
  } catch (error) {
    console.error(
      "Add to cart error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add product to cart",
    });
  }
};

// =====================================
// ADD GIFT SET TO CART
// =====================================

const addGiftSetToCart = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const customerId =
      req.customer.id;

    const giftSetId =
      Number(req.body.gift_set_id);

    const quantity =
      Number(req.body.quantity || 1);

    if (
      !Number.isInteger(giftSetId) ||
      giftSetId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid gift set is required",
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

    await client.query("BEGIN");

    /* ---------------------------------
       LOCK GIFT SET
    --------------------------------- */

    const giftSetResult =
      await client.query(
        `
        SELECT
          id,
          name,
          selling_price,
          mrp,
          stock_quantity,
          is_active
        FROM gift_sets
        WHERE id = $1
        FOR UPDATE
        `,
        [giftSetId]
      );

    if (
      giftSetResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Gift set not found",
      });
    }

    const giftSet =
      giftSetResult.rows[0];

    if (!giftSet.is_active) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "This gift set is currently unavailable",
      });
    }

    const giftSetStock =
      Number(
        giftSet.stock_quantity
      ) || 0;

    if (
      quantity > giftSetStock
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          `Only ${giftSetStock} gift set(s) available`,
      });
    }

    /* ---------------------------------
       CHECK INCLUDED VARIANT STOCK
    --------------------------------- */

    const itemsResult =
      await client.query(
        `
        SELECT
          gsi.product_variant_id,
          gsi.quantity,
          pv.stock_quantity,
          p.name AS product_name

        FROM gift_set_items gsi

        INNER JOIN product_variants pv
          ON pv.id =
            gsi.product_variant_id

        INNER JOIN products p
          ON p.id = pv.product_id

        WHERE gsi.gift_set_id = $1

        FOR UPDATE OF pv
        `,
        [giftSetId]
      );

    if (
      itemsResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "This gift set has no products",
      });
    }

    for (
      const item of itemsResult.rows
    ) {
      const requiredQuantity =
        Number(item.quantity) *
        quantity;

      const availableStock =
        Number(
          item.stock_quantity
        ) || 0;

      if (
        requiredQuantity >
        availableStock
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            `${item.product_name} does not have enough stock for this gift set`,
        });
      }
    }

    /* ---------------------------------
       GET / CREATE CART
    --------------------------------- */

    let cartResult =
      await client.query(
        `
        SELECT id
        FROM carts
        WHERE customer_id = $1
        LIMIT 1
        `,
        [customerId]
      );

    let cartId;

    if (
      cartResult.rows.length === 0
    ) {
      const newCart =
        await client.query(
          `
          INSERT INTO carts (
            customer_id,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING id
          `,
          [customerId]
        );

      cartId =
        newCart.rows[0].id;
    } else {
      cartId =
        cartResult.rows[0].id;
    }

    /* ---------------------------------
       CHECK EXISTING GIFT SET CART ITEM
    --------------------------------- */

    const existingResult =
      await client.query(
        `
        SELECT
          id,
          quantity
        FROM cart_items
        WHERE cart_id = $1
          AND gift_set_id = $2
        LIMIT 1
        `,
        [
          cartId,
          giftSetId,
        ]
      );

    if (
      existingResult.rows.length > 0
    ) {
      const existing =
        existingResult.rows[0];

      const newQuantity =
        Number(existing.quantity) +
        quantity;

      if (
        newQuantity > giftSetStock
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            `Only ${giftSetStock} gift set(s) available`,
        });
      }

      await client.query(
        `
        UPDATE cart_items
        SET
          quantity = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          newQuantity,
          existing.id,
        ]
      );
    } else {
      await client.query(
        `
        INSERT INTO cart_items (
          cart_id,
          product_variant_id,
          gift_set_id,
          quantity,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          NULL,
          $2,
          $3,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        `,
        [
          cartId,
          giftSetId,
          quantity,
        ]
      );
    }

    await client.query(
      `
      UPDATE carts
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [cartId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        "Gift set added to cart successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Add gift set to cart error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add gift set to cart",
    });
  } finally {
    client.release();
  }
};

// =====================================
// UPDATE NORMAL CART ITEM QUANTITY
// =====================================

const updateCartItem = async (
  req,
  res
) => {
  try {
    const customerId =
      req.customer.id;

    const variantId =
      Number(req.params.variantId);

    const quantity =
      Number(req.body.quantity);

    if (
      !Number.isInteger(
        variantId
      ) ||
      variantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product variant",
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

    const result =
      await pool.query(
        `
        SELECT
          ci.id,
          pv.stock_quantity

        FROM cart_items ci

        INNER JOIN carts c
          ON c.id = ci.cart_id

        INNER JOIN product_variants pv
          ON pv.id =
            ci.product_variant_id

        WHERE c.customer_id = $1
          AND ci.product_variant_id = $2
          AND ci.gift_set_id IS NULL

        LIMIT 1
        `,
        [
          customerId,
          variantId,
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Cart item not found",
      });
    }

    const item =
      result.rows[0];

    const stockQuantity =
      Number(
        item.stock_quantity
      ) || 0;

    if (
      quantity > stockQuantity
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Only ${stockQuantity} bottle(s) available`,
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
      [
        quantity,
        item.id,
      ]
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
      message:
        "Cart quantity updated successfully",
    });
  } catch (error) {
    console.error(
      "Update cart item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update cart item",
    });
  }
};

// =====================================
// UPDATE GIFT SET CART ITEM QUANTITY
// =====================================

const updateGiftSetCartItem =
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const customerId =
        req.customer.id;

      const giftSetId =
        Number(
          req.params.giftSetId
        );

      const quantity =
        Number(req.body.quantity);

      if (
        !Number.isInteger(
          giftSetId
        ) ||
        giftSetId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid gift set",
        });
      }

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Quantity must be a positive integer",
        });
      }

      await client.query(
        "BEGIN"
      );

      /* ---------------------------------
         LOCK GIFT SET
      --------------------------------- */

      const giftSetResult =
        await client.query(
          `
          SELECT
            id,
            stock_quantity,
            is_active
          FROM gift_sets
          WHERE id = $1
          FOR UPDATE
          `,
          [giftSetId]
        );

      if (
        giftSetResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Gift set not found",
        });
      }

      const giftSet =
        giftSetResult.rows[0];

      if (!giftSet.is_active) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "This gift set is currently unavailable",
        });
      }

      const giftSetStock =
        Number(
          giftSet.stock_quantity
        ) || 0;

      if (
        quantity > giftSetStock
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            `Only ${giftSetStock} gift set(s) available`,
        });
      }

      /* ---------------------------------
         CHECK INCLUDED PRODUCT STOCK
      --------------------------------- */

      const itemsResult =
        await client.query(
          `
          SELECT
            gsi.product_variant_id,
            gsi.quantity,
            pv.stock_quantity,
            p.name AS product_name

          FROM gift_set_items gsi

          INNER JOIN product_variants pv
            ON pv.id =
              gsi.product_variant_id

          INNER JOIN products p
            ON p.id =
              pv.product_id

          WHERE gsi.gift_set_id = $1

          FOR UPDATE OF pv
          `,
          [giftSetId]
        );

      if (
        itemsResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          success: false,
          message:
            "This gift set has no products",
        });
      }

      for (
        const item of itemsResult.rows
      ) {
        const requiredQuantity =
          Number(item.quantity) *
          quantity;

        const availableStock =
          Number(
            item.stock_quantity
          ) || 0;

        if (
          requiredQuantity >
          availableStock
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              `${item.product_name} does not have enough stock for this gift set`,
          });
        }
      }

      /* ---------------------------------
         FIND CART ITEM
      --------------------------------- */

      const cartItemResult =
        await client.query(
          `
          SELECT
            ci.id
          FROM cart_items ci

          INNER JOIN carts c
            ON c.id = ci.cart_id

          WHERE c.customer_id = $1
            AND ci.gift_set_id = $2

          LIMIT 1
          `,
          [
            customerId,
            giftSetId,
          ]
        );

      if (
        cartItemResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Gift set cart item not found",
        });
      }

      const cartItemId =
        cartItemResult.rows[0].id;

      await client.query(
        `
        UPDATE cart_items
        SET
          quantity = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          quantity,
          cartItemId,
        ]
      );

      await client.query(
        `
        UPDATE carts
        SET updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $1
        `,
        [customerId]
      );

      await client.query(
        "COMMIT"
      );

      return res.json({
        success: true,
        message:
          "Gift set quantity updated successfully",
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Update gift set cart item error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update gift set quantity",
      });
    } finally {
      client.release();
    }
  };

// =====================================
// REMOVE NORMAL CART ITEM
// =====================================

const removeCartItem =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      const variantId =
        Number(
          req.params.variantId
        );

      if (
        !Number.isInteger(
          variantId
        ) ||
        variantId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product variant",
        });
      }

      const result =
        await pool.query(
          `
          DELETE FROM cart_items ci
          USING carts c
          WHERE ci.cart_id = c.id
            AND c.customer_id = $1
            AND ci.product_variant_id = $2
            AND ci.gift_set_id IS NULL
          RETURNING ci.id
          `,
          [
            customerId,
            variantId,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Cart item not found",
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
        message:
          "Product removed from cart",
      });
    } catch (error) {
      console.error(
        "Remove cart item error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to remove cart item",
      });
    }
  };

// =====================================
// REMOVE GIFT SET CART ITEM
// =====================================

const removeGiftSetCartItem =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      const giftSetId =
        Number(
          req.params.giftSetId
        );

      if (
        !Number.isInteger(
          giftSetId
        ) ||
        giftSetId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid gift set",
        });
      }

      const result =
        await pool.query(
          `
          DELETE FROM cart_items ci
          USING carts c
          WHERE ci.cart_id = c.id
            AND c.customer_id = $1
            AND ci.gift_set_id = $2
          RETURNING ci.id
          `,
          [
            customerId,
            giftSetId,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Gift set cart item not found",
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
        message:
          "Gift set removed from cart",
      });
    } catch (error) {
      console.error(
        "Remove gift set cart item error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to remove gift set from cart",
      });
    }
  };

// =====================================
// CLEAR CART
// =====================================

const clearCart =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      await pool.query(
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
        message:
          "Cart cleared successfully",
      });
    } catch (error) {
      console.error(
        "Clear cart error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to clear cart",
      });
    }
  };

module.exports = {
  getCart,
  addToCart,
  addGiftSetToCart,
  updateCartItem,
  updateGiftSetCartItem,
  removeCartItem,
  removeGiftSetCartItem,
  clearCart,
};