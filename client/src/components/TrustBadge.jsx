/**
 * Displays trust grade + score as a coloured badge.
 * grade: "A+" | "A" | "B" | "C" | "D" | "F" | null
 */
export default function TrustBadge({ grade, score, size = "md" }) {
  if (!grade) return <span className={`trust-badge trust-badge--unknown trust-badge--${size}`}>Unanalyzed</span>;

  const gradeClass = {
    "A+": "trust-badge--aplus",
    A: "trust-badge--a",
    B: "trust-badge--b",
    C: "trust-badge--c",
    D: "trust-badge--d",
    F: "trust-badge--f",
  }[grade] || "trust-badge--unknown";

  return (
    <span className={`trust-badge ${gradeClass} trust-badge--${size}`} title={`Trust Score: ${score}/100`}>
      {grade} <small>({score})</small>
    </span>
  );
}
