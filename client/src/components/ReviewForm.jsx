import { useState } from "react";
import { createReview } from "../api";
import toast from "react-hot-toast";

export default function ReviewForm({ productId, onReviewAdded }) {
  const [form, setForm] = useState({ reviewerName: "", rating: 5, text: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "rating" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return toast.error("Please write a review");
    setSubmitting(true);
    try {
      const { data } = await createReview(productId, form);
      toast.success("Review submitted!");
      setForm({ reviewerName: "", rating: 5, text: "" });
      onReviewAdded?.(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <h3>Write a Review</h3>
      <div className="form-group">
        <label htmlFor="reviewerName">Your name (optional)</label>
        <input
          id="reviewerName"
          name="reviewerName"
          type="text"
          placeholder="Anonymous"
          value={form.reviewerName}
          onChange={handleChange}
          maxLength={100}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rating">Rating</label>
        <select id="rating" name="rating" value={form.rating} onChange={handleChange}>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{"★".repeat(r)} ({r}/5)</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="text">Your review <span aria-hidden="true">*</span></label>
        <textarea
          id="text"
          name="text"
          rows={4}
          placeholder="Share your experience with this product..."
          value={form.text}
          onChange={handleChange}
          required
          minLength={5}
          maxLength={2000}
        />
      </div>
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
