// Feature: sachai-trust-engine, Property 6: Trust score display is preserved after failed analysis
// Validates: Requirements 3.3

import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import fc from 'fast-check';
import ProductDetailPage from '../pages/ProductDetailPage';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    loading: vi.fn().mockReturnValue('toast-id'),
    success: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('../api/index.js', () => ({
  getProduct: vi.fn(),
  getReviews: vi.fn(),
  analyzeTrust: vi.fn(),
  deleteProduct: vi.fn(),
  createReview: vi.fn(),
}));

import { getProduct, getReviews, analyzeTrust } from '../api/index.js';

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Build a minimal product object with the given trustScore and trustGrade,
 * plus all other fields that ProductDetailPage accesses to avoid crashes.
 */
function makeProduct(trustScore, trustGrade) {
  return {
    _id: 'test-product-id',
    title: 'Test Product',
    description: 'A test product description',
    category: 'Electronics',
    price: 999,
    images: [],
    averageRating: 4.0,
    totalReviews: 1,
    trustScore,
    trustGrade,
    trustBreakdown: null,
    lastAnalyzed: null,
  };
}

const SAMPLE_REVIEW = {
  _id: 'review-1',
  reviewerName: 'Alice',
  rating: 4,
  text: 'Great product!',
  sentiment: 'positive',
  createdAt: new Date().toISOString(),
};

// ── Property 6 ────────────────────────────────────────────────────────────────

describe('Property 6: Trust score display is preserved after failed analysis', () => {
  afterEach(() => {
    cleanup();
  });

  // Third argument is the Vitest test timeout (ms) — 100 async render cycles need extra time
  it('holds across arbitrary trustScore and trustGrade values', async () => {
    await fc.assert(
      fc.asyncProperty(
        // min:1 keeps trustScore truthy so the button reads "Re-analyze Trust" (not "Analyze Trust Score")
        fc.integer({ min: 1, max: 100 }),
        fc.constantFrom('A+', 'A', 'B', 'C', 'D', 'F'),
        async (trustScore, trustGrade) => {
          // Clean DOM and reset mocks between fast-check iterations
          cleanup();
          vi.clearAllMocks();

          const product = makeProduct(trustScore, trustGrade);

          // getProduct resolves with the product on initial load
          getProduct.mockResolvedValue({ data: { data: product } });

          // getReviews resolves with one review so the Analyze button is enabled
          getReviews.mockResolvedValue({ data: { data: [SAMPLE_REVIEW] } });

          // analyzeTrust rejects — simulating a failed API call
          analyzeTrust.mockRejectedValue(
            Object.assign(new Error('Gemini error'), {
              response: { data: { message: 'Analysis failed' } },
            })
          );

          const { container } = render(
            <MemoryRouter initialEntries={['/products/test-product-id']}>
              <Routes>
                <Route path="/products/:id" element={<ProductDetailPage />} />
              </Routes>
            </MemoryRouter>
          );

          // Scope all queries to this render's container to avoid cross-iteration conflicts
          const view = within(container);

          // Wait for the initial product load to complete (skeleton disappears)
          await waitFor(() => {
            expect(view.getByText(product.title)).toBeInTheDocument();
          });

          // Verify the trust badge is rendered with the expected values.
          // TrustBadge renders: <span title="Trust Score: {score}/100">{grade} <small>({score})</small></span>
          const badgeBefore = view.getByTitle(`Trust Score: ${trustScore}/100`);
          expect(badgeBefore).toBeInTheDocument();
          expect(badgeBefore.textContent).toContain(trustGrade);
          expect(badgeBefore.textContent).toContain(String(trustScore));

          // Click Re-analyze Trust button (enabled because reviews.length > 0)
          const analyzeButton = view.getByRole('button', { name: /analyze trust/i });
          expect(analyzeButton).not.toBeDisabled();
          fireEvent.click(analyzeButton);

          // Wait for the analysis to settle (button re-enables after the catch block runs)
          await waitFor(() => {
            expect(view.getByRole('button', { name: /analyze trust/i })).not.toBeDisabled();
          });

          // The trust badge MUST still show the SAME values — catch block does NOT call setProduct
          const badgeAfter = view.getByTitle(`Trust Score: ${trustScore}/100`);
          expect(badgeAfter).toBeInTheDocument();
          expect(badgeAfter.textContent).toContain(trustGrade);
          expect(badgeAfter.textContent).toContain(String(trustScore));
        }
      ),
      { numRuns: 100 }
    );
  }, 60_000); // 60-second timeout for 100 async render iterations
});
