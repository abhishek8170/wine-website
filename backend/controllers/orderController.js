const pool = require("../config/db");

const {
  createCustomerNotification,
  NOTIFICATION_TYPES,
} = require("./notificationController");

const {
  emitCustomerNotificationCreated,
} = require("../utils/notificationSocket");

const {
  notifyNewOrder,
  notifyOrderCancelledByCustomer,
  notifyLowStock,
  notifyOutOfStock,
  emitCreatedAdminNotification,
} = require("../utils/adminNotificationEvents");

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
// SUPPORTS:
// - NORMAL PRODUCTS
// - GIFT SETS
// - MIXED CART
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

    // =====================================
    // VALIDATE ADDRESS ID
    // =====================================

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

    // =====================================
    // BEGIN TRANSACTION
    // =====================================

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
      [
        addressId,
        customerId,
      ]
    );

    if (
      addressResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message:
          "Delivery address not found",
      });
    }

    const address =
      addressResult.rows[0];

    // =====================================
    // CHECK DELIVERY ZONE
    // =====================================

    const cleanPincode = String(
      address.postal_code || ""
    ).trim();

    const deliveryZoneResult =
      await client.query(
        `
        SELECT
          id,
          name,
          state,
          city,
          postal_code,
          country,
          delivery_available,
          delivery_charge,
          estimated_delivery_days
        FROM delivery_zones
        WHERE postal_code = $1
        ORDER BY id DESC
        LIMIT 1
        `,
        [cleanPincode]
      );

    // =====================================
    // PINCODE NOT COVERED
    // =====================================

    if (
      deliveryZoneResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Delivery is not available in your area.",
      });
    }

    const deliveryZone =
      deliveryZoneResult.rows[0];

    // =====================================
    // DELIVERY DISABLED
    // =====================================

    if (
      !deliveryZone.delivery_available
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Delivery is currently not available in your area.",
      });
    }

    // =====================================
    // DELIVERY CHARGE
    // =====================================

    const shippingAmount =
      Number(
        deliveryZone.delivery_charge
      ) || 0;

    // =====================================
    // GET CUSTOMER CART
    // =====================================

    const cartResult =
      await client.query(
        `
        SELECT
          id
        FROM carts
        WHERE customer_id = $1
        LIMIT 1
        `,
        [customerId]
      );

    if (
      cartResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Your cart is empty",
      });
    }

    const cartId =
      cartResult.rows[0].id;

    // =====================================
    // GET CART ITEMS
    //
    // IMPORTANT:
    // Do NOT INNER JOIN product_variants here.
    //
    // Gift sets have:
    // product_variant_id = NULL
    // gift_set_id = actual gift set ID
    // =====================================

    const cartItemsResult =
      await client.query(
        `
        SELECT
          ci.id AS cart_item_id,
          ci.product_variant_id,
          ci.gift_set_id,
          ci.quantity,
          ci.created_at

        FROM cart_items ci

        WHERE ci.cart_id = $1

        ORDER BY ci.created_at ASC

        FOR UPDATE
        `,
        [cartId]
      );

    if (
      cartItemsResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Your cart is empty",
      });
    }

    // =====================================
    // PREPARE ORDER ITEMS
    // =====================================

    const orderItems = [];

    let subtotal = 0;

    const adminStockNotifications = [];

    // =====================================
    // PROCESS EACH CART ITEM
    // =====================================

    for (
      const cartItem of cartItemsResult.rows
    ) {
      const quantity =
        Number(cartItem.quantity) || 0;

      // -----------------------------------
      // VALIDATE QUANTITY
      // -----------------------------------

      if (quantity <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message:
            "Invalid quantity in cart",
        });
      }

      // ===================================
      // NORMAL PRODUCT
      // ===================================

      if (
        cartItem.product_variant_id !==
        null
      ) {
        const variantId =
          Number(
            cartItem.product_variant_id
          );

        // ---------------------------------
        // LOCK PRODUCT VARIANT
        // ---------------------------------

        const variantResult =
          await client.query(
            `
            SELECT
              pv.id,
              pv.product_id,
              pv.bottle_size,
              pv.mrp,
              pv.selling_price,
              pv.stock_quantity,
              pv.is_active,

              p.name AS product_name,
              p.vintage,
              p.is_active AS product_is_active

            FROM product_variants pv

            INNER JOIN products p
              ON p.id = pv.product_id

            WHERE pv.id = $1

            LIMIT 1

            FOR UPDATE OF pv
            `,
            [variantId]
          );

        if (
          variantResult.rows.length === 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(404).json({
            success: false,
            message:
              "Product variant not found",
          });
        }

        const item =
          variantResult.rows[0];

        // ---------------------------------
        // CHECK PRODUCT STATUS
        // ---------------------------------

        if (
          item.is_active === false ||
          item.product_is_active === false
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              `${item.product_name} is currently unavailable`,
          });
        }

        // ---------------------------------
        // CHECK STOCK
        // ---------------------------------

        const stockQuantity =
          Number(
            item.stock_quantity
          ) || 0;

        if (
          stockQuantity <= 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              `${item.product_name} is currently out of stock`,
          });
        }

        if (
          quantity > stockQuantity
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              `Only ${stockQuantity} bottle(s) of ${item.product_name} are available`,
          });
        }

        // ---------------------------------
        // PRICE
        // ---------------------------------

        const unitPrice =
          Number(
            item.selling_price
          ) || 0;

        const itemSubtotal =
          unitPrice * quantity;

        subtotal += itemSubtotal;

        // ---------------------------------
        // STORE ORDER ITEM
        // ---------------------------------

        orderItems.push({
          type: "product",

          productId:
            item.product_id,

          productVariantId:
            item.id,

          productName:
            item.product_name,

          bottleSize:
            item.bottle_size,

          vintage:
            item.vintage,

          quantity,

          unitPrice,

          subtotal:
            itemSubtotal,
        });

        continue;
      }

      // ===================================
      // GIFT SET
      // ===================================

      if (
        cartItem.gift_set_id !== null
      ) {
        const giftSetId =
          Number(
            cartItem.gift_set_id
          );

        // ---------------------------------
        // LOCK GIFT SET
        // ---------------------------------

        const giftSetResult =
          await client.query(
            `
            SELECT
              id,
              name,
              description,
              selling_price,
              mrp,
              image_url,
              stock_quantity,
              is_active

            FROM gift_sets

            WHERE id = $1

            LIMIT 1

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

        // ---------------------------------
        // CHECK GIFT SET ACTIVE
        // ---------------------------------

        if (
          giftSet.is_active === false
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              "This gift set is currently unavailable",
          });
        }

        // ---------------------------------
        // CHECK GIFT SET STOCK
        // ---------------------------------

        const giftSetStock =
          Number(
            giftSet.stock_quantity
          ) || 0;

        if (
          giftSetStock <= 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              `${giftSet.name} is currently out of stock`,
          });
        }

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

        // ---------------------------------
        // GET INCLUDED GIFT SET ITEMS
        // AND LOCK THEIR VARIANTS
        // ---------------------------------

        const giftSetItemsResult =
          await client.query(
            `
            SELECT
              gsi.id AS gift_set_item_id,
              gsi.product_variant_id,
              gsi.quantity AS included_quantity,

              pv.product_id,
              pv.bottle_size,
              pv.stock_quantity,
              pv.is_active AS variant_is_active,

              p.name AS product_name,
              p.vintage,
              p.is_active AS product_is_active

            FROM gift_set_items gsi

            INNER JOIN product_variants pv
              ON pv.id =
                gsi.product_variant_id

            INNER JOIN products p
              ON p.id =
                pv.product_id

            WHERE gsi.gift_set_id = $1

            ORDER BY gsi.id ASC

            FOR UPDATE OF pv
            `,
            [giftSetId]
          );

        if (
          giftSetItemsResult.rows.length === 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            success: false,
            message:
              "This gift set has no products configured",
          });
        }

        // ---------------------------------
        // VALIDATE ALL INCLUDED PRODUCTS
        // ---------------------------------

        for (
          const giftItem of
          giftSetItemsResult.rows
        ) {
          const includedQuantity =
            Number(
              giftItem.included_quantity
            ) || 0;

          const requiredQuantity =
            includedQuantity *
            quantity;

          const availableStock =
            Number(
              giftItem.stock_quantity
            ) || 0;

          if (
            giftItem.variant_is_active ===
            false ||
            giftItem.product_is_active ===
            false
          ) {
            await client.query(
              "ROLLBACK"
            );

            return res.status(400).json({
              success: false,
              message:
                `${giftItem.product_name} included in ${giftSet.name} is currently unavailable`,
            });
          }

          if (
            includedQuantity <= 0
          ) {
            await client.query(
              "ROLLBACK"
            );

            return res.status(400).json({
              success: false,
              message:
                `Invalid quantity configured for ${giftItem.product_name} in ${giftSet.name}`,
            });
          }

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
                `${giftSet.name} cannot be ordered because ${giftItem.product_name} does not have enough stock`,
            });
          }
        }

        // ---------------------------------
        // GIFT SET PRICE
        // ---------------------------------

        const unitPrice =
          Number(
            giftSet.selling_price
          ) || 0;

        const giftSetSubtotal =
          unitPrice * quantity;

        subtotal +=
          giftSetSubtotal;

        // ---------------------------------
        // IMPORTANT DATABASE COMPATIBILITY
        //
        // order_items.product_id is currently
        // NOT NULL in your database.
        //
        // A gift set itself does not have a
        // product_id.
        //
        // Therefore we use the first included
        // product/variant as the required
        // database reference, while keeping
        // the order item name and price as the
        // actual gift set.
        // ---------------------------------

        const firstGiftItem =
          giftSetItemsResult.rows[0];

        orderItems.push({
          type: "gift_set",

          giftSetId:
            giftSet.id,

          productId:
            firstGiftItem.product_id,

          productVariantId:
            firstGiftItem.product_variant_id,

          productName:
            giftSet.name,

          bottleSize:
            "Gift Set",

          vintage:
            null,

          quantity,

          unitPrice,

          subtotal:
            giftSetSubtotal,

          giftSetItems:
            giftSetItemsResult.rows.map(
              (giftItem) => ({
                productVariantId:
                  giftItem.product_variant_id,

                productId:
                  giftItem.product_id,

                productName:
                  giftItem.product_name,

                bottleSize:
                  giftItem.bottle_size,

                includedQuantity:
                  Number(
                    giftItem.included_quantity
                  ) || 0,

                requiredQuantity:
                  (
                    Number(
                      giftItem.included_quantity
                    ) || 0
                  ) * quantity,
              })
            ),
        });

        continue;
      }

      // ===================================
      // INVALID CART ITEM
      // ===================================

      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid item found in cart",
      });
    }

    // =====================================
    // SAFETY CHECK
    // =====================================

    if (
      orderItems.length === 0
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        success: false,
        message:
          "Your cart is empty",
      });
    }

    // =====================================
    // ORDER CALCULATIONS
    // =====================================

    const discountAmount = 0;

    const taxAmount = 0;

    const totalAmount =
      subtotal -
      discountAmount +
      shippingAmount +
      taxAmount;

    // =====================================
    // GENERATE ORDER NUMBER
    // =====================================

    const orderNumber =
      generateOrderNumber();

    // =====================================
    // CREATE ORDER
    // =====================================

    const orderResult =
      await client.query(
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

    const order =
      orderResult.rows[0];




    // =====================================
    // CREATE ORDER ITEMS
    // =====================================

    for (
      const item of orderItems
    ) {
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

          // IMPORTANT:
          // Gift set uses first included product
          // because order_items.product_id is
          // currently NOT NULL.
          item.productId,

          item.productVariantId,

          item.productName,

          item.bottleSize,

          item.vintage,

          item.quantity,

          item.unitPrice,

          0,

          item.subtotal,
        ]
      );

      // ===================================
      // NORMAL PRODUCT INVENTORY
      // ===================================

      if (
        item.type === "product"
      ) {
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
              item.quantity,
              item.productVariantId,
            ]
          );

        if (
          inventoryUpdateResult.rows
            .length === 0
        ) {
          throw new Error(
            `Stock could not be updated for product variant ${item.productVariantId}`
          );
        }


        // ---------------------------------
        // STOCK NOTIFICATION
        // ---------------------------------

        const updatedStock =
          Number(
            inventoryUpdateResult.rows[0]
              .stock_quantity || 0
          );

        let stockNotification = null;

        if (updatedStock === 0) {
          stockNotification =
            await notifyOutOfStock(
              client,
              {
                variantId:
                  item.productVariantId,

                productName:
                  item.productName,
              }
            );
        } else if (updatedStock <= 10) {
          stockNotification =
            await notifyLowStock(
              client,
              {
                variantId:
                  item.productVariantId,

                productName:
                  item.productName,

                stockQuantity:
                  updatedStock,
              }
            );
        }

        if (stockNotification?.id) {
          adminStockNotifications.push(
            stockNotification
          );
        }
        // ---------------------------------
        // INVENTORY MOVEMENT
        // ---------------------------------

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
            item.productVariantId,

            "Stock Out",

            item.quantity,

            "ORDER",

            order.id,

            `Stock deducted for order ${order.order_number}`,
          ]
        );

        continue;
      }



      // ===================================
      // GIFT SET INVENTORY
      // ===================================

      if (
        item.type === "gift_set"
      ) {
        // ---------------------------------
        // REDUCE GIFT SET STOCK
        // ---------------------------------

        const giftSetStockResult =
          await client.query(
            `
            UPDATE gift_sets

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
              item.quantity,
              item.giftSetId,
            ]
          );

        if (
          giftSetStockResult.rows
            .length === 0
        ) {
          throw new Error(
            `Gift set stock could not be updated for gift set ${item.giftSetId}`
          );
        }

        // ---------------------------------
        // REDUCE EVERY INCLUDED VARIANT
        // ---------------------------------

        for (
          const giftItem of
          item.giftSetItems
        ) {
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
                giftItem.requiredQuantity,
                giftItem.productVariantId,
              ]
            );

          if (
            inventoryUpdateResult.rows
              .length === 0
          ) {
            throw new Error(
              `Stock could not be updated for product variant ${giftItem.productVariantId} inside gift set ${item.giftSetId}`
            );
          }

          // ---------------------------------
          // STOCK NOTIFICATION FOR
          // GIFT SET INCLUDED PRODUCT
          // ---------------------------------

          const updatedGiftItemStock =
            Number(
              inventoryUpdateResult.rows[0]
                .stock_quantity || 0
            );

          let giftItemStockNotification =
            null;

          if (
            updatedGiftItemStock === 0
          ) {
            giftItemStockNotification =
              await notifyOutOfStock(
                client,
                {
                  variantId:
                    giftItem.productVariantId,

                  productName:
                    giftItem.productName,
                }
              );
          } else if (
            updatedGiftItemStock <= 10
          ) {
            giftItemStockNotification =
              await notifyLowStock(
                client,
                {
                  variantId:
                    giftItem.productVariantId,

                  productName:
                    giftItem.productName,

                  stockQuantity:
                    updatedGiftItemStock,
                }
              );
          }

          if (
            giftItemStockNotification?.id
          ) {
            adminStockNotifications.push(
              giftItemStockNotification
            );
          }

          // -------------------------------
          // INVENTORY MOVEMENT
          // -------------------------------

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
              giftItem.productVariantId,

              "Stock Out",

              giftItem.requiredQuantity,

              "ORDER",

              order.id,

              `Stock deducted for gift set ${item.giftSetId} (${item.productName}) in order ${order.order_number}`,
            ]
          );
        }
      }
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

      SET
        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $1
      `,
      [cartId]
    );

    // =====================================
    // CREATE CUSTOMER ORDER NOTIFICATION
    // =====================================

    const customerNotification =
      await createCustomerNotification(
        client,
        {
          customerId,

          type:
            NOTIFICATION_TYPES.ORDER_CONFIRMATION,

          title:
            "Order Confirmed",

          message:
            `Your order ${order.order_number} has been successfully placed.`,

          entityType:
            "ORDER",

          entityId:
            order.id,
        }
      );

    // =====================================
    // CREATE ADMIN NEW ORDER NOTIFICATION
    // =====================================

    const adminNotification =
      await notifyNewOrder(
        client,
        {
          orderId: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
        }
      );

    // =====================================
    // COMMIT TRANSACTION
    // =====================================

    await client.query(
      "COMMIT"
    );



    // Notifications are emitted only after the
    // order transaction has committed successfully.
    if (customerNotification?.id) {
      emitCustomerNotificationCreated({
        customerId,
        notificationId:
          customerNotification.id,
      });
    }

    if (adminNotification?.id) {
      emitCreatedAdminNotification(
        adminNotification
      );
    }

    for (
      const stockNotification
      of adminStockNotifications
    ) {
      emitCreatedAdminNotification(
        stockNotification
      );
    }

    // =====================================
    // EMIT CUSTOMER ORDER NOTIFICATION
    // =====================================

    

    // =====================================
    // SUCCESS RESPONSE
    // =====================================

    return res.status(201).json({
      success: true,

      message:
        "Order placed successfully",

      order: {
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
    // =====================================
    // ROLLBACK
    // =====================================

    try {
      await client.query(
        "ROLLBACK"
      );
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
                'id',
                oi.id,

                'productId',
                oi.product_id,

                'productVariantId',
                oi.product_variant_id,

                'productName',
                oi.product_name,

                'bottleSize',
                oi.bottle_size,

                'vintage',
                oi.vintage,

                'quantity',
                oi.quantity,

                'unitPrice',
                oi.unit_price,

                'subtotal',
                oi.subtotal,

                'imageUrl',
                COALESCE(
                  p.image_url,
                  pi.image_url
                ),

                'imageAlt',
                COALESCE(
                  pi.alt_text,
                  p.name
                )
              )

              ORDER BY oi.id ASC
            )

            FILTER (
              WHERE oi.id IS NOT NULL
            ),

            '[]'::json
          ) AS items

        FROM orders o

        LEFT JOIN order_items oi
          ON oi.order_id = o.id

        LEFT JOIN products p
          ON p.id = oi.product_id

        LEFT JOIN LATERAL (
          SELECT
            image_url,
            alt_text

          FROM product_images

          WHERE product_id =
            oi.product_id

          ORDER BY
            is_primary DESC,
            sort_order ASC,
            id ASC

          LIMIT 1
        ) pi ON true

        WHERE o.customer_id = $1

        GROUP BY o.id

        ORDER BY
          o.created_at DESC
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
            Number(
              order.subtotal
            ),

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
            Array.isArray(
              order.items
            )
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
                      item.quantity ||
                      0
                    ),

                  unitPrice:
                    Number(
                      item.unitPrice ||
                      0
                    ),

                  subtotal:
                    Number(
                      item.subtotal ||
                      0
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

const getCustomerOrderDetails =
  async (req, res) => {
    try {
      const customerId =
        req.customer.id;

      const orderId =
        Number(req.params.id);

      // =================================
      // VALIDATE ORDER ID
      // =================================

      if (
        !Number.isInteger(orderId) ||
        orderId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      // =================================
      // GET ORDER + ADDRESS
      // =================================

      const orderResult =
        await pool.query(
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
          [
            orderId,
            customerId,
          ]
        );

      if (
        orderResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      const orderRow =
        orderResult.rows[0];

      // =================================
      // GET ORDER ITEMS
      // =================================

      const itemsResult =
        await pool.query(
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

            COALESCE(
              p.image_url,
              pi.image_url
            ) AS "imageUrl",

            COALESCE(
              pi.alt_text,
              p.name
            ) AS "imageAlt",

            CASE
              WHEN
                oi.product_variant_id IS NOT NULL
                AND LOWER(
                  COALESCE(
                    o.order_status,
                    ''
                  )
                ) = 'delivered'
              THEN TRUE

              ELSE FALSE
            END AS "canReview",

            EXISTS (
              SELECT 1

              FROM reviews r

              WHERE r.product_id =
                oi.product_id

                AND r.customer_id =
                  $2

                AND r.is_active =
                  TRUE
            ) AS "hasReviewed"

          FROM order_items oi

          INNER JOIN orders o
            ON o.id = oi.order_id

          LEFT JOIN products p
            ON p.id = oi.product_id

          LEFT JOIN LATERAL (
            SELECT
              image_url,
              alt_text

            FROM product_images

            WHERE product_id =
              oi.product_id

            ORDER BY
              is_primary DESC,
              sort_order ASC,
              id ASC

            LIMIT 1
          ) pi ON true

          WHERE oi.order_id = $1
            AND o.customer_id = $2

          ORDER BY
            oi.id ASC
          `,
          [
            orderId,
            customerId,
          ]
        );

      console.log(
        "ORDER ITEMS FROM DATABASE:",
        itemsResult.rows
      );

      // =================================
      // FORMAT ITEMS
      // =================================

      const items =
        itemsResult.rows.map(
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
              Number(
                item.quantity
              ),

            unitPrice:
              Number(
                item.unit_price
              ),

            discountAmount:
              Number(
                item.discount_amount
              ),

            subtotal:
              Number(
                item.subtotal
              ),

            imageUrl:
              item.imageUrl ||
              null,

            imageAlt:
              item.imageAlt ||
              item.product_name,

            canReview:
              item.canReview ===
              true,

            hasReviewed:
              item.hasReviewed ===
              true,

            createdAt:
              item.created_at,
          })
        );

      // =================================
      // FORMAT ADDRESS
      // =================================

      let address = null;

      if (
        orderRow.delivery_address_id
      ) {
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

      // =================================
      // FORMAT ORDER
      // =================================

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
          Number(
            orderRow.subtotal
          ),

        discountAmount:
          Number(
            orderRow.discount_amount
          ),

        shippingAmount:
          Number(
            orderRow.shipping_amount
          ),

        taxAmount:
          Number(
            orderRow.tax_amount
          ),

        totalAmount:
          Number(
            orderRow.total_amount
          ),

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
        JSON.stringify(
          order,
          null,
          2
        )
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
// CUSTOMER CANCEL ORDER
// Only orders that have not been packed
// yet can be cancelled by the customer.
// =====================================

const CUSTOMER_CANCELLABLE_STATUSES = [
  "new order",
  "processing",
];

const cancelCustomerOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const customerId = req.customer.id;
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const reason = String(req.body?.reason || "")
      .trim()
      .slice(0, 500);

    await client.query("BEGIN");

    // Lock the order, and make sure it belongs to this customer
    const orderResult = await client.query(
      `
      SELECT
        id,
        customer_id,
        order_number,
        order_status,
        payment_status

      FROM orders

      WHERE id = $1
        AND customer_id = $2

      FOR UPDATE
      `,
      [orderId, customerId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    const currentStatus = String(order.order_status || "")
      .trim()
      .toLowerCase();

    if (currentStatus === "cancelled") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This order is already cancelled.",
      });
    }

    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(currentStatus)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "This order can no longer be cancelled because it has already been packed or shipped. Please contact support.",
      });
    }

    // Restore exactly what was deducted for this order.
    // inventory_movements is used so gift set contents are restored too.
    const deductedResult = await client.query(
      `
      SELECT
        product_variant_id,
        SUM(quantity) AS quantity

      FROM inventory_movements

      WHERE reference_type = 'ORDER'
        AND reference_id = $1
        AND movement_type = 'Stock Out'

      GROUP BY product_variant_id
      `,
      [orderId]
    );

    for (const row of deductedResult.rows) {
      const variantId = Number(row.product_variant_id);
      const quantity = Number(row.quantity || 0);

      if (
        !Number.isInteger(variantId) ||
        variantId <= 0 ||
        quantity <= 0
      ) {
        continue;
      }

      await client.query(
        `
        UPDATE product_variants

        SET
          stock_quantity = stock_quantity + $1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $2
        `,
        [quantity, variantId]
      );

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
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `,
        [
          variantId,
          "Stock In",
          quantity,
          "ORDER",
          orderId,
          `Stock restored - order ${order.order_number} cancelled by customer`,
        ]
      );
    }

    // Update order
    await client.query(
      `
      UPDATE orders

      SET
        order_status = 'Cancelled',
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $1
      `,
      [orderId]
    );

    // Status history
    await client.query(
      `
      INSERT INTO order_status_history (
        order_id,
        order_status,
        notes,
        changed_by,
        created_at
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `,
      [
        orderId,
        "Cancelled",
        reason
          ? `Cancelled by customer. Reason: ${reason}`
          : "Cancelled by customer",
        "Customer",
      ]
    );

    // Customer notification
    const customerNotification =
      await createCustomerNotification(client, {
        customerId,
        type: NOTIFICATION_TYPES.ORDER_CANCELLED,
        title: "Order cancelled",
        message: `Your order ${order.order_number} has been cancelled.`,
        entityType: "order",
        entityId: orderId,
      });

    // Admin notification
    const wasPaid =
      String(order.payment_status || "")
        .trim()
        .toLowerCase() === "paid";

    const adminNotification =
      await notifyOrderCancelledByCustomer(client, {
        orderId,
        orderNumber: order.order_number,
        wasPaid,
      });

    await client.query("COMMIT");

    // Emit only after commit
    if (customerNotification?.id) {
      emitCustomerNotificationCreated({
        customerId,
        notificationId: customerNotification.id,
      });
    }

    if (adminNotification) {
      emitCreatedAdminNotification(adminNotification);
    }

    return res.json({
      success: true,
      message: wasPaid
        ? "Your order has been cancelled. Our team will process your refund."
        : "Your order has been cancelled.",
      order: {
        id: orderId,
        orderNumber: order.order_number,
        orderStatus: "Cancelled",
        paymentStatus: order.payment_status,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }

    console.error("Customer cancel order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  } finally {
    client.release();
  }
};

// =====================================
// EXPORT
// =====================================

module.exports = {
  createOrder,
  getCustomerOrders,
  getCustomerOrderDetails,
  cancelCustomerOrder,
};
