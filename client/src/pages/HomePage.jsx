import { useEffect, useState } from "react";
import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import Sidebar from "../components/Sidebar";

const CATEGORY_LABELS = {
  "": "All Products", Sarees: "Sarees", Kurtis: "Kurtis", Lehengas: "Lehengas",
  Tops: "Tops", "Ethnic Wear": "Ethnic Wear", Jewellery: "Jewellery",
  "Home Decor": "Home Decor", Kitchen: "Kitchen", Beauty: "Beauty",
  "Kids Wear": "Kids Wear", Footwear: "Footwear", Electronics: "Electronics", Other: "Other",
};

const SORT_LABELS = {
  newest: "Newest First", trustScore: "Best Trust Score",
  rating: "Best Rated", price_asc: "Price: Low → High", price_desc: "Price: High → Low",
};

export default function HomePage() {
  const { products, pagination, loading, error, fetchProducts } = useProducts();
  const [filters, setFilters] = useState({
    category: "", search: "", sort: "newest", trustGrade: "", page: 1,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const params = { ...filters };
    if (!params.category) delete params.category;
    if (!params.search) delete params.search;
    if (!params.trustGrade) delete params.trustGrade;
    fetchProducts(params);
  }, [filters, fetchProducts]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts({ ...filters, page: 1 });
  };

  const removeFilter = (key) => {
    handleFilterChange(key, key === "sort" ? "newest" : "");
  };

  // Active filter chips (excluding defaults)
  const activeChips = [
    filters.category && { key: "category", label: CATEGORY_LABELS[filters.category] || filters.category },
    filters.sort !== "newest" && { key: "sort", label: SORT_LABELS[filters.sort] || filters.sort },
    filters.trustGrade && { key: "trustGrade", label: `Grade: ${filters.trustGrade}` },
  ].filter(Boolean);

  return (
    <main className="home-page">
      {/* Hero */}
      <section className="hero">
        <h1>
          <span className="hero-sach">Sach</span>AI — Know the Truth Behind Reviews
        </h1>
        <p>AI-powered trust scores for Indian e-commerce products. No fake reviews, just the truth.</p>
      </section>

      {/* Toolbar: search + filter toggle */}
      <div className="home-toolbar">
        <form className="search-form" onSubmit={handleSearchSubmit} role="search">
          <div className="search-input-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search products…"
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              aria-label="Search products"
            />
          </div>
          <button type="submit" className="btn btn--primary">Search</button>
        </form>

        {/* Filter toggle — works on both desktop and mobile */}
        <button
          className={`btn filter-toggle-btn${sidebarOpen ? " filter-toggle-btn--active" : ""} ${activeChips.length ? "btn--primary" : "btn--outline"}`}
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={`${sidebarOpen ? "Close" : "Open"} filters${activeChips.length ? ` (${activeChips.length} active)` : ""}`}
          aria-expanded={sidebarOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Filters
          {activeChips.length > 0 && (
            <span className="filter-badge">{activeChips.length}</span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="filter-chips">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              className="filter-chip"
              onClick={() => removeFilter(chip.key)}
              aria-label={`Remove ${chip.label} filter`}
            >
              {chip.label}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          ))}
          <button
            className="filter-chip filter-chip--clear"
            onClick={() => setFilters((p) => ({ ...p, category: "", sort: "newest", trustGrade: "", page: 1 }))}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Layout: sidebar + content */}
      <div className="home-layout">
        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <section className="home-content" aria-label="Product listings">
          {error && <p className="error-msg" role="alert">{error}</p>}

          {loading ? (
            <div className="loading-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-card" aria-hidden="true" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="empty-state">No products found. Try adjusting your filters.</p>
          ) : (
            <>
              <p className="results-count">
                {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
                {activeChips.length > 0 && " (filtered)"}
              </p>
              <div className="product-grid">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn--outline"
                    disabled={filters.page <= 1}
                    onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    ← Previous
                  </button>
                  <span>Page {filters.page} of {pagination.pages}</span>
                  <button
                    className="btn btn--outline"
                    disabled={filters.page >= pagination.pages}
                    onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
