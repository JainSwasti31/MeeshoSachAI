import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Sarees","Kurtis","Lehengas","Tops","Ethnic Wear","Jewellery","Home Decor","Kitchen","Beauty","Kids Wear","Footwear","Electronics","Other"],
    },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    trustScore: { type: Number, default: null },
    trustGrade: { type: String, default: null },
    trustBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    lastAnalyzed: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
