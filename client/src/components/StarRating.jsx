/**
 * Read-only star display.
 * rating: 0–5 (supports decimals)
 */
export default function StarRating({ rating, count }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i + 1 <= rating) return "full";
    if (i < rating) return "half";
    return "empty";
  });

  return (
    <span className="star-rating" aria-label={`${rating} out of 5 stars`}>
      {stars.map((type, i) => (
        <span key={i} className={`star star--${type}`}>
          {type === "full" ? "★" : type === "half" ? "⯨" : "☆"}
        </span>
      ))}
      {count !== undefined && <span className="star-count">({count})</span>}
    </span>
  );
}
