import { Link } from "react-router-dom";
import TrustBadge from "./TrustBadge";
import StarRating from "./StarRating";

export default function ProductCard({ product }) {
  const image = product.images?.[0] || "https://placehold.co/400x300?text=No+Image";

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-card__img-wrap">
        <img src={image} alt={product.title} loading="lazy" />
        <span className="product-card__category">{product.category}</span>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__title">{product.title}</h3>
        <div className="product-card__meta">
          <StarRating rating={product.averageRating} count={product.totalReviews} />
          <TrustBadge grade={product.trustGrade} score={product.trustScore} size="sm" />
        </div>
        <p className="product-card__price">₹{product.price.toLocaleString("en-IN")}</p>
      </div>
    </Link>
  );
}
