import express from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { callGemini } from "../services/gemini.js";
import { computeSentimentPoints, computeRatingPoints, computeMismatchPoints, computeTrustGrade } from "../services/trustScore.js";

const router = express.Router();

// POST /api/analyze/sentiment/:productId
// Runs Gemini sentiment classification on all unclassified reviews for a product
router.post("/sentiment/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId, sentiment: null });
    if (reviews.length === 0) return res.json({ success: true, message: "All reviews already classified" });

    const texts = reviews.map((r, i) => i + ". " + r.text).join("\n");
    const prompt = `Classify each review below as "positive", "neutral", or "negative".\n\nReviews:\n${texts}\n\nRespond ONLY valid JSON array matching order:\n["positive","negative","neutral",...]`;

    const raw = await callGemini(prompt);
    const sentiments = JSON.parse(raw);

    const updates = reviews.map((r, i) =>
      Review.findByIdAndUpdate(r._id, { sentiment: sentiments[i] || "neutral" })
    );
    await Promise.all(updates);

    res.json({ success: true, classified: reviews.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/analyze/themes/:productId
router.post("/themes/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    if (reviews.length === 0) return res.status(404).json({ success: false, message: "No reviews found" });

    const texts = reviews.map((r) => "[" + r.rating + "star] " + r.text).join("\n");
    const prompt = `Extract recurring themes from these product reviews.\n\nReviews:\n${texts}\n\nRespond ONLY valid JSON:\n{\n  "positiveThemes": ["theme 1","theme 2"],\n  "negativeThemes": ["theme 1","theme 2"],\n  "neutralThemes": ["theme 1"]\n}`;

    const raw = await callGemini(prompt);
    const themes = JSON.parse(raw);
    res.json({ success: true, data: themes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/analyze/mismatch/:productId
router.post("/mismatch/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const reviews = await Review.find({ productId: req.params.productId });

    const texts = reviews.map((r) => r.text).slice(0, 20).join("\n---\n");
    const prompt = `Compare seller description vs customer reviews for mismatches.\n\nSeller description:\n"${product.description}"\n\nCustomer reviews:\n${texts}\n\nRespond ONLY valid JSON:\n{\n  "mismatches": ["mismatch 1","mismatch 2"],\n  "matchScore": <0-100>,\n  "verdict": "one sentence"\n}`;

    const raw = await callGemini(prompt);
    const result = JSON.parse(raw);
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/analyze/trust/:productId
// Aggregates sentiment + mismatch + rating into a Trust Score and persists it on the product
router.post("/trust/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const reviews = await Review.find({ productId: req.params.productId });
    if (reviews.length === 0) return res.status(400).json({ success: false, message: "No reviews to analyze" });

    // ── 1. Ensure all reviews have sentiment ──────────────────────────────────
    const unclassified = reviews.filter((r) => !r.sentiment);
    if (unclassified.length > 0) {
      try {
        const texts = unclassified.map((r, i) => i + ". " + r.text).join("\n");
        const sentimentPrompt = `Classify each review as "positive", "neutral", or "negative".\n\nReviews:\n${texts}\n\nRespond ONLY valid JSON array:\n["positive","neutral",...]`;
        const raw = await callGemini(sentimentPrompt);
        const sentiments = JSON.parse(raw);
        await Promise.all(unclassified.map((r, i) =>
          Review.findByIdAndUpdate(r._id, { sentiment: sentiments[i] || "neutral" })
        ));
        // Refresh reviews array with updated sentiments
        reviews.forEach((r) => {
          const uIdx = unclassified.findIndex((u) => u._id.equals(r._id));
          if (uIdx !== -1) r.sentiment = sentiments[uIdx] || "neutral";
        });
      } catch (sentimentErr) {
        // Non-fatal: log concise message and continue with neutral fallback
        const code = sentimentErr?.cause?.status || sentimentErr?.type || "unknown";
        console.warn(`[analyze] Sentiment step failed (${code}), using neutral fallback`);
        unclassified.forEach((r) => { r.sentiment = "neutral"; });
        reviews.forEach((r) => {
          if (!r.sentiment) r.sentiment = "neutral";
        });
      }
    }

    const allReviews = await Review.find({ productId: req.params.productId });

    // ── 2–4. Mismatch prompt (Gemini) ─────────────────────────────────────────
    const texts = allReviews.map((r) => r.text).slice(0, 20).join("\n---\n");
    const mismatchPrompt = `Compare seller description vs customer reviews for mismatches.\n\nSeller description:\n"${product.description}"\n\nCustomer reviews:\n${texts}\n\nRespond ONLY valid JSON:\n{\n  "mismatches": ["mismatch 1"],\n  "matchScore": <0-100>,\n  "verdict": "one sentence"\n}`;
    const mismatchRaw = await callGemini(mismatchPrompt);
    let mismatchResult;
    try {
      mismatchResult = JSON.parse(mismatchRaw);
    } catch (parseErr) {
      return res.status(500).json({ success: false, message: "AI response could not be parsed" });
    }

    // ── 5. Aggregate trust score via helpers ──────────────────────────────────
    const sentimentPoints = computeSentimentPoints(allReviews);
    const ratingPoints = computeRatingPoints(allReviews);
    const mismatchPoints = computeMismatchPoints(mismatchResult.matchScore);
    const trustScore = sentimentPoints + ratingPoints + mismatchPoints;
    const trustGrade = computeTrustGrade(trustScore);

    // Derived values for trustBreakdown (computed locally, no scoring helpers needed)
    const total = allReviews.length;
    const positiveCount = allReviews.filter((r) => r.sentiment === "positive").length;
    const negativeCount = allReviews.filter((r) => r.sentiment === "negative").length;
    const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / total;

    const trustBreakdown = {
      sentimentPoints,
      ratingPoints,
      mismatchPoints,
      sentimentRatio: { positive: positiveCount, negative: negativeCount, total },
      averageRating: Math.round(avgRating * 10) / 10,
      matchScore: mismatchResult.matchScore,
      mismatches: mismatchResult.mismatches,
      verdict: mismatchResult.verdict,
    };

    // ── 6. Persist results (only reached on full success) ──────────────────────
    // Requirement 1.4: any throw above this line bypasses this write so existing
    // trustScore, trustGrade, and trustBreakdown fields are preserved on failure.
    await Product.findByIdAndUpdate(req.params.productId, {
      trustScore,
      trustGrade,
      trustBreakdown,
      lastAnalyzed: new Date(),
    });

    res.json({ success: true, data: { trustScore, trustGrade, trustBreakdown } });
  } catch (err) {
    const code = err?.cause?.status || err?.type || 500;
    console.error(`[analyze/trust] Error (${code}):`, err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
