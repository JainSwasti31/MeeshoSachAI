import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a non-2xx status
      const message = error.response.data?.message || "Something went wrong";
      toast.error(message);
    } else {
      // Network error — no response received
      toast.error("Network error — please check your connection");
    }
    return Promise.reject(error); // re-throw so per-call catch blocks still fire
  }
);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = (params) => api.get("/products", { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ── Reviews ───────────────────────────────────────────────────────────────────
export const getReviews = (productId) => api.get(`/products/${productId}/reviews`);
export const createReview = (productId, data) => api.post(`/products/${productId}/reviews`, data);
export const deleteReview = (productId, reviewId) =>
  api.delete(`/products/${productId}/reviews/${reviewId}`);

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analyzeSentiment = (productId) => api.post(`/analyze/sentiment/${productId}`);
export const analyzeThemes = (productId) => api.post(`/analyze/themes/${productId}`);
export const analyzeMismatch = (productId) => api.post(`/analyze/mismatch/${productId}`);
export const analyzeTrust = (productId) => api.post(`/analyze/trust/${productId}`);

export default api;
