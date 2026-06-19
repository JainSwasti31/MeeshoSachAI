// Feature: sachai-trust-engine, Property 4: Neutral fallback for unclassified reviews on sentiment error

/**
 * **Validates: Requirements 1.5**
 *
 * Property 4: Neutral fallback for unclassified reviews on sentiment error.
 *
 * For any set of reviews with `sentiment === null`, when the Gemini sentiment
 * classification call fails, all reviews in that set SHALL have their
 * `sentiment` field set to `"neutral"` before the Trust Score is computed,
 * and the overall route SHALL still return HTTP 200 (analysis continues).
 *
 * Test approach:
 *  - Generate an array of reviews (minLength: 1) where every review has
 *    `sentiment === null`.
 *  - Mock `callGemini` so that the FIRST call (sentiment) throws and the
 *    SECOND call (mismatch) returns a valid JSON string — confirming the
 *    route reached and completed the mismatch step.
 *  - Mock `Product.findById` to return a valid stub product.
 *  - Mock `Review.find`:
 *      - First call → generated reviews (null sentiments, so unclassified > 0)
 *      - Second call → same reviews mapped to sentiment="neutral"
 *  - Assert HTTP 200 AND that callGemini was called exactly twice (the second
 *    call being the mismatch prompt, proving execution was not aborted).
 */

import { describe, it, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import express from 'express';
import request from 'supertest';

// ── Mongoose model mocks ─────────────────────────────────────────────────────
vi.mock('../models/Product.js', () => {
  const findById = vi.fn();
  return {
    default: { findById, findByIdAndUpdate: vi.fn() },
  };
});

vi.mock('../models/Review.js', () => {
  const find = vi.fn();
  const findByIdAndUpdate = vi.fn();
  return {
    default: { find, findByIdAndUpdate },
  };
});

// ── Gemini service mock ───────────────────────────────────────────────────────
vi.mock('../services/gemini.js', () => {
  const callGemini = vi.fn();
  return { callGemini };
});

// ── Deferred imports (after mocks are registered) ────────────────────────────
import { callGemini } from '../services/gemini.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import analyzeRouter from '../routes/analyze.js';

// ── Minimal test Express app ──────────────────────────────────────────────────
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/analyze', analyzeRouter);
  return app;
}

// ── Stub data helpers ─────────────────────────────────────────────────────────
const FAKE_PRODUCT_ID = '507f1f77bcf86cd799439011';

const stubProduct = {
  _id: FAKE_PRODUCT_ID,
  title: 'Test Product',
  description: 'A product description used for mismatch testing.',
};

// ── Property 4 ────────────────────────────────────────────────────────────────
describe('Property 4: Neutral fallback for unclassified reviews on sentiment error', () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    Product.findById.mockResolvedValue(stubProduct);
    Product.findByIdAndUpdate = vi.fn().mockResolvedValue({});
    Review.findByIdAndUpdate = vi.fn().mockResolvedValue({});
  });

  it(
    'route returns HTTP 200 and reaches the mismatch Gemini call when sentiment throws',
    async () => {
      // Generator: arrays of reviews with null sentiments (minLength: 1 ensures
      // the unclassified branch is always entered inside the route handler).
      const nullSentimentReviewsArb = fc.array(
        fc.record({
          _id: fc.string({ minLength: 1 }),
          sentiment: fc.constant(null),
          text: fc.string(),
          rating: fc.integer({ min: 1, max: 5 }),
        }),
        { minLength: 1 }
      );

      await fc.assert(
        fc.asyncProperty(nullSentimentReviewsArb, async (reviews) => {
          // Reset call counters for each generated case
          let callCount = 0;
          callGemini.mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // First call is the sentiment classification — simulate failure
              return Promise.reject(new Error('Sentiment service error'));
            }
            // Second call is the mismatch analysis — succeed with valid JSON
            return Promise.resolve(
              JSON.stringify({ mismatches: [], matchScore: 70, verdict: 'ok' })
            );
          });

          // Review.find mock:
          //  - 1st call (initial fetch): null-sentiment reviews
          //  - 2nd call (allReviews fetch after fallback): reviews with neutral
          let findCount = 0;
          Review.find.mockImplementation(() => {
            findCount++;
            if (findCount === 1) {
              return Promise.resolve(reviews);
            }
            return Promise.resolve(
              reviews.map((r) => ({ ...r, sentiment: 'neutral' }))
            );
          });

          const response = await request(app)
            .post(`/api/analyze/trust/${FAKE_PRODUCT_ID}`)
            .send();

          // The route must NOT abort after the sentiment error; it should
          // continue to the mismatch step and return success.
          if (response.status !== 200) return false;
          if (response.body.success !== true) return false;

          // The mismatch callGemini must have been reached, meaning callCount
          // advanced to 2 (sentiment threw on 1, mismatch succeeded on 2).
          if (callCount !== 2) return false;

          return true;
        }),
        { numRuns: 100 }
      );
    }
  );
});
