// Feature: sachai-trust-engine, Property 3: Trust data is preserved after failed analysis

/**
 * **Validates: Requirements 1.4**
 *
 * Property 3: Trust data is preserved after failed analysis.
 *
 * IF the Trust Score analysis fails due to a Gemini_Service error (specifically
 * the mismatch step), THEN the Backend SHALL preserve the product's existing
 * `trustScore`, `trustGrade`, and `trustBreakdown` fields unchanged — i.e.,
 * `Product.findByIdAndUpdate` MUST NOT be called with those fields.
 *
 * Test approach:
 *  - Generate arbitrary pre-existing trust fields: trustScore ∈ [0,100],
 *    trustGrade from the valid grade enum, trustBreakdown as an arbitrary object.
 *  - Mock `Product.findById` to return a product carrying those generated values.
 *  - Mock `Review.find` to return reviews that already have sentiments set, so
 *    `callGemini` is only called ONCE (for the mismatch step) and throws.
 *  - After receiving the HTTP 500 response, assert that
 *    `Product.findByIdAndUpdate` was NEVER called — meaning the existing
 *    trustScore, trustGrade, and trustBreakdown were not overwritten.
 */

import { describe, it, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import express from 'express';
import request from 'supertest';

// ── Mongoose model mocks ─────────────────────────────────────────────────────
// Must be declared before the route import so vi.mock hoisting works correctly.
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

// ── Constants ─────────────────────────────────────────────────────────────────
const FAKE_PRODUCT_ID = '507f1f77bcf86cd799439011';

// ── Property 3 ────────────────────────────────────────────────────────────────
describe('Property 3: Trust data is preserved after failed analysis', () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
    Review.findByIdAndUpdate = vi.fn().mockResolvedValue({});
  });

  it(
    'Product.findByIdAndUpdate is never called when callGemini (mismatch) throws',
    async () => {
      // Generator: arbitrary pre-existing trust fields on the product.
      const trustFieldsArb = fc.record({
        trustScore: fc.integer({ min: 0, max: 100 }),
        trustGrade: fc.constantFrom('A+', 'A', 'B', 'C', 'D', 'F'),
        trustBreakdown: fc.object(),
      });

      await fc.assert(
        fc.asyncProperty(trustFieldsArb, async (generated) => {
          // Reset mocks for each generated case.
          vi.clearAllMocks();
          Review.findByIdAndUpdate = vi.fn().mockResolvedValue({});

          // callGemini throws on every call — simulating mismatch step failure.
          // All reviews already have sentiments so callGemini is only reached
          // for the mismatch prompt (never for sentiment classification).
          callGemini.mockRejectedValue(new Error('Mismatch analysis failed'));

          // Product.findById returns a product with the generated trust fields.
          Product.findById.mockResolvedValue({
            _id: FAKE_PRODUCT_ID,
            description: 'Test product',
            trustScore: generated.trustScore,
            trustGrade: generated.trustGrade,
            trustBreakdown: generated.trustBreakdown,
          });

          // Product.findByIdAndUpdate starts as a fresh spy so we can assert
          // it was never called.
          Product.findByIdAndUpdate = vi.fn().mockResolvedValue({});

          // Review.find returns reviews with existing sentiments — this ensures
          // the handler skips the sentiment Gemini call and goes straight to
          // the mismatch Gemini call, which throws.
          Review.find.mockResolvedValue([
            {
              _id: 'r1',
              rating: 4,
              text: 'Great product',
              sentiment: 'positive',
              _id: { equals: () => false },
            },
          ]);

          const response = await request(app)
            .post(`/api/analyze/trust/${FAKE_PRODUCT_ID}`)
            .send();

          // The route must return HTTP 500 because callGemini threw.
          if (response.status !== 500) return false;
          if (response.body.success !== false) return false;

          // KEY ASSERTION: findByIdAndUpdate must NEVER have been called.
          // If it had been called, the existing trust fields would have been
          // overwritten — violating Requirement 1.4.
          if (Product.findByIdAndUpdate.mock.calls.length !== 0) return false;

          return true;
        }),
        { numRuns: 100 }
      );
    }
  );
});
