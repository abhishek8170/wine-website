const pool = require("../config/db");

// =====================================================
// ADMIN COLLECTIONS
// =====================================================

// GET ALL COLLECTIONS
const getAdminCollections = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(
          CASE
            WHEN p.id IS NOT NULL
            AND p.is_active = TRUE
            THEN p.id
          END
        )::integer AS product_count
      FROM collections c
      LEFT JOIN product_collections pc
        ON pc.collection_id = c.id
      LEFT JOIN products p
        ON p.id = pc.product_id
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.id DESC
    `);

    return res.status(200).json({
      success: true,
      collections: result.rows,
    });
  } catch (error) {
    console.error(
      "Get admin collections error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load collections",
    });
  }
};


// GET SINGLE COLLECTION
const getAdminCollectionById = async (req, res) => {
  try {
    const collectionId = Number(req.params.id);

    if (
      !Number.isInteger(collectionId) ||
      collectionId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID",
      });
    }

    const collectionResult = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM collections
      WHERE id = $1
      LIMIT 1
      `,
      [collectionId]
    );

    if (collectionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const productsResult = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.image_url,
        p.is_active
      FROM product_collections pc
      INNER JOIN products p
        ON p.id = pc.product_id
      WHERE pc.collection_id = $1
      ORDER BY p.name ASC
      `,
      [collectionId]
    );

    return res.status(200).json({
      success: true,
      collection: {
        ...collectionResult.rows[0],
        products: productsResult.rows,
      },
    });
  } catch (error) {
    console.error(
      "Get admin collection error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load collection",
    });
  }
};


// CREATE COLLECTION
const createAdminCollection = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      slug,
      description,
      is_active,
      product_ids,
    } = req.body;

    const cleanName = String(name || "").trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required",
      });
    }

    // -------------------------------------------------
    // Generate slug if frontend doesn't provide one
    // -------------------------------------------------

    let cleanSlug = String(slug || "")
      .trim()
      .toLowerCase();

    if (!cleanSlug) {
      cleanSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (!cleanSlug) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection slug",
      });
    }

    // new-arrivals is automatic and should not be manually created
    if (cleanSlug === "new-arrivals") {
      return res.status(400).json({
        success: false,
        message:
          "New Arrivals is automatically generated and cannot be created manually.",
      });
    }

    // -------------------------------------------------
    // Check duplicate slug
    // -------------------------------------------------

    const duplicateResult = await client.query(
      `
      SELECT id
      FROM collections
      WHERE LOWER(slug) = LOWER($1)
      LIMIT 1
      `,
      [cleanSlug]
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "A collection with this slug already exists.",
      });
    }

    await client.query("BEGIN");

    const collectionResult = await client.query(
      `
      INSERT INTO collections (
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
      `,
      [
        cleanName,
        cleanSlug,
        description
          ? String(description).trim()
          : null,
        is_active !== false,
      ]
    );

    const collection =
      collectionResult.rows[0];

    // -------------------------------------------------
    // Optional product assignments
    // -------------------------------------------------

    const productIds = Array.isArray(product_ids)
      ? product_ids
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(id) && id > 0
          )
      : [];

    for (const productId of productIds) {
      await client.query(
        `
        INSERT INTO product_collections (
          product_id,
          collection_id,
          created_at
        )
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING
        `,
        [productId, collection.id]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Collection created successfully",
      collection,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Create admin collection error:",
      error
    );

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message:
          "A collection with this slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create collection",
    });
  } finally {
    client.release();
  }
};


// UPDATE COLLECTION
const updateAdminCollection = async (req, res) => {
  const client = await pool.connect();

  try {
    const collectionId = Number(req.params.id);

    if (
      !Number.isInteger(collectionId) ||
      collectionId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID",
      });
    }

    const existingResult = await client.query(
      `
      SELECT *
      FROM collections
      WHERE id = $1
      LIMIT 1
      `,
      [collectionId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const existing =
      existingResult.rows[0];

    const cleanName =
      req.body.name !== undefined
        ? String(req.body.name).trim()
        : existing.name;

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required",
      });
    }

    let cleanSlug =
      req.body.slug !== undefined
        ? String(req.body.slug)
            .trim()
            .toLowerCase()
        : existing.slug;

    if (!cleanSlug) {
      cleanSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (cleanSlug === "new-arrivals") {
      return res.status(400).json({
        success: false,
        message:
          "New Arrivals is automatically generated and cannot be managed manually.",
      });
    }

    // -------------------------------------------------
    // Duplicate slug check
    // -------------------------------------------------

    const duplicateResult = await client.query(
      `
      SELECT id
      FROM collections
      WHERE LOWER(slug) = LOWER($1)
        AND id <> $2
      LIMIT 1
      `,
      [cleanSlug, collectionId]
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "A collection with this slug already exists.",
      });
    }

    await client.query("BEGIN");

    const updateResult = await client.query(
      `
      UPDATE collections
      SET
        name = $1,
        slug = $2,
        description = $3,
        is_active = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [
        cleanName,
        cleanSlug,
        req.body.description !== undefined
          ? String(req.body.description).trim() ||
            null
          : existing.description,
        req.body.is_active !== undefined
          ? req.body.is_active !== false
          : existing.is_active,
        collectionId,
      ]
    );

    // -------------------------------------------------
    // Replace product assignments
    // -------------------------------------------------

    if (Array.isArray(req.body.product_ids)) {
      await client.query(
        `
        DELETE FROM product_collections
        WHERE collection_id = $1
        `,
        [collectionId]
      );

      const productIds = req.body.product_ids
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) && id > 0
        );

      for (const productId of productIds) {
        await client.query(
          `
          INSERT INTO product_collections (
            product_id,
            collection_id,
            created_at
          )
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
          `,
          [productId, collectionId]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully",
      collection: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update admin collection error:",
      error
    );

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message:
          "A collection with this slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update collection",
    });
  } finally {
    client.release();
  }
};


// UPDATE COLLECTION STATUS
const updateAdminCollectionStatus = async (
  req,
  res
) => {
  try {
    const collectionId = Number(req.params.id);

    if (
      !Number.isInteger(collectionId) ||
      collectionId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID",
      });
    }

    const isActive =
      req.body.is_active !== false;

    const result = await pool.query(
      `
      UPDATE collections
      SET
        is_active = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [isActive, collectionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Collection activated successfully"
        : "Collection deactivated successfully",
      collection: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update collection status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update collection status",
    });
  }
};


// DELETE COLLECTION
const deleteAdminCollection = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const collectionId = Number(req.params.id);

    if (
      !Number.isInteger(collectionId) ||
      collectionId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID",
      });
    }

    const existingResult = await client.query(
      `
      SELECT id, slug
      FROM collections
      WHERE id = $1
      LIMIT 1
      `,
      [collectionId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (
      existingResult.rows[0].slug ===
      "new-arrivals"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New Arrivals is automatically generated and cannot be deleted.",
      });
    }

    await client.query("BEGIN");

    await client.query(
      `
      DELETE FROM product_collections
      WHERE collection_id = $1
      `,
      [collectionId]
    );

    await client.query(
      `
      DELETE FROM collections
      WHERE id = $1
      `,
      [collectionId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Delete admin collection error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete collection",
    });
  } finally {
    client.release();
  }
};


module.exports = {
  getAdminCollections,
  getAdminCollectionById,
  createAdminCollection,
  updateAdminCollection,
  updateAdminCollectionStatus,
  deleteAdminCollection,
};