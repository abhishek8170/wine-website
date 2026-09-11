const pool = require("../config/db");

// =========================================================
// GET COMPLETE OUR STORY
// PUBLIC API
// GET /api/our-story
// =========================================================

const getOurStory = async (req, res) => {
  try {
    // Main Our Story content
    const storyResult = await pool.query(`
      SELECT
        id,
        section_label,
        heading,
        highlighted_heading,
        philosophy_title,
        philosophy_heading,
        story_paragraph_1,
        story_paragraph_2,
        story_paragraph_3,
        image_url,
        image_alt,
        image_caption,
        stat_1_number,
        stat_1_label,
        stat_2_number,
        stat_2_label,
        stat_3_number,
        stat_3_label,
        bottom_label,
        bottom_quote,
        cta_text,
        cta_url,
        is_active,
        created_at,
        updated_at
      FROM our_story
      WHERE is_active = TRUE
      ORDER BY id ASC
      LIMIT 1
    `);

    if (storyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Our Story content not found",
      });
    }

    const row = storyResult.rows[0];

    // =====================================================
    // WINERY HISTORY
    // =====================================================

    const historyResult = await pool.query(`
      SELECT
        id,
        year,
        title,
        description,
        image_url,
        image_alt,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM our_story_history
      WHERE is_active = TRUE
      ORDER BY display_order ASC, id ASC
    `);

    // =====================================================
    // VINEYARD
    // =====================================================

    const vineyardResult = await pool.query(`
      SELECT
        id,
        title,
        description,
        location,
        grape_varieties,
        image_url,
        image_alt,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM our_story_vineyard
      WHERE is_active = TRUE
      ORDER BY display_order ASC, id ASC
    `);

    // =====================================================
    // WINEMAKING PROCESS
    // =====================================================

    const processResult = await pool.query(`
      SELECT
        id,
        step_number,
        title,
        description,
        image_url,
        image_alt,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM our_story_process
      WHERE is_active = TRUE
      ORDER BY display_order ASC, id ASC
    `);

    // =====================================================
    // QUALITY STANDARDS
    // =====================================================

    const qualityResult = await pool.query(`
      SELECT
        id,
        title,
        description,
        icon,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM our_story_quality
      WHERE is_active = TRUE
      ORDER BY display_order ASC, id ASC
    `);

    // =====================================================
    // TEAM
    // =====================================================

    const teamResult = await pool.query(`
      SELECT
        id,
        name,
        role,
        bio,
        image_url,
        image_alt,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM our_story_team
      WHERE is_active = TRUE
      ORDER BY display_order ASC, id ASC
    `);

    // =====================================================
    // AWARDS
    // =====================================================

    const awardsResult = await pool.query(`
      SELECT
        id,
        award_name,
        organization,
        year,
        description,
        image_url,
        image_alt,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM our_story_awards
      WHERE is_active = TRUE
      ORDER BY display_order ASC, id ASC
    `);

    // =====================================================
    // SUSTAINABILITY
    // =====================================================

    const sustainabilityResult = await pool.query(`
      SELECT
        id,
        title,
        description,
        image_url,
        image_alt,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM our_story_sustainability
      WHERE is_active = TRUE
      ORDER BY display_order ASC, id ASC
    `);

    // =====================================================
    // FORMAT MAIN OUR STORY
    // =====================================================

    const ourStory = {
      id: row.id,

      sectionLabel: row.section_label,
      heading: row.heading,
      highlightedHeading: row.highlighted_heading,

      philosophyTitle: row.philosophy_title,
      philosophyHeading: row.philosophy_heading,

      storyParagraph1: row.story_paragraph_1,
      storyParagraph2: row.story_paragraph_2,
      storyParagraph3: row.story_paragraph_3,

      imageUrl: row.image_url,
      imageAlt: row.image_alt,
      imageCaption: row.image_caption,

      stats: [
        {
          number: row.stat_1_number,
          label: row.stat_1_label,
        },
        {
          number: row.stat_2_number,
          label: row.stat_2_label,
        },
        {
          number: row.stat_3_number,
          label: row.stat_3_label,
        },
      ],

      bottomLabel: row.bottom_label,
      bottomQuote: row.bottom_quote,

      ctaText: row.cta_text,
      ctaUrl: row.cta_url,

      isActive: row.is_active,

      createdAt: row.created_at,
      updatedAt: row.updated_at,

      // New dynamic sections
      history: historyResult.rows.map((item) => ({
        id: item.id,
        year: item.year,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        imageAlt: item.image_alt,
        displayOrder: item.display_order,
        isActive: item.is_active,
      })),

      vineyard: vineyardResult.rows.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        location: item.location,
        grapeVarieties: item.grape_varieties,
        imageUrl: item.image_url,
        imageAlt: item.image_alt,
        displayOrder: item.display_order,
        isActive: item.is_active,
      })),

      process: processResult.rows.map((item) => ({
        id: item.id,
        stepNumber: item.step_number,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        imageAlt: item.image_alt,
        displayOrder: item.display_order,
        isActive: item.is_active,
      })),

      quality: qualityResult.rows.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        icon: item.icon,
        displayOrder: item.display_order,
        isActive: item.is_active,
      })),

      team: teamResult.rows.map((item) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        bio: item.bio,
        imageUrl: item.image_url,
        imageAlt: item.image_alt,
        displayOrder: item.display_order,
        isActive: item.is_active,
      })),

      awards: awardsResult.rows.map((item) => ({
        id: item.id,
        awardName: item.award_name,
        organization: item.organization,
        year: item.year,
        description: item.description,
        imageUrl: item.image_url,
        imageAlt: item.image_alt,
        displayOrder: item.display_order,
        isActive: item.is_active,
      })),

      sustainability: sustainabilityResult.rows.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        imageAlt: item.image_alt,
        displayOrder: item.display_order,
        isActive: item.is_active,
      })),
    };

    return res.json({
      success: true,
      ourStory,
    });
  } catch (error) {
    console.error("Get Our Story error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load Our Story",
    });
  }
};


// =========================================================
// ADMIN — GET ALL OUR STORY DATA
// =========================================================

const getAdminOurStory = async (req, res) => {
  try {
    const [
      story,
      history,
      vineyard,
      process,
      quality,
      team,
      awards,
      sustainability,
    ] = await Promise.all([
      pool.query(`SELECT * FROM our_story ORDER BY id ASC`),

      pool.query(`
        SELECT *
        FROM our_story_history
        ORDER BY display_order ASC, id ASC
      `),

      pool.query(`
        SELECT *
        FROM our_story_vineyard
        ORDER BY display_order ASC, id ASC
      `),

      pool.query(`
        SELECT *
        FROM our_story_process
        ORDER BY display_order ASC, id ASC
      `),

      pool.query(`
        SELECT *
        FROM our_story_quality
        ORDER BY display_order ASC, id ASC
      `),

      pool.query(`
        SELECT *
        FROM our_story_team
        ORDER BY display_order ASC, id ASC
      `),

      pool.query(`
        SELECT *
        FROM our_story_awards
        ORDER BY display_order ASC, id ASC
      `),

      pool.query(`
        SELECT *
        FROM our_story_sustainability
        ORDER BY display_order ASC, id ASC
      `),
    ]);

    return res.json({
      success: true,
      data: {
        story: story.rows,
        history: history.rows,
        vineyard: vineyard.rows,
        process: process.rows,
        quality: quality.rows,
        team: team.rows,
        awards: awards.rows,
        sustainability: sustainability.rows,
      },
    });
  } catch (error) {
    console.error("Get admin Our Story error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin Our Story data",
    });
  }
};


// =========================================================
// GENERIC HELPERS
// =========================================================

const createItem = async (req, res, table, fields, values) => {
  try {
    const columns = fields.join(", ");
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const result = await pool.query(
      `
      INSERT INTO ${table} (${columns})
      VALUES (${placeholders})
      RETURNING *
      `,
      values
    );

    return res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Create ${table} error:`, error);

    return res.status(500).json({
      success: false,
      message: "Failed to create item",
    });
  }
};


const updateItem = async (req, res, table, fields) => {
  try {
    const { id } = req.params;

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const values = fields.map((field) => req.body[field]);

    values.push(id);

    const result = await pool.query(
      `
      UPDATE ${table}
      SET ${setClause},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.json({
      success: true,
      message: "Item updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Update ${table} error:`, error);

    return res.status(500).json({
      success: false,
      message: "Failed to update item",
    });
  }
};


const deleteItem = async (req, res, table) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM ${table}
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error(`Delete ${table} error:`, error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
    });
  }
};


// =========================================================
// HISTORY
// =========================================================

const createHistory = (req, res) =>
  createItem(
    req,
    res,
    "our_story_history",
    [
      "year",
      "title",
      "description",
      "image_url",
      "image_alt",
      "display_order",
      "is_active",
    ],
    [
      req.body.year,
      req.body.title,
      req.body.description,
      req.body.image_url,
      req.body.image_alt,
      req.body.display_order ?? 0,
      req.body.is_active ?? true,
    ]
  );


const updateHistory = (req, res) =>
  updateItem(req, res, "our_story_history", [
    "year",
    "title",
    "description",
    "image_url",
    "image_alt",
    "display_order",
    "is_active",
  ]);


const deleteHistory = (req, res) =>
  deleteItem(req, res, "our_story_history");


// =========================================================
// VINEYARD
// =========================================================

const createVineyard = (req, res) =>
  createItem(
    req,
    res,
    "our_story_vineyard",
    [
      "title",
      "description",
      "location",
      "grape_varieties",
      "image_url",
      "image_alt",
      "display_order",
      "is_active",
    ],
    [
      req.body.title,
      req.body.description,
      req.body.location,
      req.body.grape_varieties,
      req.body.image_url,
      req.body.image_alt,
      req.body.display_order ?? 0,
      req.body.is_active ?? true,
    ]
  );


const updateVineyard = (req, res) =>
  updateItem(req, res, "our_story_vineyard", [
    "title",
    "description",
    "location",
    "grape_varieties",
    "image_url",
    "image_alt",
    "display_order",
    "is_active",
  ]);


const deleteVineyard = (req, res) =>
  deleteItem(req, res, "our_story_vineyard");


// =========================================================
// WINEMAKING PROCESS
// =========================================================

const createProcess = (req, res) =>
  createItem(
    req,
    res,
    "our_story_process",
    [
      "step_number",
      "title",
      "description",
      "image_url",
      "image_alt",
      "display_order",
      "is_active",
    ],
    [
      req.body.step_number,
      req.body.title,
      req.body.description,
      req.body.image_url,
      req.body.image_alt,
      req.body.display_order ?? 0,
      req.body.is_active ?? true,
    ]
  );


const updateProcess = (req, res) =>
  updateItem(req, res, "our_story_process", [
    "step_number",
    "title",
    "description",
    "image_url",
    "image_alt",
    "display_order",
    "is_active",
  ]);


const deleteProcess = (req, res) =>
  deleteItem(req, res, "our_story_process");


// =========================================================
// QUALITY
// =========================================================

const createQuality = (req, res) =>
  createItem(
    req,
    res,
    "our_story_quality",
    [
      "title",
      "description",
      "icon",
      "display_order",
      "is_active",
    ],
    [
      req.body.title,
      req.body.description,
      req.body.icon,
      req.body.display_order ?? 0,
      req.body.is_active ?? true,
    ]
  );


const updateQuality = (req, res) =>
  updateItem(req, res, "our_story_quality", [
    "title",
    "description",
    "icon",
    "display_order",
    "is_active",
  ]);


const deleteQuality = (req, res) =>
  deleteItem(req, res, "our_story_quality");


// =========================================================
// TEAM
// =========================================================

const createTeam = (req, res) =>
  createItem(
    req,
    res,
    "our_story_team",
    [
      "name",
      "role",
      "bio",
      "image_url",
      "image_alt",
      "display_order",
      "is_active",
    ],
    [
      req.body.name,
      req.body.role,
      req.body.bio,
      req.body.image_url,
      req.body.image_alt,
      req.body.display_order ?? 0,
      req.body.is_active ?? true,
    ]
  );


const updateTeam = (req, res) =>
  updateItem(req, res, "our_story_team", [
    "name",
    "role",
    "bio",
    "image_url",
    "image_alt",
    "display_order",
    "is_active",
  ]);


const deleteTeam = (req, res) =>
  deleteItem(req, res, "our_story_team");


// =========================================================
// AWARDS
// =========================================================

const createAward = (req, res) =>
  createItem(
    req,
    res,
    "our_story_awards",
    [
      "award_name",
      "organization",
      "year",
      "description",
      "image_url",
      "image_alt",
      "display_order",
      "is_active",
    ],
    [
      req.body.award_name,
      req.body.organization,
      req.body.year,
      req.body.description,
      req.body.image_url,
      req.body.image_alt,
      req.body.display_order ?? 0,
      req.body.is_active ?? true,
    ]
  );


const updateAward = (req, res) =>
  updateItem(req, res, "our_story_awards", [
    "award_name",
    "organization",
    "year",
    "description",
    "image_url",
    "image_alt",
    "display_order",
    "is_active",
  ]);


const deleteAward = (req, res) =>
  deleteItem(req, res, "our_story_awards");


// =========================================================
// SUSTAINABILITY
// =========================================================

const createSustainability = (req, res) =>
  createItem(
    req,
    res,
    "our_story_sustainability",
    [
      "title",
      "description",
      "image_url",
      "image_alt",
      "display_order",
      "is_active",
    ],
    [
      req.body.title,
      req.body.description,
      req.body.image_url,
      req.body.image_alt,
      req.body.display_order ?? 0,
      req.body.is_active ?? true,
    ]
  );


const updateSustainability = (req, res) =>
  updateItem(req, res, "our_story_sustainability", [
    "title",
    "description",
    "image_url",
    "image_alt",
    "display_order",
    "is_active",
  ]);


const deleteSustainability = (req, res) =>
  deleteItem(req, res, "our_story_sustainability");


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  getOurStory,
  getAdminOurStory,

  createHistory,
  updateHistory,
  deleteHistory,

  createVineyard,
  updateVineyard,
  deleteVineyard,

  createProcess,
  updateProcess,
  deleteProcess,

  createQuality,
  updateQuality,
  deleteQuality,

  createTeam,
  updateTeam,
  deleteTeam,

  createAward,
  updateAward,
  deleteAward,

  createSustainability,
  updateSustainability,
  deleteSustainability,
};