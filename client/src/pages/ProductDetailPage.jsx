import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getProduct, getReviews, analyzeTrust, deleteProduct } from "../api";
import StarRating from "../components/StarRating";
import TrustBadge from "../components/TrustBadge";
import TrustBreakdown from "../components/TrustBreakdown";
import ReviewForm from "../components/ReviewForm";

const SENTIMENT_COLORS = { positive: "var(--color-positive)", neutral: "var(--color-neutral)", negative: "var(--color-negative)" };
const SENTIMENT_LABELS = { positive: "😊 Positive", neutral: "😐 Neutral", negative: "😞 Negative" };

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingProduct(true);
      try {
        const [pRes, rRes] = await Promise.all([getProduct(id), getReviews(id)]);
        setProduct(pRes.data.data);
        setReviews(rRes.data.data);
      } catch {
        toast.error("Failed to load product");
        navigate("/");
      } finally {
        setLoadingProduct(false);
      }
    }
    load();
  }, [id, navigate]);

  const handleAnalyzeTrust = async () => {
    setAnalyzing(true);
    const toastId = toast.loading("Running AI analysis… this may take a few seconds");
    try {
      const { data } = await analyzeTrust(id);
      const productRes = await getProduct(id);
      setProduct(productRes.data.data);
      toast.success(`Trust Score calculated: ${data.data.trustGrade} (${data.data.trustScore}/100)`, { id: toastId });
    } catch (err) {
      // Intentionally NOT calling setProduct here — preserves the existing trust score display (Req 3.3)
      toast.error(err.response?.data?.message || "Analysis failed", { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this product and all its reviews?")) return;
    setDeleting(true);
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      navigate("/");
    } catch {
      toast.error("Failed to delete product");
      setDeleting(false);
    }
  };

  const handleReviewAdded = (review) => {
    setReviews((prev) => [review, ...prev]);
    setProduct((p) => ({
      ...p,
      totalReviews: p.totalReviews + 1,
      averageRating: Math.round(
        ((p.averageRating * p.totalReviews + review.rating) / (p.totalReviews + 1)) * 10
      ) / 10,
    }));
  };

  if (loadingProduct) {
    return (
      <main className="detail-page">
        <div className="skeleton-detail" aria-busy="true" aria-label="Loading product">
          <span className="sr-only">Loading product</span>
        </div>
      </main>
    );
  }

  if (!product) return null;
  const image = product.images?.[0] || "https://placehold.co/600x400?text=No+Image";

  return (
    <main className="detail-page">
      <button className="btn btn--ghost back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="detail-header">
        <div className="detail-image">
          <img src={image} alt={product.title} />
        </div>
        <div className="detail-info">
          <span className="detail-category">{product.category}</span>
          <h1 className="detail-title">{product.title}</h1>
          <div className="detail-meta">
            <StarRating rating={product.averageRating} count={product.totalReviews} />
            <TrustBadge grade={product.trustGrade} score={product.trustScore} size="lg" />
          </div>
          <p className="detail-price">₹{product.price.toLocaleString("en-IN")}</p>
          <p className="detail-description">{product.description}</p>

          {product.lastAnalyzed && (
            <p className="detail-analyzed">
              Last analyzed: {new Date(product.lastAnalyzed).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          )}

          <div className="detail-actions">
            <button
              className="btn btn--primary"
              onClick={handleAnalyzeTrust}
              disabled={analyzing || reviews.length === 0}
              title={reviews.length === 0 ? "Add reviews first to analyze" : ""}
            >
              {analyzing ? "Analyzing…" : product.trustScore ? "Re-analyze Trust" : "Analyze Trust Score"}
            </button>
            <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Product"}
            </button>
          </div>
        </div>
      </div>

      {/* Trust Breakdown */}
      {product.trustBreakdown && (
        <TrustBreakdown
          breakdown={product.trustBreakdown}
          grade={product.trustGrade}
          score={product.trustScore}
        />
      )}

      {/* Reviews */}
      <section className="reviews-section">
        <h2>Customer Reviews ({reviews.length})</h2>
        <ReviewForm productId={id} onReviewAdded={handleReviewAdded} />

        {reviews.length === 0 ? (
          <p className="empty-state">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="reviews-list">
            {reviews.map((r) => (
              <div key={r._id} className="review-card">
                <div className="review-card__header">
                  <strong>{r.reviewerName || "Anonymous"}</strong>
                  <StarRating rating={r.rating} />
                  {r.sentiment && (
                    <span
                      className="review-sentiment"
                      style={{ color: SENTIMENT_COLORS[r.sentiment] }}
                    >
                      {SENTIMENT_LABELS[r.sentiment]}
                    </span>
                  )}
                </div>
                <p className="review-card__text">{r.text}</p>
                <span className="review-card__date">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
