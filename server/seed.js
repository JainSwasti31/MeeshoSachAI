/**
 * Seed script — populates the DB with sample products and reviews.
 * Run: npm run seed
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Review from "./models/Review.js";

dotenv.config();

const PRODUCTS = [
  {
    title: "Banarasi Silk Saree - Royal Blue",
    description:
      "Handwoven Banarasi silk saree with intricate zari work and golden border. 6.3 metres including blouse piece. Pure silk, dry clean only.",
    category: "Sarees",
    price: 4999,
    images: ["https://placehold.co/400x500?text=Saree"],
  },
  {
    title: "Anarkali Kurti - Floral Print",
    description:
      "Flared Anarkali style kurti in soft cotton fabric with all-over floral print. Machine washable. Available in sizes S–XXL.",
    category: "Kurtis",
    price: 799,
    images: ["https://placehold.co/400x500?text=Kurti"],
  },
  {
    title: "Bridal Lehenga - Red and Gold",
    description:
      "Heavy embroidered bridal lehenga with dupatta and choli. Semi-stitched, customisable blouse. Premium velvet fabric with stone work.",
    category: "Lehengas",
    price: 12999,
    images: ["https://placehold.co/400x500?text=Lehenga"],
  },
  {
    title: "Oxidised Silver Jhumka Earrings",
    description:
      "Traditional oxidised silver-toned jhumka earrings with meenakari work. Lightweight, nickel-free, suitable for sensitive ears.",
    category: "Jewellery",
    price: 349,
    images: ["https://placehold.co/400x500?text=Jhumka"],
  },
  {
    title: "Non-stick Kadai with Lid - 3L",
    description:
      "3-litre non-stick aluminium kadai with tempered glass lid. Compatible with all cooktops including induction. PFOA-free coating.",
    category: "Kitchen",
    price: 1299,
    images: ["https://placehold.co/400x500?text=Kadai"],
  },
];

const REVIEW_POOL = {
  positive: [
    "Absolutely love this product! Quality is top-notch and exactly as described.",
    "Great value for money. Arrived quickly and packaging was excellent.",
    "Stunning quality! The fabric is so soft and the colour is even better in person.",
    "Very happy with my purchase. Would definitely buy again.",
    "Perfect fit and beautiful craftsmanship. Highly recommended!",
  ],
  neutral: [
    "Decent product for the price. Nothing extraordinary but does the job.",
    "Colour is slightly different from the photos but overall acceptable.",
    "Delivery was slow but the product quality is okay.",
    "Average quality. Expected a bit more but not terrible.",
  ],
  negative: [
    "Very disappointed. The quality is nothing like what was shown in the images.",
    "Stitching came apart after two washes. Terrible quality control.",
    "Received a different size than ordered and customer support was unhelpful.",
    "The material feels cheap and synthetic despite the product description claiming otherwise.",
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReviews(productId) {
  const reviews = [];
  const names = ["Priya S", "Anjali M", "Kavitha R", "Deepa N", "Sunita P", "Meena K", "Ritu G", "Pooja T"];

  // 6 positive, 2 neutral, 2 negative
  for (let i = 0; i < 6; i++) {
    reviews.push({ productId, reviewerName: pickRandom(names), rating: Math.random() > 0.5 ? 5 : 4, text: pickRandom(REVIEW_POOL.positive) });
  }
  for (let i = 0; i < 2; i++) {
    reviews.push({ productId, reviewerName: pickRandom(names), rating: 3, text: pickRandom(REVIEW_POOL.neutral) });
  }
  for (let i = 0; i < 2; i++) {
    reviews.push({ productId, reviewerName: pickRandom(names), rating: Math.random() > 0.5 ? 2 : 1, text: pickRandom(REVIEW_POOL.negative) });
  }
  return reviews;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅  Connected to MongoDB");

  await Product.deleteMany({});
  await Review.deleteMany({});
  console.log("🗑   Cleared existing data");

  for (const productData of PRODUCTS) {
    const product = await Product.create(productData);
    const reviews = generateReviews(product._id);
    await Review.insertMany(reviews);

    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(product._id, {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: reviews.length,
    });

    console.log(`   ✔ ${product.title} (${reviews.length} reviews)`);
  }

  console.log(`\n🌱  Seeded ${PRODUCTS.length} products successfully`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
