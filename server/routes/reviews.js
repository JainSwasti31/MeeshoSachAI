import express from "express";
import { body, param, validationResult } from "express-validator";
import Review from "../models/Review.js";
import Product from "../models/Product.js";

const router = express.Router({ mergeParams: true }); // mergeParams to access :productId

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// Recalculate and persist averageRating + totalReviews on the parent product
async function syncProductStats(productId) {
  const stats = await Review.aggregate([
    { $match: { productId: new (await import("mongoose")).default.Types.ObjectId(productId) } },
    { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg = stats[0]?.avg ?? 0;
  const count = stats[0]?.count ?? 0;
  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: count,
  });
}

// GET /api/products/:productId/reviews
router.get(
  "/",
  [param("productId").isMongoId()],
  validate,
  async (req, res) => {
    try {
      const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, data: reviews });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/products/:productId/reviews — submit a review
router.post(
  "/",
  [
    param("productId").isMongoId(),
    body("reviewerName").optional().trim().isLength({ max: 100 }),
    body("rating").isInt({ min: 1, max: 5 }),
    body("text").notEmpty().trim().isLength({ min: 5, max: 2000 }),
  ],
  validate,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.productId);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });

      const review = await Review.create({ productId: req.params.productId, ...req.body });
      await syncProductStats(req.params.productId);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// DELETE /api/products/:productId/reviews/:reviewId
router.delete(
  "/:reviewId",
  [param("productId").isMongoId(), param("reviewId").isMongoId()],
  validate,
  async (req, res) => {
    try {
      const review = await Review.findOneAndDelete({
        _id: req.params.reviewId,
        productId: req.params.productId,
      });
      if (!review) return res.status(404).json({ success: false, message: "Review not found" });
      await syncProductStats(req.params.productId);
      res.json({ success: true, message: "Review deleted" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;
