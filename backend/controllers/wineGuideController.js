const pool = require("../config/db");

// ==========================================
// GET PUBLISHED WINE GUIDE ARTICLES
// ==========================================

const getWineGuideArticles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        slug,
        excerpt,
        content,
        category,
        author,
        image_url,
        image_alt,
        is_featured,
        is_published,
        published_at,
        meta_title,
        meta_description,
        created_at,
        updated_at

      FROM wine_guide_articles

      WHERE is_published = TRUE

      ORDER BY
        COALESCE(published_at, created_at) DESC
    `);

    const articles = result.rows.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      author: article.author,

      imageUrl: article.image_url,
      imageAlt: article.image_alt,

      isFeatured: article.is_featured,
      isPublished: article.is_published,

      publishedAt: article.published_at,
      createdAt: article.created_at,
      updatedAt: article.updated_at,

      metaTitle: article.meta_title,
      metaDescription: article.meta_description,
    }));

    res.json({
      success: true,
      articles,
    });
  } catch (error) {
    console.error("Get wine guide articles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wine guide articles",
    });
  }
};


// ==========================================
// GET FEATURED WINE GUIDE ARTICLES
// Homepage
// ==========================================

const getFeaturedWineGuideArticles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        slug,
        excerpt,
        category,
        author,
        image_url,
        image_alt,
        is_featured,
        published_at

      FROM wine_guide_articles

      WHERE
        is_published = TRUE
        AND is_featured = TRUE

      ORDER BY
        COALESCE(published_at, created_at) DESC

      LIMIT 3
    `);

    const articles = result.rows.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: article.category,
      author: article.author,

      imageUrl: article.image_url,
      imageAlt: article.image_alt,

      isFeatured: article.is_featured,

      publishedAt: article.published_at,
    }));

    res.json({
      success: true,
      articles,
    });
  } catch (error) {
    console.error("Get featured wine guide articles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch featured wine guide articles",
    });
  }
};


// ==========================================
// GET SINGLE ARTICLE BY SLUG
// Future Wine Guide article page
// ==========================================

const getWineGuideArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        title,
        slug,
        excerpt,
        content,
        category,
        author,
        image_url,
        image_alt,
        is_featured,
        is_published,
        published_at,
        meta_title,
        meta_description,
        created_at,
        updated_at

      FROM wine_guide_articles

      WHERE
        slug = $1
        AND is_published = TRUE

      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wine guide article not found",
      });
    }

    const article = result.rows[0];

    res.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        author: article.author,

        imageUrl: article.image_url,
        imageAlt: article.image_alt,

        isFeatured: article.is_featured,
        isPublished: article.is_published,

        publishedAt: article.published_at,
        createdAt: article.created_at,
        updatedAt: article.updated_at,

        metaTitle: article.meta_title,
        metaDescription: article.meta_description,
      },
    });
  } catch (error) {
    console.error("Get wine guide article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wine guide article",
    });
  }
};


module.exports = {
  getWineGuideArticles,
  getFeaturedWineGuideArticles,
  getWineGuideArticleBySlug,
};