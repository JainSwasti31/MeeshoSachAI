import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main style={{ textAlign: "center", marginTop: "6rem", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "4rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "0.5rem" }}>
        404
      </h1>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
        Page Not Found
      </h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to="/" className="btn btn--primary">
        Go Home
      </Link>
    </main>
  );
}
