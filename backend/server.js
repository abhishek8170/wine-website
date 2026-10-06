const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./config/db");

const {
  setNotificationIO,
} = require("./utils/notificationSocket");

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

// Admin
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminProductRoutes = require("./routes/adminProductRoutes");
const adminVariantRoutes = require("./routes/adminVariantRoutes");
const adminInventoryRoutes = require("./routes/adminInventoryRoutes");
const adminCustomerRoutes = require("./routes/adminCustomerRoutes");
const adminUploadRoutes = require("./routes/adminUploadRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminShipmentRoutes = require("./routes/adminShipmentRoutes");
const adminSettingsRoutes = require("./routes/adminSettingsRoutes");
const publicSettingsRoutes = require("./routes/publicSettingsRoutes");
const deliveryZoneRoutes = require("./routes/deliveryZoneRoutes");
const deliveryCheckRoutes = require("./routes/deliveryCheckRoutes");
const couponRoutes = require("./routes/couponRoutes");
const adminCouponRoutes = require("./routes/adminCouponRoutes");
const customerCouponRoutes = require("./routes/customerCouponRoutes");
const adminNewsletterRoutes = require("./routes/adminNewsletterRoutes");
const adminContactRoutes = require("./routes/adminContactRoutes");
const adminOurStoryRoutes = require("./routes/adminOurStoryRoutes");
const adminManagementRoutes = require("./routes/adminManagementRoutes");
const adminReviewRoutes = require("./routes/adminReviewRoutes");
const giftSetRoutes = require("./routes/giftSetRoutes");
const adminCollectionRoutes = require("./routes/adminCollectionRoutes");
const adminGiftSetRoutes = require("./routes/adminGiftSetRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const notificationPreferenceRoutes = require(
  "./routes/notificationPreferenceRoutes"
);
const adminNotificationRoutes = require(
  "./routes/adminNotificationRoutes"
);

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

/*
|--------------------------------------------------------------------------
| Customer / Storefront APIs
|--------------------------------------------------------------------------
*/

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/our-story", ourStoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wine-guide", wineGuideRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);

/*
|--------------------------------------------------------------------------
| Admin APIs
|--------------------------------------------------------------------------
*/

app.use("/api/admin/auth", adminAuthRoutes);

app.use("/api/admin/admins", adminRoutes);

app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);

app.use(
  "/api/admin/products",
  adminProductRoutes
);

app.use(
  "/api/admin/products",
  adminVariantRoutes
);

app.use(
  "/api/admin/inventory",
  adminInventoryRoutes
);

app.use(
  "/api/admin/customers",
  adminCustomerRoutes
);

app.use(
  "/api/admin/uploads",
  adminUploadRoutes
);

app.use("/api/admin/orders", adminOrderRoutes);

app.use("/api/admin/shipments", adminShipmentRoutes);

app.use(
  "/api/admin/settings",
  adminSettingsRoutes
);

app.use(
  "/api/settings",
  publicSettingsRoutes
);

app.use("/api/admin/delivery-zones", deliveryZoneRoutes);
app.use("/api/delivery", deliveryZoneRoutes);
app.use("/api/delivery", deliveryCheckRoutes);

app.use(
  "/api/admin/coupons",
  couponRoutes
);
app.use(
  "/api/admin/coupons",
  adminCouponRoutes
);
app.use(
  "/api/coupons",
  customerCouponRoutes
);

app.use(
  "/api/admin/newsletter",
  adminNewsletterRoutes
);

app.use("/api/admin/contact-messages", adminContactRoutes);

app.use(
  "/api/admin/our-story",
  adminOurStoryRoutes
);

app.use("/api/admin/admins", adminManagementRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/gift-sets", giftSetRoutes);

app.use(
  "/api/admin/collections",
  adminCollectionRoutes
);

app.use("/api/admin/gift-sets", adminGiftSetRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/notification-preferences",
  notificationPreferenceRoutes
);

app.use(
  "/api/admin/notifications",
  adminNotificationRoutes
);

/*
|--------------------------------------------------------------------------
| Test Routes
|--------------------------------------------------------------------------
*/

app.get(
  "/api/test-route",
  (req, res) => {
    res.json({
      message: "Test route is working",
    });
  }
);

app.get(
  "/",
  (req, res) => {
    res.json({
      message: "Wine Website API is running",
    });
  }
);

app.get(
  "/api/test-db",
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT NOW()"
      );

      res.json({
        message:
          "PostgreSQL connected successfully",
        time: result.rows[0].now,
      });
    } catch (error) {
      console.error(
        "Database connection error:",
        error
      );

      res.status(500).json({
        message:
          "Database connection failed",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Protected Customer Test
|--------------------------------------------------------------------------
*/

app.get(
  "/api/protected-test",
  authMiddleware,
  (req, res) => {
    res.json({
      success: true,
      message: "You are authenticated",
      customer: req.customer,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/

   const PORT = process.env.PORT || 5000;
/*
|--------------------------------------------------------------------------
| HTTP SERVER
|--------------------------------------------------------------------------
*/

const server = http.createServer(app);

/*
|--------------------------------------------------------------------------
| SOCKET.IO
|--------------------------------------------------------------------------
*/

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setNotificationIO(io);

io.on("connection", (socket) => {
  console.log(
    "Admin notification socket connected:",
    socket.id
  );

  socket.on("disconnect", () => {
    console.log(
      "Admin notification socket disconnected:",
      socket.id
    );
  });
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

server.listen(
  PORT,
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  }
);