import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    reviewerName: { type: String, default: "Anonymous" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: null },
    themes: [{ type: String }],
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
