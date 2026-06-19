import express from "express";
import { body, param, query, validationResult } from "express-validator";
import Product from "../models/Product.js";
import Review from "../models/Review.js";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// GET /api/products — list with optional category/search filter + pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("category").optional().isString().trim().escape(),
    query("search").optional().isString().trim(),
    query("sort").optional().isIn(["newest", "rating", "trustScore", "price_asc", "price_desc"]),
  ],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 12;
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.category) filter.category = req.query.category;
      if (req.query.search) filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];

      const sortMap = {
        newest: { createdAt: -1 },
        rating: { averageRating: -1 },
        trustScore: { trustScore: -1 },
        price_asc: { price: 1 },
        price_desc: { price: -1 },
      };
      const sort = sortMap[req.query.sort] || { createdAt: -1 };

      const [products, total] = await Promise.all([
        Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: products,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/products/:id
router.get(
  "/:id",
  [param("id").isMongoId()],
  validate,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).lean();
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/products — create
router.post(
  "/",
  [
    body("title").notEmpty().trim().isLength({ max: 200 }),
    body("description").notEmpty().trim().isLength({ max: 2000 }),
    body("category").notEmpty().isIn([
      "Sarees","Kurtis","Lehengas","Tops","Ethnic Wear","Jewellery",
      "Home Decor","Kitchen","Beauty","Kids Wear","Footwear","Electronics","Other",
    ]),
    body("price").isFloat({ min: 0 }),
    body("images").optional().isArray(),
    body("images.*").optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      const product = await Product.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// PUT /api/products/:id — update
router.put(
  "/:id",
  [
    param("id").isMongoId(),
    body("title").optional().trim().isLength({ max: 200 }),
    body("description").optional().trim().isLength({ max: 2000 }),
    body("category").optional().isIn([
      "Sarees","Kurtis","Lehengas","Tops","Ethnic Wear","Jewellery",
      "Home Decor","Kitchen","Beauty","Kids Wear","Footwear","Electronics","Other",
    ]),
    body("price").optional().isFloat({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// DELETE /api/products/:id
router.delete(
  "/:id",
  [param("id").isMongoId()],
  validate,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      // Remove all reviews for this product
      await Review.deleteMany({ productId: req.params.id });
      res.json({ success: true, message: "Product and its reviews deleted" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;
