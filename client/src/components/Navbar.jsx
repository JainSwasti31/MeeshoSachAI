import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
        {/* Shield / trust icon */}
        <svg className="brand-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
            fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="brand-sach">Sach</span>
        <span className="brand-ai">AI</span>
        <span className="brand-tagline">Review Truth Engine</span>
      </Link>

      {/* Desktop nav links */}
      <div className={`navbar-links${menuOpen ? " navbar-links--open" : ""}`}>
        <Link
          to="/"
          className={`navbar-link${pathname === "/" ? " active" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
              stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Products
        </Link>
        <Link
          to="/add-product"
          className={`navbar-link${pathname === "/add-product" ? " active" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Right side */}
      <div className="navbar-right">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="navbar-icon-btn"
          aria-label="GitHub repository"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482
              0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462
              -.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832
              .092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683
              -.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004
              1.705.114 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699
              1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336
              -.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>

        <div className="navbar-avatar" aria-label="User menu" title="SachAI User">
          SA
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="navbar-hamburger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
