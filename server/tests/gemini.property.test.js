// Feature: sachai-trust-engine, Property 1: Gemini error always produces a structured failure response

/**
 * **Validates: Requirements 1.1**
 *
 * Property 1: Gemini error always produces a structured failure response.
 *
 * For any error thrown by the Gemini service (network error, HTTP error,
 * timeout), the trust analysis route SHALL return a response with
 * `success === false` and a non-empty `message` string.
 *
 * Test approach:
 *  - Mount only the trust route in a minimal Express app (no real DB).
 *  - Mock `callGemini` to throw a GeminiError with a generated message/type.
 *  - Mock Product.findById and Review.find to return valid stub data so the
 *    handler reaches the Gemini call rather than returning early (404/400).
 *  - Use supertest to fire POST /trust/:productId and assert the response shape.
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
  class GeminiError extends Error {
    constructor(type, message, cause) {
      super(message);
      this.name = 'GeminiError';
      this.type = type;
      this.cause = cause ?? null;
    }
  }
  return { callGemini, GeminiError };
});

// ── Deferred imports (after mocks are registered) ────────────────────────────
import { callGemini, GeminiError } from '../services/gemini.js';
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

/** A product stub that satisfies the handler's null-check. */
const stubProduct = {
  _id: FAKE_PRODUCT_ID,
  title: 'Test Product',
  description: 'A product description for testing.',
};

/** A set of reviews that all have sentiments already set (so the handler skips
 *  the first Gemini call and goes straight to the mismatch Gemini call). */
function stubReviews() {
  return [
    { _id: 'r1', productId: FAKE_PRODUCT_ID, rating: 4, text: 'Good.', sentiment: 'positive', _id: { equals: () => false } },
    { _id: 'r2', productId: FAKE_PRODUCT_ID, rating: 3, text: 'OK.', sentiment: 'neutral', _id: { equals: () => false } },
  ];
}

// ── Property 1 ────────────────────────────────────────────────────────────────
describe('Property 1: Gemini error always produces a structured failure response', () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();

    // Return a valid product so the handler does not short-circuit with 404.
    Product.findById.mockResolvedValue(stubProduct);

    // Return reviews that already have sentiment so the handler skips the
    // sentiment Gemini call and goes directly to the mismatch Gemini call.
    Review.find.mockResolvedValue(stubReviews());

    // findByIdAndUpdate should never be called when Gemini throws, but stub
    // it anyway to prevent accidental side-effects.
    Product.findByIdAndUpdate = vi.fn().mockResolvedValue({});
    Review.findByIdAndUpdate = vi.fn().mockResolvedValue({});
  });

  it(
    'any GeminiError thrown by callGemini produces { success: false, message: <non-empty> }',
    async () => {
      const errorArb = fc.record({
        message: fc.string({ minLength: 1 }),
        type: fc.constantFrom('network', 'parse', 'timeout'),
      });

      await fc.assert(
        fc.asyncProperty(errorArb, async ({ message, type }) => {
          // Make callGemini throw a GeminiError with the generated values.
          callGemini.mockRejectedValue(new GeminiError(type, message, null));

          const response = await request(app)
            .post(`/api/analyze/trust/${FAKE_PRODUCT_ID}`)
            .send();

          // The outer try/catch in the trust handler must catch the error and
          // return { success: false, message: err.message }.
          if (response.status !== 500) return false;
          if (response.body.success !== false) return false;
          if (typeof response.body.message !== 'string') return false;
          if (response.body.message.length === 0) return false;

          return true;
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ── Property 2 ────────────────────────────────────────────────────────────────
// Feature: sachai-trust-engine, Property 2: Non-JSON Gemini response produces exact error message

/**
 * **Validates: Requirements 1.2**
 *
 * Property 2: Non-JSON Gemini response produces exact error message.
 *
 * For any string that is not valid JSON returned by the Gemini service, the
 * trust analysis route SHALL return HTTP 500 with `success === false` and
 * `message === "AI response could not be parsed"`.
 *
 * Test approach:
 *  - Mock `callGemini` to resolve (not throw) with a non-JSON string.
 *    Every generated string is prefixed with '!' which guarantees it cannot
 *    be parsed as valid JSON (fc.string().map(s => '!' + s)).
 *  - Assert the response is 500, success === false, and the message is the
 *    exact sentinel "AI response could not be parsed".
 */
describe('Property 2: Non-JSON Gemini response produces exact error message', () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();

    Product.findById.mockResolvedValue(stubProduct);
    Review.find.mockResolvedValue(stubReviews());
    Product.findByIdAndUpdate = vi.fn().mockResolvedValue({});
    Review.findByIdAndUpdate = vi.fn().mockResolvedValue({});
  });

  it(
    'returns HTTP 500 with success === false and message === "AI response could not be parsed"',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Prefix every generated string with '!' — this guarantees it is
          // never valid JSON (JSON must start with {, [, ", digit, t, f, or n).
          fc.string().map((s) => '!' + s),
          async (nonJsonString) => {
            // callGemini resolves successfully but with a non-JSON payload.
            callGemini.mockResolvedValue(nonJsonString);

            const response = await request(app)
              .post(`/api/analyze/trust/${FAKE_PRODUCT_ID}`)
              .send();

            if (response.status !== 500) return false;
            if (response.body.success !== false) return false;
            if (response.body.message !== 'AI response could not be parsed') return false;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
