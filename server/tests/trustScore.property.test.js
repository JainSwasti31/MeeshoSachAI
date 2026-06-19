// Feature: sachai-trust-engine, Property 7: Trust score is always a bounded integer with a valid grade
// Feature: sachai-trust-engine, Property 8: All sub-scores are individually clamped within their maximum bounds

import { describe, it } from 'vitest';
import fc from 'fast-check';
import {
  computeSentimentPoints,
  computeRatingPoints,
  computeMismatchPoints,
  computeTrustGrade,
} from '../services/trustScore.js';

// Shared generators
const reviewArb = fc.record({
  rating: fc.integer({ min: 1, max: 5 }),
  sentiment: fc.constantFrom('positive', 'neutral', 'negative'),
});

const reviewsArb = fc.array(reviewArb, { minLength: 1 });

const matchScoreArb = fc.integer({ min: -50, max: 150 });

const VALID_GRADES = new Set(['A+', 'A', 'B', 'C', 'D', 'F']);

/**
 * **Validates: Requirements 10.1, 10.2**
 *
 * Property 7: Trust score is always a bounded integer with a valid grade.
 * For any non-empty review array (ratings 1–5, sentiment from enum) and any
 * matchScore in [-50, 150], the computed trustScore must be an integer in
 * [0, 100] and trustGrade must be one of the six valid grade strings.
 */
describe('Property 7: Trust score is always a bounded integer with a valid grade', () => {
  it('trustScore ∈ [0, 100] and trustGrade ∈ { A+, A, B, C, D, F }', () => {
    fc.assert(
      fc.property(reviewsArb, matchScoreArb, (reviews, matchScore) => {
        const sentimentPoints = computeSentimentPoints(reviews);
        const ratingPoints = computeRatingPoints(reviews);
        const mismatchPoints = computeMismatchPoints(matchScore);
        const trustScore = sentimentPoints + ratingPoints + mismatchPoints;
        const trustGrade = computeTrustGrade(trustScore);

        // trustScore must be an integer in [0, 100]
        if (trustScore < 0 || trustScore > 100) return false;
        if (!Number.isInteger(trustScore)) return false;

        // trustGrade must be one of the valid grades
        if (!VALID_GRADES.has(trustGrade)) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Validates: Requirements 10.3, 10.4, 10.5, 10.6**
 *
 * Property 8: All sub-scores are individually clamped within their maximum bounds.
 * For any review set and any raw matchScore (including out-of-range values),
 * sentimentPoints ∈ [0, 40], ratingPoints ∈ [0, 30], mismatchPoints ∈ [0, 30].
 */
describe('Property 8: All sub-scores are individually clamped within their maximum bounds', () => {
  it('sentimentPoints ∈ [0, 40], ratingPoints ∈ [0, 30], mismatchPoints ∈ [0, 30]', () => {
    fc.assert(
      fc.property(reviewsArb, matchScoreArb, (reviews, matchScore) => {
        const sentimentPoints = computeSentimentPoints(reviews);
        const ratingPoints = computeRatingPoints(reviews);
        const mismatchPoints = computeMismatchPoints(matchScore);

        // Each sub-score must be a non-negative integer within its cap
        if (sentimentPoints < 0 || sentimentPoints > 40) return false;
        if (!Number.isInteger(sentimentPoints)) return false;

        if (ratingPoints < 0 || ratingPoints > 30) return false;
        if (!Number.isInteger(ratingPoints)) return false;

        if (mismatchPoints < 0 || mismatchPoints > 30) return false;
        if (!Number.isInteger(mismatchPoints)) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
