import { useState } from "react";

const CATEGORIES = [
  { label: "All Products", value: "", icon: "🛍️" },
  { label: "Sarees", value: "Sarees", icon: "🥻" },
  { label: "Kurtis", value: "Kurtis", icon: "👗" },
  { label: "Lehengas", value: "Lehengas", icon: "👘" },
  { label: "Tops", value: "Tops", icon: "👚" },
  { label: "Ethnic Wear", value: "Ethnic Wear", icon: "🎽" },
  { label: "Jewellery", value: "Jewellery", icon: "💍" },
  { label: "Home Decor", value: "Home Decor", icon: "🏡" },
  { label: "Kitchen", value: "Kitchen", icon: "🍳" },
  { label: "Beauty", value: "Beauty", icon: "💄" },
  { label: "Kids Wear", value: "Kids Wear", icon: "🧒" },
  { label: "Footwear", value: "Footwear", icon: "👟" },
  { label: "Electronics", value: "Electronics", icon: "📱" },
  { label: "Other", value: "Other", icon: "📦" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", icon: "🕒" },
  { value: "trustScore", label: "Best Trust Score", icon: "🏆" },
  { value: "rating", label: "Best Rated", icon: "⭐" },
  { value: "price_asc", label: "Price: Low → High", icon: "↑" },
  { value: "price_desc", label: "Price: High → Low", icon: "↓" },
];

const TRUST_GRADES = [
  { value: "", label: "Any Grade", color: "#9ca3af" },
  { value: "A+", label: "A+ Excellent", color: "#059669" },
  { value: "A", label: "A  Very Good", color: "#16a34a" },
  { value: "B", label: "B  Good", color: "#2563eb" },
  { value: "C", label: "C  Average", color: "#d97706" },
  { value: "D", label: "D  Poor", color: "#ea580c" },
  { value: "F", label: "F  Untrustworthy", color: "#dc2626" },
];

export default function Sidebar({ filters, onFilterChange, open, onClose }) {
  const [sectionsOpen, setSectionsOpen] = useState({
    categories: true,
    sort: true,
    grade: false,
  });

  const toggle = (key) =>
    setSectionsOpen((s) => ({ ...s, [key]: !s[key] }));

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${open ? " sidebar--open" : " sidebar--hidden"}`} aria-label="Filters">
        {/* Header */}
        <div className="sidebar-header">
          <span className="sidebar-title">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" />
            </svg>
            Filters
          </span>
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Category section */}
        <div className="sidebar-section">
          <button
            className="sidebar-section-toggle"
            onClick={() => toggle("categories")}
            aria-expanded={sectionsOpen.categories}
          >
            <span>Category</span>
            <svg
              className={`sidebar-chevron${sectionsOpen.categories ? " open" : ""}`}
              viewBox="0 0 24 24" fill="none" aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {sectionsOpen.categories && (
            <ul className="sidebar-list" role="list">
              {CATEGORIES.map((cat) => (
                <li key={cat.value}>
                  <button
                    className={`sidebar-item${filters.category === cat.value ? " active" : ""}`}
                    onClick={() => {
                      onFilterChange("category", cat.value);
                      onClose();
                    }}
                  >
                    <span className="sidebar-item-icon">{cat.icon}</span>
                    {cat.label}
                    {filters.category === cat.value && (
                      <svg className="sidebar-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sort section */}
        <div className="sidebar-section">
          <button
            className="sidebar-section-toggle"
            onClick={() => toggle("sort")}
            aria-expanded={sectionsOpen.sort}
          >
            <span>Sort By</span>
            <svg
              className={`sidebar-chevron${sectionsOpen.sort ? " open" : ""}`}
              viewBox="0 0 24 24" fill="none" aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {sectionsOpen.sort && (
            <ul className="sidebar-list" role="list">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <button
                    className={`sidebar-item${filters.sort === opt.value ? " active" : ""}`}
                    onClick={() => onFilterChange("sort", opt.value)}
                  >
                    <span className="sidebar-item-icon">{opt.icon}</span>
                    {opt.label}
                    {filters.sort === opt.value && (
                      <svg className="sidebar-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Trust grade filter */}
        <div className="sidebar-section">
          <button
            className="sidebar-section-toggle"
            onClick={() => toggle("grade")}
            aria-expanded={sectionsOpen.grade}
          >
            <span>Trust Grade</span>
            <svg
              className={`sidebar-chevron${sectionsOpen.grade ? " open" : ""}`}
              viewBox="0 0 24 24" fill="none" aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {sectionsOpen.grade && (
            <ul className="sidebar-list" role="list">
              {TRUST_GRADES.map((g) => (
                <li key={g.value}>
                  <button
                    className={`sidebar-item${(filters.trustGrade || "") === g.value ? " active" : ""}`}
                    onClick={() => onFilterChange("trustGrade", g.value)}
                  >
                    <span
                      className="sidebar-grade-dot"
                      style={{ background: g.color }}
                      aria-hidden="true"
                    />
                    {g.label}
                    {(filters.trustGrade || "") === g.value && (
                      <svg className="sidebar-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Clear all */}
        {(filters.category || filters.sort !== "newest" || filters.trustGrade) && (
          <div className="sidebar-footer">
            <button
              className="btn btn--outline btn--sm"
              onClick={() => {
                onFilterChange("category", "");
                onFilterChange("sort", "newest");
                onFilterChange("trustGrade", "");
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
