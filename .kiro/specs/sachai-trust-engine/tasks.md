# Implementation Plan: SachAI Trust Engine — Hackathon Hardening

## Overview

This plan converts the design's three phases (Testing & Polish, Deployment, Demo Prep) into incremental coding tasks. Each task builds on the previous, starting with the backend scoring core (which unlocks all property tests), then error-hardening, then frontend polish, then deployment config, and finally documentation. All code is JavaScript/Node.js (backend) and React/JSX (frontend) with Vitest + fast-check for testing.

---

## Tasks

- [x] 1. Extract pure scoring helpers from the trust analysis route

  - Create `server/services/trustScore.js` exporting four pure functions: `computeSentimentPoints(reviews)`, `computeRatingPoints(reviews)`, `computeMismatchPoints(matchScore)`, `computeTrustGrade(trustScore)`
  - Each function must clamp its output to its respective valid range as specified in the design (sentimentPoints ∈ [0,40], ratingPoints ∈ [0,30], mismatchPoints ∈ [0,30]) and clamp the raw matchScore to [0,100] before computing mismatchPoints
  - Replace the inline scoring logic in `server/routes/analyze.js` (the `/trust/:productId` handler) with calls to the imported helpers
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 1.1 Implement `server/services/trustScore.js` with all four helpers
    - Write the module with the four exported pure functions matching the formulas in the design
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 1.2 Write property tests for trust score helpers
    - Set up `server/tests/trustScore.property.test.js` using Vitest + fast-check
    - **Property 7: Trust score is always a bounded integer with a valid grade** — generate arbitrary review arrays (ratings 1–5, sentiment from enum) and arbitrary matchScore ∈ [-50, 150]; assert trustScore ∈ [0,100] and trustGrade ∈ {"A+","A","B","C","D","F"}
    - **Validates: Requirements 10.1, 10.2**
    - **Property 8: All sub-scores are individually clamped within their maximum bounds** — same generators; assert sentimentPoints ∈ [0,40], ratingPoints ∈ [0,30], mismatchPoints ∈ [0,30]
    - **Validates: Requirements 10.3, 10.4, 10.5, 10.6**

  - [x] 1.3 Wire helpers into `server/routes/analyze.js`
    - Import helpers from `server/services/trustScore.js` and replace the inlined scoring block in the `/trust/:productId` handler
    - _Requirements: 10.1, 10.3, 10.4, 10.5, 10.6_

- [x] 2. Harden the Gemini service with timeout and typed errors

  - Modify `server/services/gemini.js` to implement a 30-second `Promise.race` timeout and wrap all failures as a typed `GeminiError` class carrying `{ type: 'network' | 'parse' | 'timeout', message, cause }`
  - Export the `GeminiError` class so route handlers can import and `instanceof`-check it
  - _Requirements: 1.1, 1.3_

  - [x] 2.1 Add `GeminiError` class and timeout to `server/services/gemini.js`
    - Implement `GeminiError extends Error` with a `type` field
    - Wrap the SDK call in `Promise.race([sdkCall, timeoutReject(30000)])`
    - Re-throw as `new GeminiError('timeout', ...)` on timeout and `new GeminiError('network', ...)` on SDK errors
    - _Requirements: 1.1, 1.3_

  - [x] 2.2 Write property test for Gemini error structured failure response
    - Create `server/tests/gemini.property.test.js`
    - Mock `callGemini` to throw arbitrary errors (using `fc.string()` for the message and `fc.constantFrom('network','parse','timeout')` for the type)
    - Call the trust route handler directly via a test Express app; assert response has `success === false` and a non-empty `message` string for every generated error
    - **Property 1: Gemini error always produces a structured failure response**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Write property test for non-JSON Gemini response exact error message
    - In `server/tests/gemini.property.test.js`, mock `callGemini` to return strings that are not valid JSON (e.g., prefix with `!` or use `fc.string()` filtered to exclude JSON-parseable values)
    - Assert response is HTTP 500 with `success === false` and `message === "AI response could not be parsed"`
    - **Property 2: Non-JSON Gemini response produces exact error message**
    - **Validates: Requirements 1.2**

- [x] 3. Harden the trust analysis route error branches

  - Update `server/routes/analyze.js` `/trust/:productId` handler to implement all error branches from the design's Error Matrix
  - Sentiment sub-step must be wrapped in its own try/catch; on failure, assign `"neutral"` to all unclassified reviews and continue (do NOT abort the full request)
  - On any fatal error (mismatch call failure, etc.), do NOT call `findByIdAndUpdate` — existing trust fields are preserved
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 3.1 Wrap sentiment classification in an isolated try/catch with neutral fallback
    - On sentiment Gemini call failure, log the error and set `sentiment = "neutral"` for all unclassified reviews before continuing to compute the score
    - _Requirements: 1.5_

  - [x] 3.2 Write property test for neutral fallback on sentiment error
    - Mock the sentiment `callGemini` call to throw; generate arrays of reviews with `sentiment === null` using `fc.array(fc.record({ _id: fc.string(), sentiment: fc.constant(null), text: fc.string() }))`
    - Assert that all reviews in the set have sentiment set to `"neutral"` before score computation
    - **Property 4: Neutral fallback for unclassified reviews on sentiment error**
    - **Validates: Requirements 1.5**

  - [x] 3.3 Guard `findByIdAndUpdate` — only call on success path
    - Move the `findByIdAndUpdate` call so it only executes after all scoring succeeds; any throw before it must not trigger the DB write
    - _Requirements: 1.4_

  - [x] 3.4 Write property test for trust data preservation after failed analysis
    - Generate a product record with arbitrary pre-existing `fc.record({ trustScore: fc.integer(0,100), trustGrade: fc.constantFrom("A+","A","B","C","D","F"), trustBreakdown: fc.object() })`
    - Mock `callGemini` (mismatch step) to throw; assert those three fields on the product are byte-for-byte identical after the failed request
    - **Property 3: Trust data is preserved after failed analysis**
    - **Validates: Requirements 1.4**

- [x] 4. Checkpoint — backend core is complete

  - Ensure all server-side tests pass: `cd server && npx vitest --run`
  - Verify the trust route returns the correct error shapes for the key error cases
  - Ask the user if questions arise.

- [x] 5. Add startup env-var validation to `server/index.js`

  - Before the `mongoose.connect()` call, check for `MONGODB_URI`; if missing or empty, `console.error("MONGODB_URI is required")` and `process.exit(1)`
  - Check for `GEMINI_API_KEY`; if missing, `console.warn("GEMINI_API_KEY not set — AI analysis will fail")` but do NOT exit
  - _Requirements: 5.1, 5.3, 5.4_

  - [x] 5.1 Add env-var guards to `server/index.js`
    - Insert the two guard blocks at the top of the startup sequence, before `mongoose.connect()`
    - _Requirements: 5.3, 5.4_

- [x] 6. Add Axios response interceptor for global error toasts

  - Modify `client/src/api/index.js` to add a response interceptor
  - On non-2xx response: extract `error.response.data.message` and call `toast.error(message)`
  - On network error (no `error.response`): call `toast.error("Network error — please check your connection")`
  - Re-throw the error after toasting so per-call catch blocks still fire
  - _Requirements: 3.1, 3.2_

  - [x] 6.1 Implement the Axios interceptor in `client/src/api/index.js`
    - Add the response interceptor; import `toast` from `react-hot-toast`
    - _Requirements: 3.1, 3.2_

  - [x] 6.2 Write property test for API error toast message
    - Create `client/src/tests/api.property.test.js` using Vitest + fast-check
    - Generate arbitrary non-empty message strings with `fc.string({ minLength: 1 })` as the `data.message` in a mocked Axios error
    - Assert that `toast.error` is called with that exact string
    - **Property 5: API error toast displays the server's message**
    - **Validates: Requirements 3.1**

- [x] 7. Polish `ProductDetailPage` loading and error states

  - Add a visible text node inside the skeleton loading div so screen readers announce "Loading product" (the `aria-label` already exists on the div per the design; add a `<span className="sr-only">Loading product</span>` child inside the `.skeleton-detail` div)
  - Ensure the analysis failure path in `handleAnalyzeTrust` does NOT call `setProduct` — verify the existing code and add a comment confirming the invariant
  - _Requirements: 2.2, 2.3, 3.3_

  - [x] 7.1 Add sr-only loading text to skeleton in `ProductDetailPage`
    - Insert `<span className="sr-only">Loading product</span>` inside the `.skeleton-detail` div
    - _Requirements: 2.2_

  - [x] 7.2 Write property test for trust score display preservation after failed analysis
    - Create `client/src/tests/productDetail.property.test.js` using Vitest + @testing-library/react + fast-check
    - Generate arbitrary `fc.integer(0,100)` for trustScore and `fc.constantFrom("A+","A","B","C","D","F")` for trustGrade; render ProductDetailPage with a mocked product; mock `analyzeTrust` to reject; assert displayed trustScore and trustGrade are unchanged
    - **Property 6: Trust score display is preserved after failed analysis**
    - **Validates: Requirements 3.3**

- [x] 8. Replace the bare 404 handler in `App.jsx` with a `NotFoundPage` component

  - Create `client/src/pages/NotFoundPage.jsx` with a styled "Page Not Found" message consistent with the existing design system (use `.btn.btn--primary` to link back to `/`)
  - Replace the inline `<h1>` in the `Route path="*"` in `App.jsx` with `<NotFoundPage />`
  - _Requirements: 3.5_

  - [x] 8.1 Create `client/src/pages/NotFoundPage.jsx`
    - Render a centred "404 — Page Not Found" heading and a "Go Home" button that navigates to `/`
    - _Requirements: 3.5_

  - [x] 8.2 Update `App.jsx` to use `NotFoundPage`
    - Import `NotFoundPage` and replace the inline `<h1>` in the wildcard route
    - _Requirements: 3.5_

- [x] 9. Mobile responsiveness — CSS and Navbar hamburger menu

  - Add or update CSS in `client/src/index.css` for:
    - Responsive product grid: multi-column above 768px, single-column at or below 768px (_Requirements: 4.2_)
    - `ProductDetailPage` detail-header stacks vertically below 768px with image above info (_Requirements: 4.3_)
    - Navbar collapses links into a stacked/hamburger layout below 768px (_Requirements: 4.4_)
    - No horizontal scroll from 320px to 428px (_Requirements: 4.1_)
    - TrustBadge and TrustBreakdown unclipped at 320px (_Requirements: 4.5_)
    - All interactive elements meet 44×44px touch target minimum (_Requirements: 4.6_)
  - Update `client/src/components/Navbar.jsx` to include a hamburger toggle button for mobile (controlled by local `useState`) that shows/hides the nav links
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 9.1 Add mobile-responsive CSS media queries to `client/src/index.css`
    - Add `@media (max-width: 768px)` rules for grid, detail-header, navbar, trust components, and touch targets
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [x] 9.2 Add hamburger toggle to `client/src/components/Navbar.jsx`
    - Add a `<button aria-label="Toggle menu">` hamburger button visible only on mobile; toggle a CSS class on the nav links container to show/hide; ensure the toggle itself is ≥44×44px
    - _Requirements: 4.4, 4.6_

- [x] 10. Checkpoint — frontend polish is complete

  - Run `cd client && npm run build` and confirm no build errors
  - Verify the Vitest frontend test suite passes: `cd client && npx vitest --run`
  - Ask the user if questions arise.

- [x] 11. Create `client/vercel.json` for SPA routing support

  - Create `client/vercel.json` with the rewrite rule `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
  - _Requirements: 6.4, 6.5_

  - [x] 11.1 Create `client/vercel.json`
    - Write the JSON file with the single rewrites array as specified in the design
    - _Requirements: 6.4, 6.5_

- [x] 12. Add/update environment example files

  - Verify `server/.env.example` lists `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL`, and `PORT` with placeholder values and no real secrets; create or update as needed
  - Verify `client/.env.example` contains `VITE_API_URL=https://your-backend.onrender.com/api`; create or update as needed
  - _Requirements: 5.1, 5.2, 6.2, 6.3_

  - [x] 12.1 Update `server/.env.example`
    - Ensure all four keys are present with safe placeholder values
    - _Requirements: 5.1, 5.2_

  - [x] 12.2 Update `client/.env.example`
    - Ensure `VITE_API_URL` is present with a placeholder
    - _Requirements: 6.2, 6.3_

- [x] 13. Set up Vitest in both `server/` and `client/` for running tests

  - Install `vitest` and `fast-check` in `server/` (`npm install --save-dev vitest fast-check`)
  - Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `fast-check` in `client/` if not already present
  - Add `"test": "vitest --run"` script to `server/package.json`
  - Add `"test": "vitest --run"` script to `client/package.json`; update `vite.config.js` to include the Vitest `test` config block with `environment: 'jsdom'`
  - _Requirements: (testing infrastructure for all test tasks)_

  - [x] 13.1 Install and configure Vitest in `server/`
    - Add `vitest` + `fast-check` to devDependencies; add `"test"` script; create a minimal `vitest.config.js` in `server/`
    - _Requirements: (testing infra)_

  - [x] 13.2 Install and configure Vitest in `client/`
    - Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, and `jsdom` to devDependencies; add `"test"` script; add `test: { environment: 'jsdom', globals: true }` to `vite.config.js`
    - _Requirements: (testing infra)_

- [x] 14. Write the root `README.md`

  - Replace or substantially update the root `README.md` to include all sections required by Requirements 8.1–8.6
  - Sections: project title + one-paragraph problem description + tech stack list; Live Demo (deployed URLs); Local Development (step-by-step commands); Trust Score Formula (three pillars + grading scale); Screenshots (at least three); How It Works (four-step numbered flow)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 14.1 Write root `README.md` with all required sections
    - Include placeholder screenshot paths in the screenshots section (e.g., `docs/screenshots/homepage.png`) so the file is complete and screenshots can be dropped in later
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 15. Write `DEMO_GUIDE.md` at the repository root

  - Create `DEMO_GUIDE.md` with: Setup Checklist, timed Recording Script (≤3 min total), Key Talking Points (3–5 bullets), and the "red flag demo" section featuring a D/F-grade product
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 15.1 Create `DEMO_GUIDE.md`
    - Include all five required sections from Requirements 9.1–9.5; keep the recording script to ≤3 minutes; call out the D/F grade red-flag product talking point explicitly
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 16. Final checkpoint — all tests pass and build is clean

  - Run `cd server && npm test` and `cd client && npm test`; fix any failures
  - Run `cd client && npm run build`; confirm no errors
  - Ensure all property tests complete at ≥100 iterations (fast-check default)
  - Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP path
- Task 13 (test infrastructure setup) should be completed before executing any `*` test tasks — it can be done in the same wave as tasks 1.1 and 2.1
- All property tests use `vi.mock` to stub `callGemini` — never make real Gemini API calls in tests
- The `vercel.json` (Task 11) and `.env.example` files (Task 12) have no code dependencies and can be created at any time
- Screenshots referenced in README.md (Task 14) should be taken from the live or locally-running app and placed in `docs/screenshots/`
- The `CORS` origin in `server/index.js` will need `CLIENT_URL` set to the Vercel deployment URL in Render's environment variables at deploy time

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "13.1", "13.2", "11.1", "12.1", "12.2"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["3.4", "5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "7.1"] },
    { "id": 7, "tasks": ["7.2", "8.1"] },
    { "id": 8, "tasks": ["8.2", "9.1"] },
    { "id": 9, "tasks": ["9.2"] },
    { "id": 10, "tasks": ["14.1", "15.1"] }
  ]
}
```
