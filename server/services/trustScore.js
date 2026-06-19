/**
 * Trust Score pure computation helpers.
 *
 * All four functions are stateless and side-effect free so they can be
 * unit/property-tested without Express or MongoDB.
 *
 * Formulas (from design.md):
 *
 *   sentimentScore_raw = ((positiveCount - negativeCount × 0.5) / totalCount) × 40
 *   sentimentPoints    = clamp(round(sentimentScore_raw), 0, 40)
 *
 *   ratingPoints       = clamp(round((avgRating / 5) × 30), 0, 30)
 *
 *   matchScoreClamped  = clamp(matchScore, 0, 100)
 *   mismatchPoints     = clamp(round((matchScoreClamped / 100) × 30), 0, 30)
 *
 *   trustScore         = sentimentPoints + ratingPoints + mismatchPoints
 *
 * Grade thresholds: A+ (≥85), A (≥75), B (≥65), C (≥50), D (≥35), F (<35)
 */

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute the sentiment pillar score (0–40).
 *
 * @param {Array<{ sentiment: string }>} reviews  Array of review objects.
 *   Each review's `sentiment` field is expected to be "positive", "neutral",
 *   or "negative". Reviews with any other value are counted as neutral (i.e.
 *   they contribute neither to positiveCount nor negativeCount).
 * @returns {number} Integer in [0, 40].
 */
export function computeSentimentPoints(reviews) {
  const total = reviews.length;
  if (total === 0) return 0;

  const positiveCount = reviews.filter((r) => r.sentiment === "positive").length;
  const negativeCount = reviews.filter((r) => r.sentiment === "negative").length;

  const raw = ((positiveCount - negativeCount * 0.5) / total) * 40;
  return clamp(Math.round(raw), 0, 40);
}

/**
 * Compute the rating quality pillar score (0–30).
 *
 * @param {Array<{ rating: number }>} reviews  Array of review objects.
 *   Each review's `rating` field is expected to be a number in [1, 5].
 * @returns {number} Integer in [0, 30].
 */
export function computeRatingPoints(reviews) {
  const total = reviews.length;
  if (total === 0) return 0;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  return clamp(Math.round((avgRating / 5) * 30), 0, 30);
}

/**
 * Compute the description-match pillar score (0–30).
 *
 * The raw `matchScore` (from Gemini) is first clamped to [0, 100] to guard
 * against out-of-range AI responses before the points conversion is applied.
 *
 * @param {number} matchScore  Raw Gemini match score, nominally in [0, 100].
 * @returns {number} Integer in [0, 30].
 */
export function computeMismatchPoints(matchScore) {
  const clamped = clamp(matchScore, 0, 100);
  return clamp(Math.round((clamped / 100) * 30), 0, 30);
}

/**
 * Derive a letter grade from a numeric trust score.
 *
 * @param {number} trustScore  Numeric trust score in [0, 100].
 * @returns {"A+" | "A" | "B" | "C" | "D" | "F"}
 */
export function computeTrustGrade(trustScore) {
  if (trustScore >= 85) return "A+";
  if (trustScore >= 75) return "A";
  if (trustScore >= 65) return "B";
  if (trustScore >= 50) return "C";
  if (trustScore >= 35) return "D";
  return "F";
}
