const difficultyStyles = {
  easy: { color: "var(--ctp-green)", bg: "var(--accent-green-dim)", border: "rgba(166, 227, 161, 0.15)" },
  medium: { color: "var(--ctp-peach)", bg: "var(--accent-peach-dim)", border: "rgba(250, 179, 135, 0.15)" },
  hard: { color: "var(--ctp-red)", bg: "var(--accent-red-dim)", border: "rgba(243, 139, 168, 0.15)" },
};

export { difficultyStyles };

export default function SetupPhase({
  role, setRole, topic, setTopic, difficulty, setDifficulty,
  numQuestions, setNumQuestions, interviewConfig, loading, error,
  handleStartSession,
}) {
  return (
    <>
      <div style={{ marginBottom: "32px" }}>
        <h1 className="section-title">Mock Interview</h1>
        <p className="section-subtitle">
          Serious interview simulation with anti-cheating measures. No tab switching, no copy-paste, fullscreen locked.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label className="label">Role</label>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select role</option>
                {(interviewConfig?.roles || []).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Topic</label>
              <select className="input-field" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Select topic</option>
                {(interviewConfig?.topics || []).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                {(interviewConfig?.difficulties || ["easy", "medium", "hard"]).map((d) => {
                  const s = difficultyStyles[d];
                  const isSelected = difficulty === d;
                  return (
                    <button
                      key={d}
                      className="btn"
                      style={{
                        flex: 1, fontSize: "11px", padding: "10px 4px", justifyContent: "center",
                        textTransform: "capitalize", fontWeight: isSelected ? 600 : 400,
                        background: isSelected ? s.bg : "var(--ctp-surface0)",
                        color: isSelected ? s.color : "var(--ctp-overlay1)",
                        border: `1px solid ${isSelected ? s.border : "var(--border-default)"}`,
                      }}
                      onClick={() => setDifficulty(d)}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label className="label">Number of Questions</label>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              {(interviewConfig?.question_counts || [3, 5, 7, 10]).map((n) => (
                <button
                  key={n}
                  className="btn"
                  onClick={() => setNumQuestions(n)}
                  style={{
                    minWidth: "50px", fontSize: "12px", fontWeight: numQuestions === n ? 600 : 400,
                    background: numQuestions === n ? "var(--accent-mauve-dim)" : "var(--ctp-surface0)",
                    color: numQuestions === n ? "var(--ctp-mauve)" : "var(--ctp-overlay1)",
                    border: `1px solid ${numQuestions === n ? "rgba(203, 166, 247, 0.2)" : "var(--border-default)"}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--ctp-surface0)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: "20px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ctp-overlay0)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
              Anti-Cheating Rules
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {["Tab/window switch = recorded", "Copy/paste blocked & recorded", "Fullscreen lock enforced", "Right-click disabled", "DevTools shortcuts blocked", "Speech-typed mismatch flagged"].map((rule) => (
                <div key={rule} style={{ fontSize: "12px", color: "var(--ctp-subtext0)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-red)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error-box" style={{ marginBottom: "14px" }}>{error}</div>}

          <button className="btn btn-primary" onClick={handleStartSession} disabled={loading || !role || !topic}>
            {loading ? <><span className="spinner" /> Starting Session...</> : "Start Mock Interview"}
          </button>
        </div>
      </div>
    </>
  );
}
