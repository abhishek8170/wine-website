const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const ourStoryRoutes = require("./routes/ourStoryRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const wineGuideRoutes = require("./routes/wineGuideRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Product routes
app.use("/api/products", productRoutes);

// Category routes
app.use("/api/categories", categoryRoutes);

// Authentication routes
app.use("/api/auth", authRoutes);

// Cart routes
app.use("/api/cart", cartRoutes);

// address routes
app.use("/api/addresses", addressRoutes);

// Whislist routes
app.use("/api/wishlist", wishlistRoutes);

//Order routes
app.use("/api/orders", orderRoutes);

// Collection Routes
app.use("/api/collections", collectionRoutes);

// Our story
app.use("/api/our-story", ourStoryRoutes);

//Review route
app.use("/api/reviews", reviewRoutes);

//Wine Guide Routes
app.use("/api/wine-guide", wineGuideRoutes);

// Newsletter Routes
app.use("/api/newsletter", newsletterRoutes);

// Contact Routes
app.use("/api/contact", contactRoutes);

// Temporary test route
app.get("/api/test-route", (req, res) => {
  res.json({
    message: "Test route is working",
  });
});

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Wine Website API is running",
  });
});

// Database test route
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "PostgreSQL connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// Protected authentication test route
app.get("/api/protected-test", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "You are authenticated",
    customer: req.customer,
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});