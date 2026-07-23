import DifficultyBadge from "../shared/DifficultyBadge";

export default function ProblemDescription({ problem, onBack }) {
  return (
    <div className="card">
      <div className="card-gradient-bar" />
      <div className="card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--ctp-text)", marginBottom: "6px" }}>
              {problem.title}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <DifficultyBadge difficulty={problem.difficulty} />
              <span style={{
                fontSize: "10px", padding: "3px 10px", borderRadius: "999px",
                background: "var(--ctp-surface0)", color: "var(--ctp-overlay0)",
                fontFamily: "var(--font-mono)",
              }}>
                {problem.category}
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: "11px", padding: "6px 14px" }}
            onClick={onBack}
          >
            Back to List
          </button>
        </div>

        <div style={{ fontSize: "13px", color: "var(--ctp-overlay1)", lineHeight: 1.7, marginBottom: "20px" }}>
          {problem.description}
        </div>

        {problem.examples?.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ctp-overlay0)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Examples
            </div>
            {problem.examples.map((ex, i) => (
              <div key={i} style={{
                fontFamily: "var(--font-mono)", fontSize: "12px",
                background: "var(--ctp-surface0)", padding: "12px 14px",
                borderRadius: "8px", marginBottom: "8px",
                border: "1px solid var(--border-subtle)",
              }}>
                <div><span style={{ color: "var(--ctp-overlay0)" }}>Input: </span><span style={{ color: "var(--ctp-text)" }}>{ex.input}</span></div>
                <div><span style={{ color: "var(--ctp-overlay0)" }}>Output: </span><span style={{ color: "var(--ctp-green)" }}>{ex.output}</span></div>
                {ex.explanation && <div style={{ color: "var(--ctp-overlay0)", fontSize: "11px", marginTop: "4px" }}>{ex.explanation}</div>}
              </div>
            ))}
          </div>
        )}

        {problem.hints?.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ctp-overlay0)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Hints
            </div>
            {problem.hints.map((h, i) => (
              <div key={i} style={{ fontSize: "12px", color: "var(--ctp-peach)", marginBottom: "6px", paddingLeft: "12px" }}>
                {i + 1}. {h}
              </div>
            ))}
          </div>
        )}

        {problem.tags?.length > 0 && (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {problem.tags.map((t) => (
              <span key={t} style={{
                fontSize: "9px", padding: "2px 8px", borderRadius: "999px",
                background: "var(--ctp-surface0)", color: "var(--ctp-overlay0)",
                fontFamily: "var(--font-mono)",
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
