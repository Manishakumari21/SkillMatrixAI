export default function RunResults({ runResult }) {
  if (!runResult || runResult.error) return null;

  return (
    <div className="card" style={{ marginBottom: "16px" }}>
      <div className="card-body" style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: runResult.percentage === 100 ? "rgba(166, 227, 161, 0.15)" : "rgba(243, 139, 168, 0.15)",
            border: `2px solid ${runResult.percentage === 100 ? "var(--ctp-green)" : "var(--ctp-red)"}`,
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700,
              color: runResult.percentage === 100 ? "var(--ctp-green)" : "var(--ctp-red)",
            }}>
              {runResult.percentage}%
            </span>
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ctp-text)" }}>
              {runResult.passed}/{runResult.total} Test Cases Passed
            </div>
            {runResult.suggestion && (
              <div style={{ fontSize: "11px", color: "var(--ctp-peach)", marginTop: "2px" }}>
                {runResult.suggestion}
              </div>
            )}
          </div>
        </div>

        <div className="progress-track" style={{ height: "6px", marginBottom: "16px" }}>
          <div className="progress-fill" style={{
            width: `${runResult.percentage}%`,
            background: runResult.percentage === 100
              ? "linear-gradient(90deg, var(--ctp-green), var(--ctp-teal))"
              : "linear-gradient(90deg, var(--ctp-peach), var(--ctp-red))",
          }} />
        </div>

        {runResult.results?.map((r, i) => (
          <div key={i} style={{
            padding: "10px 14px", marginBottom: "6px", borderRadius: "8px",
            background: r.passed ? "rgba(166, 227, 161, 0.06)" : "rgba(243, 139, 168, 0.06)",
            border: `1px solid ${r.passed ? "rgba(166, 227, 161, 0.15)" : "rgba(243, 139, 168, 0.15)"}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px" }}>{r.passed ? "✅" : "❌"}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ctp-overlay0)" }}>
                Test {i + 1}
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ctp-overlay1)" }}>
              <div>Input: {r.input}</div>
              <div>Expected: <span style={{ color: "var(--ctp-green)" }}>{r.expected}</span></div>
              {!r.passed && <div>Got: <span style={{ color: "var(--ctp-red)" }}>{r.actual || r.error}</span></div>}
            </div>
          </div>
        ))}

        {runResult.percentage < 100 && runResult.approach && (
          <div style={{
            marginTop: "16px", padding: "14px", borderRadius: "8px",
            background: "rgba(250, 179, 135, 0.08)", border: "1px solid rgba(250, 179, 135, 0.15)",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ctp-peach)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Solution Approach
            </div>
            <div style={{ fontSize: "12px", color: "var(--ctp-overlay1)", lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
              {runResult.approach}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
