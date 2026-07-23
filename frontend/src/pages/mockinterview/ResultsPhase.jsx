import { ScoreRing } from "../../components/shared";

const PRIORITY_COLORS = {
  HIGH: { color: "var(--ctp-red)", bg: "var(--accent-red-dim)" },
  MEDIUM: { color: "var(--ctp-peach)", bg: "var(--accent-peach-dim)" },
  LOW: { color: "var(--ctp-green)", bg: "var(--accent-green-dim)" },
};

function PriorityBadge({ priority }) {
  const s = PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM;
  return <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: s.bg, color: s.color, letterSpacing: "0.05em" }}>{priority}</span>;
}

function SkillPill({ text, type }) {
  const colors = type === "strong" ? { bg: "var(--accent-green-dim)", color: "var(--ctp-green)", border: "rgba(166, 227, 161, 0.1)" }
    : type === "weak" ? { bg: "var(--accent-peach-dim)", color: "var(--ctp-peach)", border: "rgba(250, 179, 135, 0.1)" }
    : { bg: "var(--accent-red-dim)", color: "var(--ctp-red)", border: "rgba(243, 139, 168, 0.1)" };
  return <div style={{ padding: "6px 10px", background: colors.bg, borderRadius: "6px", fontSize: "12px", color: colors.color, marginBottom: "4px", border: `1px solid ${colors.border}` }}>{text}</div>;
}

function SkillColumn({ title, items, color }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{title}</div>
      {items?.length > 0 ? items.map((s, i) => <SkillPill key={i} text={s} type={color === "var(--ctp-green)" ? "strong" : color === "var(--ctp-peach)" ? "weak" : "critical"} />) : <div style={{ fontSize: "12px", color: "var(--ctp-overlay0)", fontStyle: "italic" }}>None identified</div>}
    </div>
  );
}

function SpeechMetric({ value, label, color }) {
  return (
    <div style={{ padding: "14px", background: "var(--ctp-surface0)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--ctp-overlay0)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
    </div>
  );
}

function SpeechPanel({ title, color, text }) {
  return (
    <div style={{ padding: "16px", background: "var(--ctp-surface0)", borderRadius: "var(--radius-md)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{title}</div>
      <div style={{ fontSize: "12px", color: "var(--ctp-subtext0)", lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

export default function ResultsPhase({
  feedback, evaluating, error, role, topic, difficulty, questions,
  tabSwitches, copyPasteCount, fullscreenExits, visibleHints, setVisibleHints,
  handleSubmitSession, handleExitInterview,
}) {
  if (evaluating) {
    return (
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-body" style={{ textAlign: "center", padding: "48px" }}>
          <div className="spinner" style={{ marginBottom: "16px" }} />
          <div style={{ fontSize: "14px", color: "var(--ctp-subtext0)" }}>Evaluating your interview session...</div>
        </div>
      </div>
    );
  }

  if (error && !evaluating) {
    return (
      <div className="card" style={{ marginBottom: "24px", borderColor: "rgba(243, 139, 168, 0.2)" }}>
        <div className="card-body" style={{ textAlign: "center", padding: "32px" }}>
          <div style={{ fontSize: "14px", color: "var(--ctp-red)", marginBottom: "16px" }}>{error}</div>
          <button className="btn btn-primary" onClick={() => handleSubmitSession()}>Retry Evaluation</button>
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <>
      <div style={{ marginBottom: "32px" }}>
        <h1 className="section-title">Interview Results</h1>
        <p className="section-subtitle">{role} · {topic} · {difficulty} · {questions.length} questions</p>
      </div>

      {feedback.verdict && (
        <div className="card" style={{ marginBottom: "24px", borderColor: feedback.verdict === "PASS" ? "rgba(166, 227, 161, 0.2)" : "rgba(243, 139, 168, 0.2)" }}>
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              <ScoreRing score={feedback.overall_score} size={90} />
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 800, color: feedback.verdict === "PASS" ? "var(--ctp-green)" : "var(--ctp-red)", marginBottom: "4px" }}>{feedback.verdict}</div>
                <div style={{ fontSize: "14px", color: "var(--ctp-subtext0)", lineHeight: 1.7 }}>{feedback.overall_feedback}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                <ScoreRing score={feedback.integrity_score} size={64} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--ctp-overlay0)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Integrity</span>
              </div>
            </div>
            {(tabSwitches + copyPasteCount + fullscreenExits > 0) && (
              <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--accent-red-dim)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(243, 139, 168, 0.15)", fontSize: "12px", color: "var(--ctp-red)", fontFamily: "var(--font-mono)" }}>
                Cheating incidents: {tabSwitches} tab switches, {copyPasteCount} copy/paste attempts, {fullscreenExits} fullscreen exits
              </div>
            )}
          </div>
        </div>
      )}

      {feedback.skill_assessment && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-gradient-bar-cool" />
          <div className="card-body">
            <div className="label" style={{ marginBottom: "16px" }}>Skill Assessment</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <SkillColumn title="Strong Skills" items={feedback.skill_assessment.strong_skills} color="var(--ctp-green)" />
              <SkillColumn title="Weak Skills" items={feedback.skill_assessment.weak_skills} color="var(--ctp-peach)" />
              <SkillColumn title="Critical Gaps" items={feedback.skill_assessment.critical_gaps} color="var(--ctp-red)" />
            </div>
          </div>
        </div>
      )}

      {feedback.question_scores && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body">
            <div className="label" style={{ marginBottom: "16px" }}>Question-by-Question Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {feedback.question_scores.map((qs, i) => (
                <div key={i} style={{ padding: "16px", background: "var(--ctp-surface0)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ctp-text)", flex: 1 }}>Q{i + 1}: {qs.question?.slice(0, 80)}{qs.question?.length > 80 ? "..." : ""}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "12px" }}>
                      {qs.score === 0 && <span style={{ fontSize: "9px", fontFamily: "var(--font-mono)", fontWeight: 600, padding: "2px 6px", borderRadius: "4px", background: "var(--ctp-overlay0)", color: "var(--ctp-crust)" }}>SKIPPED</span>}
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: qs.score === 0 ? "var(--ctp-overlay0)" : qs.score >= 7 ? "var(--ctp-green)" : qs.score >= 4 ? "var(--ctp-peach)" : "var(--ctp-red)" }}>{qs.score}/10</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ctp-subtext0)", lineHeight: 1.6, marginBottom: "8px" }}>{qs.feedback}</div>
                  {qs.structure_type && qs.structure_type !== "N/A" && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "9px", fontFamily: "var(--font-mono)", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: qs.structure_type === "STAR" ? "var(--accent-green-dim)" : qs.structure_type === "Technical" ? "var(--accent-mauve-dim)" : "var(--accent-peach-dim)", color: qs.structure_type === "STAR" ? "var(--ctp-green)" : qs.structure_type === "Technical" ? "var(--ctp-mauve)" : "var(--ctp-peach)" }}>{qs.structure_type}</span>
                      <span style={{ fontSize: "11px", color: "var(--ctp-overlay0)", fontStyle: "italic" }}>{qs.structure_feedback}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {qs.skills_demonstrated?.length > 0 && <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{qs.skills_demonstrated.map((s, j) => <span key={j} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "var(--accent-green-dim)", color: "var(--ctp-green)" }}>+{s}</span>)}</div>}
                    {qs.skills_missing?.length > 0 && <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{qs.skills_missing.map((s, j) => <span key={j} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "var(--accent-red-dim)", color: "var(--ctp-red)" }}>-{s}</span>)}</div>}
                  </div>
                  {qs.hint && (
                    <div style={{ marginTop: "12px" }}>
                      <button className="btn" onClick={() => setVisibleHints(prev => ({ ...prev, [i]: !prev[i] }))} style={{ fontSize: "11px", padding: "6px 12px", background: visibleHints[i] ? "var(--accent-mauve-dim)" : "var(--ctp-surface1)", color: visibleHints[i] ? "var(--ctp-mauve)" : "var(--ctp-subtext0)", border: `1px solid ${visibleHints[i] ? "rgba(203, 166, 247, 0.2)" : "var(--border-default)"}`, display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        {visibleHints[i] ? "Hide Hint" : "View Hint"}
                      </button>
                      {visibleHints[i] && <div style={{ marginTop: "8px", padding: "12px 14px", background: "rgba(203, 166, 247, 0.06)", border: "1px solid rgba(203, 166, 247, 0.12)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--ctp-subtext0)", lineHeight: 1.6 }}>{qs.hint}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {feedback.speech_analysis && (
        <div className="card page-enter" style={{ marginBottom: "24px" }}>
          <div className="card-gradient-bar-cool" />
          <div className="card-body">
            <div className="label" style={{ marginBottom: "16px" }}>Speech Analysis</div>
            {feedback.speech_metrics && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <SpeechMetric value={feedback.speech_metrics.avg_wpm || 0} label="Avg WPM" color="var(--ctp-mauve)" />
                <SpeechMetric value={feedback.speech_metrics.total_fillers || 0} label="Filler Words" color="var(--ctp-peach)" />
                <SpeechMetric value={`${feedback.speech_metrics.questions_with_speech || 0}/${feedback.speech_metrics.total_questions || 0}`} label="Spoken" color="var(--ctp-green)" />
                <SpeechMetric value={feedback.speech_metrics.avg_similarity ? `${Math.round(feedback.speech_metrics.avg_similarity * 100)}%` : "N/A"} label="Match Rate" color="var(--ctp-sky)" />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <SpeechPanel title="Pacing" color="var(--ctp-mauve)" text={feedback.speech_analysis.pacing_feedback} />
              <SpeechPanel title="Filler Words" color="var(--ctp-peach)" text={feedback.speech_analysis.filler_feedback} />
              <SpeechPanel title="Spoken vs Typed" color="var(--ctp-green)" text={feedback.speech_analysis.spoken_typed_comparison} />
              <SpeechPanel title="Answer Structure" color="var(--ctp-sky)" text={feedback.speech_analysis.structure_assessment} />
            </div>
            {feedback.speech_analysis.improvement_tips?.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--ctp-overlay0)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Speech Improvement Tips</div>
                {feedback.speech_analysis.improvement_tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px", fontSize: "12px", color: "var(--ctp-subtext0)" }}>
                    <span style={{ color: "var(--ctp-mauve)", fontWeight: 600, minWidth: "16px" }}>{i + 1}.</span>{tip}
                  </div>
                ))}
              </div>
            )}
            {feedback.question_scores?.some((q) => q.structure_type && q.structure_type !== "N/A") && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--ctp-overlay0)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Per-Question Structure</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {feedback.question_scores.map((q, i) => q.structure_type && q.structure_type !== "N/A" ? (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "8px 12px", background: "var(--ctp-surface0)", borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--ctp-overlay0)", minWidth: "20px" }}>Q{i + 1}</span>
                      <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: q.structure_type === "STAR" ? "var(--accent-green-dim)" : q.structure_type === "Technical" ? "var(--accent-mauve-dim)" : "var(--accent-peach-dim)", color: q.structure_type === "STAR" ? "var(--ctp-green)" : q.structure_type === "Technical" ? "var(--ctp-mauve)" : "var(--ctp-peach)" }}>{q.structure_type}</span>
                      <span style={{ fontSize: "11px", color: "var(--ctp-subtext0)" }}>{q.structure_feedback}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {feedback.improvement_roadmap?.length > 0 && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-gradient-bar" />
          <div className="card-body">
            <div className="label" style={{ marginBottom: "16px" }}>Improvement Roadmap</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {feedback.improvement_roadmap.map((item, i) => (
                <div key={i} style={{ padding: "16px", background: "var(--ctp-surface0)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <PriorityBadge priority={item.priority} />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ctp-text)" }}>{item.skill}</span>
                    <span style={{ fontSize: "11px", color: "var(--ctp-overlay0)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>{item.estimated_time}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ctp-subtext0)", lineHeight: 1.6, marginBottom: "8px" }}>{item.what_to_learn}</div>
                  {item.recommended_resources?.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {item.recommended_resources.map((r, j) => <span key={j} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "4px", background: "var(--accent-mauve-dim)", color: "var(--ctp-mauve)", border: "1px solid rgba(203, 166, 247, 0.1)" }}>{r}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {feedback.next_steps?.length > 0 && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body">
            <div className="label" style={{ marginBottom: "12px" }}>Next Steps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {feedback.next_steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "var(--ctp-subtext0)", lineHeight: 1.6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--ctp-mauve)", minWidth: "20px" }}>{i + 1}.</span>{step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button className="btn btn-primary" onClick={() => { handleExitInterview(); }}>Start New Session</button>
        <button className="btn btn-secondary" onClick={() => { handleExitInterview(); }}>Change Settings</button>
      </div>
    </>
  );
}
