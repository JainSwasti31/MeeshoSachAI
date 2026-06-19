# SachAI Demo Recording Guide

> **Total target runtime: ≤ 3 minutes**
> This guide covers everything you need to record a clean, compelling hackathon demo.

---

## 1. Setup Checklist

Complete these steps **before** hitting record.

- [ ] **Seed the database** — run `npm run seed` in the `server/` directory and confirm all 5 products are inserted
- [ ] **Start the backend** — `npm run dev` in `server/`, confirm `✅ MongoDB connected` and `🚀 Server running on port 5000` in the terminal
- [ ] **Start the frontend** — `npm run dev` in `client/`, confirm Vite is serving on `http://localhost:5173`
- [ ] **Open the app** — navigate to `http://localhost:5173` in Chrome or Edge; set zoom to 100%
- [ ] **Set browser to 1080p** — resize the browser window to **1920 × 1080** (use DevTools responsive mode if needed, or record at your monitor's native 1080p resolution)
- [ ] **Pre-select a red flag product** — see [Section 4](#4-red-flag-demo) for setup instructions; have this product's detail page ready in a second tab
- [ ] **Close distracting tabs and notifications** — mute Slack, Teams, and system notifications
- [ ] **Do a dry run** — talk through the script once off-camera to check timing

---

## 2. Recording Script

> Timestamps are *targets*. Each section starts from the beginning of the video.

### [0:00 – 0:20] Hook & Introduction

**Say:**
> "This is SachAI — an AI-powered trust scoring engine for Indian e-commerce. In under a minute, it tells you whether a product's reviews are genuine or just noise. Let me show you how."

**Do:**
- Show the **HomePage** (`/`) with the product grid loaded
- Slowly scroll to show the variety of products (sarees, kurtis, jewellery, kitchen items)

---

### [0:20 – 0:45] Search & Browse

**Say:**
> "Shoppers on platforms like Meesho browse hundreds of products. SachAI integrates into that flow — let's search for a kurti."

**Do:**
- Type `kurti` in the search bar
- The **Anarkali Kurti – Floral Print** card appears
- Point out the **TrustBadge** on the card (grade shown once analyzed)
- Click the product card to open the **ProductDetailPage**

---

### [0:45 – 1:30] AI Analysis

**Say:**
> "Here's the product detail page. Ratings, reviews, and most importantly — the SachAI trust score. Watch what happens when I trigger the AI analysis."

**Do:**
- Click **"Analyze Trust Score"** button
- Point out the **loading state** — button is disabled and shows a spinner
- Wait for the analysis to complete (usually 3–6 seconds)
- The **TrustScore** and **TrustBreakdown** appear on screen

**Say:**
> "In seconds, Gemini 1.5 Flash has analysed every review, checked sentiment, evaluated rating quality, and compared the reviews against the product description."

---

### [1:30 – 2:00] Walk Through the Breakdown

**Say:**
> "The score breaks down into three pillars."

**Do:**
- Point to each pillar in the **TrustBreakdown** component:
  1. **Sentiment Analysis** (0–40 pts) — "How positive or negative are the reviews in natural language?"
  2. **Rating Quality** (0–30 pts) — "Are the star ratings consistent and believable?"
  3. **Description Match** (0–30 pts) — "Do the reviews actually talk about what the product claims to be?"

**Say:**
> "Together they produce a score from 0 to 100 — graded A+ through F. An A means you can trust what you're buying. Let's look at the other end of the scale."

---

### [2:00 – 2:40] Red Flag Demo

> Switch to the **pre-loaded red flag product tab** (see [Section 4](#4-red-flag-demo) for setup).

**Say:**
> "Here's a product that scores in the D or F range. The reviews sound positive on the surface, but our mismatch detector caught something the star rating alone never would."

**Do:**
- Show the **TrustBreakdown** — highlight the low **Description Match** score
- Point out the divergence: decent-looking stars, but AI found the review text doesn't match the product description
- Briefly scroll through a few reviews to illustrate

**Say:**
> "This is exactly the kind of product that fools shoppers every day. SachAI surfaces it in under ten seconds."

---

### [2:40 – 3:00] Closing

**Say:**
> "SachAI is built on React 19, Node.js, MongoDB, and the Gemini 1.5 Flash API — deployed on Vercel and Render, designed specifically for the Indian e-commerce context. Every score is explainable, every breakdown is transparent. That's SachAI."

**Do:**
- Pan back to the **HomePage** with the full product grid
- End recording

---

## 3. Key Talking Points

Use these during the demo or in a voice-over intro/outro. Pick 3–4 depending on time.

- **AI-powered trust scoring** — SachAI goes beyond star ratings, using Gemini 1.5 Flash to perform natural language sentiment analysis, rating consistency checks, and description-vs-review mismatch detection in a single request
- **India-specific e-commerce focus** — built around categories like sarees, kurtis, and lehengas, and the trust problems unique to platforms like Meesho, Flipkart, and Myntra where review manipulation is common
- **Three-pillar explainability** — every score is broken into three visible components (sentiment 0–40, rating quality 0–30, description match 0–30) so users understand *why* a product scored poorly, not just *that* it did
- **Description-vs-review mismatch detection** — the hardest signal to fake: even when reviewers are paid to write positive text, the AI checks whether their words actually describe the product, catching mismatches that raw sentiment scores miss
- **Hackathon-ready full stack** — end-to-end implementation with graceful Gemini failure handling, loading states, mobile-responsive UI, and a seeded demo database ready for live or recorded demos

---

## 4. Red Flag Demo

> **Requirement**: The demo MUST feature a product with a Trust_Grade of **"D"** or **"F"**.

### Why It Matters

The red flag demo is the most persuasive moment in the video. It shows that SachAI doesn't just reward good products — it actively **exposes untrustworthy ones**, which is the core value proposition for Indian shoppers.

### Setup Instructions

The default seed data uses a balanced review mix (6 positive, 2 neutral, 2 negative), which typically produces B or C grades. To guarantee a D/F grade for the demo, use one of the following approaches:

**Option A — Use the Add Product page (recommended for live demos)**
1. Navigate to `/add-product`
2. Add a product like: `"Luxury Silk Blend Dupatta – Pure Zari Work"`
3. Use a description that makes premium claims: *"100% pure silk with hand-knotted zari. Imported from Varanasi. Certified authentic."*
4. Submit reviews with **1–2 star ratings** and text that contradicts the description (e.g., *"Felt like polyester, nothing like silk"*, *"Zari started peeling after one use"*, *"Description is completely misleading"*)
5. Add at least 6 such negative reviews, then trigger the analysis — the mismatch + negative sentiment will produce a D or F

**Option B — Manually update via MongoDB (for pre-recorded demos)**

If you want a guaranteed result before recording, connect to MongoDB and directly set a product's `trustScore`, `trustGrade`, and `trustBreakdown` fields:

```js
// In MongoDB shell or Compass
db.products.updateOne(
  { title: "Non-stick Kadai with Lid - 3L" },
  {
    $set: {
      trustScore: 28,
      trustGrade: "F",
      lastAnalyzed: new Date(),
      trustBreakdown: {
        sentimentPoints: 8,
        ratingPoints: 10,
        mismatchPoints: 10,
        sentimentSummary: "Reviews are overwhelmingly negative with complaints about coating quality.",
        matchScore: 32,
        matchReasoning: "Reviewers describe peeling coating and poor build quality, contradicting the 'PFOA-free premium' description."
      }
    }
  }
)
```

### Red Flag Talking Point Script

> Use this when the D/F product is on screen:

> *"Look at this product — four stars on average, over ten reviews. Looks fine, right? But SachAI's mismatch detector found that the reviews don't actually describe what's in the product listing. The description claims premium, PFOA-free non-stick coating. The reviews? Peeling, flaking, and cheap build quality. That gap — between what the seller says and what buyers experienced — is exactly what SachAI is designed to catch. No other metric on a typical e-commerce product page tells you this."*

---

## Quick Reference — Timing Summary

| Segment | Time | Content |
|---|---|---|
| Hook & Intro | 0:00 – 0:20 | What is SachAI |
| Search & Browse | 0:20 – 0:45 | HomePage → ProductDetailPage |
| AI Analysis | 0:45 – 1:30 | Trigger analysis, show result |
| Trust Breakdown | 1:30 – 2:00 | Walk through 3 pillars |
| Red Flag Demo | 2:00 – 2:40 | D/F product, mismatch callout |
| Closing | 2:40 – 3:00 | Stack, deployment, wrap-up |
