const express = require("express");

const {
  getProducts,
  getBestSellers,
  getProductById,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getProducts);

router.get("/best-sellers", getBestSellers);

router.get("/:id", getProductById);

module.exports = router;