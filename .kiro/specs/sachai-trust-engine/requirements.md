# Requirements Document

## Introduction

SachAI is an AI-powered product review trust scoring platform for Indian e-commerce, inspired by Meesho. The backend (Node.js + Express + MongoDB + Gemini API) and frontend (React 19 + Vite) are fully built. This spec covers the remaining work to bring the project to hackathon-ready state:

- **Phase 6 – Testing & Polish**: loading states, error handling, Gemini failure recovery, mobile responsiveness
- **Phase 7 – Deployment**: Render (backend), Vercel (frontend), MongoDB Atlas
- **Phase 8 – Demo Prep**: README, screenshots, pitch, demo recording guide

The Trust Score engine computes a 0–100 score (graded A+ through F) from three pillars: sentiment analysis (0–40 pts), rating quality (0–30 pts), and description-vs-review match (0–30 pts), all powered by the Gemini 1.5 Flash API.

---

## Glossary

- **Trust_Engine**: The backend service that orchestrates sentiment analysis, rating scoring, and mismatch detection to produce a Trust Score.
- **Trust_Score**: A numeric value from 0 to 100 representing how trustworthy a product's reviews are.
- **Trust_Grade**: A letter grade (A+, A, B, C, D, F) derived from the Trust_Score.
- **Gemini_Service**: The `callGemini()` wrapper in `server/services/gemini.js` that calls the Google Generative AI API.
- **Frontend**: The React 19 + Vite client application served from the `client/` directory.
- **Backend**: The Node.js + Express server in the `server/` directory.
- **MongoDB_Atlas**: The cloud-hosted MongoDB database used in production.
- **Render**: The cloud platform used to host the Backend in production.
- **Vercel**: The cloud platform used to host the Frontend in production.
- **Skeleton_Loader**: A placeholder UI element that mimics content shape while data is loading.
- **Toast_Notification**: A transient on-screen message shown via `react-hot-toast`.
- **API_Client**: The Axios instance in `client/src/api/index.js`.
- **ProductDetailPage**: The React page at `/products/:id` that displays Trust Score, breakdown, and reviews.
- **HomePage**: The React page at `/` that displays the product grid with search, filter, and sort.

---

## Requirements

### Requirement 1: Graceful Gemini API Failure Handling

**User Story:** As a developer, I want the system to handle Gemini API failures gracefully, so that the application does not crash or return unhelpful errors when the AI service is unavailable or returns malformed responses.

#### Acceptance Criteria

1. WHEN the Gemini_Service throws a network error or returns an HTTP error status, THE Trust_Engine SHALL catch the error and return a structured JSON error response with `success: false` and a human-readable `message` field.
2. WHEN the Gemini_Service returns a response that cannot be parsed as valid JSON, THE Trust_Engine SHALL catch the `JSON.parse` exception and return a `500` status with `success: false` and `message: "AI response could not be parsed"`.
3. WHEN the Gemini_Service request exceeds 30 seconds, THE Gemini_Service SHALL abort the request and throw a timeout error that the calling route handler can catch.
4. IF the Trust Score analysis fails due to a Gemini_Service error, THEN THE Backend SHALL preserve the product's existing `trustScore`, `trustGrade`, and `trustBreakdown` fields unchanged.
5. WHEN a Gemini_Service error occurs during sentiment classification within the trust analysis route, THE Trust_Engine SHALL assign `"neutral"` as the default sentiment for unclassified reviews and continue computing the Trust_Score with available data.

---

### Requirement 2: Frontend Loading States

**User Story:** As a user, I want to see visual feedback while data is loading, so that I understand the application is working and do not experience unexplained blank screens.

#### Acceptance Criteria

1. WHILE the Frontend is fetching the product list, THE HomePage SHALL display a grid of at least 8 Skeleton_Loader cards in place of the product grid.
2. WHILE the Frontend is fetching a product and its reviews, THE ProductDetailPage SHALL display a full-page Skeleton_Loader with `aria-busy="true"` and a visible loading label.
3. WHEN the Trust Score analysis is triggered, THE ProductDetailPage SHALL disable the "Analyze Trust Score" button and display an animated loading indicator within the button for the duration of the request.
4. WHEN a review is being submitted, THE ReviewForm SHALL disable the submit button and display a loading state until the API response is received.
5. IF a product fetch returns a non-200 status, THEN THE Frontend SHALL display a Toast_Notification with a user-readable error message and simultaneously redirect the user to the HomePage; WHEN a product fetch returns a 200 status, THE Frontend SHALL not redirect the user.

---

### Requirement 3: Frontend Error Handling

**User Story:** As a user, I want clear error messages when something goes wrong, so that I can understand what happened and take corrective action.

#### Acceptance Criteria

1. WHEN the API_Client receives a response with a non-2xx HTTP status, THE Frontend SHALL extract the `message` field from the response body and display it in a Toast_Notification.
2. WHEN a network error prevents the API_Client from reaching the Backend, THE Frontend SHALL display a Toast_Notification with the message "Network error — please check your connection".
3. IF the Trust Score analysis API call fails, THEN THE ProductDetailPage SHALL display a Toast_Notification with the error message and SHALL NOT clear or modify the previously displayed Trust Score.
4. WHEN the AddProductPage form is submitted with invalid data that is rejected by the Backend, THE AddProductPage SHALL display the validation error messages inline below each relevant field.
5. THE Frontend SHALL include a global `404` route that renders a styled "Page Not Found" message when an unknown URL is accessed.

---

### Requirement 4: Mobile Responsiveness

**User Story:** As a mobile user browsing on a phone, I want the SachAI interface to be fully usable on small screens, so that I can trust-check products on the go the way Indian shoppers do.

#### Acceptance Criteria

1. THE Frontend SHALL render all pages without horizontal scroll on viewport widths from 320px to 428px.
2. WHEN the viewport width is below 768px, THE HomePage product grid SHALL switch from a multi-column layout to a single-column layout.
3. WHEN the viewport width is below 768px, THE ProductDetailPage detail header (image + info) SHALL stack vertically with the image appearing above the product info.
4. WHEN the viewport width is below 768px, THE Navbar SHALL collapse navigation links into a hamburger menu or a stacked layout that remains fully accessible.
5. THE TrustBadge and TrustBreakdown components SHALL remain fully readable and unclipped on viewport widths as small as 320px.
6. ALL interactive elements (buttons, inputs, selects) SHALL have a minimum touch target size of 44×44px on mobile viewports per WCAG 2.1 SC 2.5.8.

---

### Requirement 5: Backend Production Configuration

**User Story:** As a developer, I want the backend to be configurable for production environments, so that secrets are not hardcoded and the service can be deployed securely to Render.

#### Acceptance Criteria

1. THE Backend SHALL read `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL`, and `PORT` exclusively from environment variables defined in a `.env` file or the hosting platform's environment configuration.
2. THE Backend SHALL include a `.env.example` file at `server/.env.example` that lists all required environment variable keys with placeholder values and no real secrets.
3. WHEN `MONGODB_URI` is not set or is an empty string at startup, THE Backend SHALL log the error `"MONGODB_URI is required"` and exit with a non-zero process code.
4. WHEN `GEMINI_API_KEY` is not set at startup, THE Backend SHALL log a warning `"GEMINI_API_KEY not set — AI analysis will fail"` but SHALL continue starting up to allow health-check endpoints to respond.
5. THE Backend `package.json` SHALL include a `"start": "node index.js"` script that Render can use as the deployment start command.
6. THE Backend SHALL expose a `GET /api/health` endpoint that returns `{ "status": "ok", "time": "<ISO timestamp>" }` with a `200` status, usable as a Render health-check URL.

---

### Requirement 6: Frontend Production Build & Deployment

**User Story:** As a developer, I want the frontend to build successfully and deploy to Vercel, so that judges can access a live demo URL.

#### Acceptance Criteria

1. WHEN `npm run build` is executed in the `client/` directory, THE Frontend SHALL produce a production-optimised bundle in `client/dist/` with no build errors.
2. THE Frontend SHALL read the backend base URL exclusively from the `VITE_API_URL` environment variable; IF the variable is not set, THE API_Client SHALL fall back to `"http://localhost:5000/api"`.
3. THE Frontend `client/.env.example` SHALL contain the key `VITE_API_URL` with a placeholder value.
4. THE Frontend SHALL include a `vercel.json` configuration file at `client/vercel.json` that rewrites all non-asset requests to `index.html` to support client-side routing.
5. WHEN deployed to Vercel, THE Frontend SHALL serve the React application from the root URL and correctly route `/products/:id` and `/add-product` without returning 404 on page refresh.

---

### Requirement 7: MongoDB Atlas Integration

**User Story:** As a developer, I want the backend to connect to MongoDB Atlas in production, so that data persists across server restarts and is accessible from the deployed backend.

#### Acceptance Criteria

1. WHEN `MONGODB_URI` is set to a valid MongoDB Atlas connection string, THE Backend SHALL connect to MongoDB Atlas on startup and log `"✅  MongoDB connected"`.
2. THE Backend Mongoose connection SHALL include retry logic: IF the initial connection fails, THEN THE Backend SHALL log the error and exit with a non-zero code to allow Render's restart policy to retry.
3. WHEN the seed script (`npm run seed`) is executed, THE Backend SHALL first verify a successful database connection; IF the connection is not established, THEN THE seed script SHALL log an error and exit without inserting data; WHEN the connection is verified, THE Backend SHALL insert 5 mock products with varied reviews covering positive, negative, and mixed sentiment scenarios.
4. THE Backend SHALL enable Mongoose's `strictQuery` mode to suppress deprecation warnings in production logs.

---

### Requirement 8: README and Project Documentation

**User Story:** As a hackathon judge, I want comprehensive project documentation, so that I can understand what SachAI does, how to run it, and why it is impactful — all within 5 minutes.

#### Acceptance Criteria

1. THE root `README.md` SHALL include a project title, a one-paragraph description of the problem SachAI solves, and a list of the tech stack components.
2. THE root `README.md` SHALL include a "Live Demo" section with the deployed frontend URL and the deployed backend health-check URL.
3. THE root `README.md` SHALL include a "Local Development" section with step-by-step commands to clone, install dependencies, configure environment variables, seed the database, and start both the backend and frontend.
4. THE root `README.md` SHALL include a "Trust Score Formula" section that explains the three scoring pillars (sentiment 0–40, rating quality 0–30, description match 0–30) and the A+–F grading scale.
5. THE root `README.md` SHALL include at least three screenshots: the HomePage product grid, the ProductDetailPage with a Trust Score breakdown, and the TrustBadge component showing different grades.
6. THE root `README.md` SHALL include a "How It Works" section with a numbered flow: (1) user selects a product, (2) AI analyses reviews, (3) Trust Score is computed, (4) breakdown is displayed.

---

### Requirement 9: Demo Recording Guide

**User Story:** As a hackathon participant, I want a structured demo script, so that I can record a compelling and time-efficient demo video for the judges.

#### Acceptance Criteria

1. THE project SHALL include a `DEMO_GUIDE.md` file at the repository root with a timed script structured in sections of no more than 3 minutes total.
2. THE `DEMO_GUIDE.md` SHALL include a "Setup Checklist" section listing all pre-recording steps: seed data loaded, both servers running, browser at 1080p, demo product selected.
3. THE `DEMO_GUIDE.md` SHALL include a step-by-step "Recording Script" section that covers: opening the HomePage, searching for a product, viewing the ProductDetailPage, triggering AI analysis, and walking through the TrustBreakdown.
4. THE `DEMO_GUIDE.md` SHALL include a "Key Talking Points" section with 3–5 bullet points that highlight SachAI's differentiation: AI-powered trust scoring, India-specific e-commerce focus, Gemini API integration, and description-vs-review mismatch detection.
5. THE `DEMO_GUIDE.md` SHALL specify that the demo MUST include a product with a Trust_Grade of "D" or "F", and SHALL provide a "red flag demo" talking point script that highlights SachAI's ability to surface untrustworthy products.

---

### Requirement 10: Trust Score Correctness and Boundary Enforcement

**User Story:** As a developer, I want the Trust Score to always produce a valid, bounded output, so that the UI never displays broken or out-of-range values.

#### Acceptance Criteria

1. THE Trust_Engine SHALL produce a `trustScore` value that is an integer in the closed range [0, 100] for any valid set of product reviews.
2. THE Trust_Engine SHALL produce a `trustGrade` value that is one of exactly: `"A+"`, `"A"`, `"B"`, `"C"`, `"D"`, `"F"`.
3. WHEN `sentimentPoints` is computed, THE Trust_Engine SHALL clamp the value to the range [0, 40] before adding it to the total.
4. WHEN `ratingPoints` is computed from an average rating, THE Trust_Engine SHALL clamp the value to the range [0, 30].
5. WHEN `mismatchPoints` is computed from the Gemini match score, THE Trust_Engine SHALL clamp the value to the range [0, 30].
6. IF the Gemini mismatch response contains a `matchScore` outside [0, 100], THEN THE Trust_Engine SHALL clamp the raw `matchScore` to [0, 100] before computing `mismatchPoints`.
7. THE Trust_Engine SHALL persist `trustScore`, `trustGrade`, `trustBreakdown`, and `lastAnalyzed` atomically in a single `findByIdAndUpdate` call.
