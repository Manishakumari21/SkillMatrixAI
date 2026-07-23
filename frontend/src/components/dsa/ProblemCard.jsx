import DifficultyBadge, { DIFF_COLORS } from "../shared/DifficultyBadge";

export default function ProblemCard({ problem, onClick }) {
  const dc = DIFF_COLORS[problem.difficulty] || DIFF_COLORS.Easy;
  return (
    <div
      className="card"
      style={{ cursor: "pointer", transition: "border-color 0.2s, box-shadow 0.2s", borderColor: "var(--border-subtle)" }}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = dc.border; e.currentTarget.style.boxShadow = `0 0 24px ${dc.bg}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div className="card-body" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <DifficultyBadge difficulty={problem.difficulty} />
          <span style={{
            fontSize: "10px", padding: "3px 10px", borderRadius: "999px",
            background: "var(--ctp-surface0)", color: "var(--ctp-overlay0)", fontFamily: "var(--font-mono)",
          }}>
            {problem.category}
          </span>
        </div>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ctp-text)", marginBottom: "8px", lineHeight: 1.3 }}>
          {problem.title}
        </div>
        <div style={{
          fontSize: "12px", color: "var(--ctp-overlay0)", lineHeight: 1.5, marginBottom: "12px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {problem.description}
        </div>
        {problem.tags?.length > 0 && (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {problem.tags.slice(0, 4).map((t) => (
              <span key={t} style={{
                fontSize: "9px", padding: "2px 8px", borderRadius: "999px",
                background: "var(--ctp-surface0)", color: "var(--ctp-overlay0)", fontFamily: "var(--font-mono)",
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
