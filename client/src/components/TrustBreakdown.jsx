/**
 * Detailed trust score breakdown panel shown on product detail page.
 */
export default function TrustBreakdown({ breakdown, grade, score }) {
  if (!breakdown) return null;

  const {
    sentimentPoints,
    ratingPoints,
    mismatchPoints,
    sentimentRatio,
    averageRating,
    matchScore,
    mismatches,
    verdict,
  } = breakdown;

  const pct = (v, max) => Math.round((v / max) * 100);

  return (
    <div className="trust-breakdown">
      <h3>Trust Score Breakdown</h3>
      <p className="trust-breakdown__verdict">{verdict}</p>

      <div className="trust-breakdown__bars">
        <ScoreBar label="Sentiment" value={sentimentPoints} max={40} color="var(--color-positive)" />
        <ScoreBar label="Rating Quality" value={ratingPoints} max={30} color="var(--color-neutral)" />
        <ScoreBar label="Description Match" value={mismatchPoints} max={30} color="var(--color-primary)" />
      </div>

      <div className="trust-breakdown__stats">
        <Stat label="Positive Reviews" value={`${sentimentRatio.positive}/${sentimentRatio.total}`} />
        <Stat label="Negative Reviews" value={`${sentimentRatio.negative}/${sentimentRatio.total}`} />
        <Stat label="Avg Rating" value={`${averageRating} / 5`} />
        <Stat label="Description Match" value={`${matchScore}%`} />
      </div>

      {mismatches?.length > 0 && (
        <div className="trust-breakdown__mismatches">
          <h4>Detected Mismatches</h4>
          <ul>
            {mismatches.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, max, color }) {
  const width = Math.round((value / max) * 100);
  return (
    <div className="score-bar">
      <div className="score-bar__header">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="score-bar__track">
        <div className="score-bar__fill" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="trust-stat">
      <span className="trust-stat__label">{label}</span>
      <span className="trust-stat__value">{value}</span>
    </div>
  );
}
