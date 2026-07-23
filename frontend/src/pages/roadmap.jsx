import { useState } from "react";
import Layout from "../components/Layout";
import client from "../api/client";
import { PageHeader, SectionLabel, EmptyState, ChartImage } from "../components/shared";

const CONFIDENCE_STYLES = {
  high: { color: "var(--ctp-green)", bg: "rgba(166, 227, 161, 0.12)", border: "rgba(166, 227, 161, 0.25)", label: "High Confidence" },
  moderate: { color: "var(--ctp-peach)", bg: "rgba(250, 179, 135, 0.12)", border: "rgba(250, 179, 135, 0.25)", label: "Moderate Confidence" },
  low: { color: "var(--ctp-red)", bg: "rgba(243, 139, 168, 0.12)", border: "rgba(243, 139, 168, 0.25)", label: "Low Confidence" },
};

const RELEVANCE_STYLES = {
  high: { color: "var(--ctp-green)", bg: "rgba(166, 227, 161, 0.12)", label: "High Relevance" },
  moderate: { color: "var(--ctp-peach)", bg: "rgba(250, 179, 135, 0.12)", label: "Moderate Relevance" },
  low: { color: "var(--ctp-red)", bg: "rgba(243, 139, 168, 0.12)", label: "Low Relevance" },
};

export default function Roadmap() {
  const [jobInputs, setJobInputs] = useState([""]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  function addJobInput() {
    setJobInputs([...jobInputs, ""]);
  }

  function removeJobInput(index) {
    if (jobInputs.length <= 1) return;
    setJobInputs(jobInputs.filter((_, i) => i !== index));
  }

  function updateJobInput(index, value) {
    const updated = [...jobInputs];
    updated[index] = value;
    setJobInputs(updated);
  }

  async function handleGenerate() {
    const resumeId = localStorage.getItem("resume_id");

    if (!resumeId) {
      setError("Upload a resume on the dashboard first");
      return;
    }

    const descriptions = jobInputs.filter((j) => j.trim());
    if (descriptions.length === 0) {
      setError("Paste at least one job description");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await client.post("/roadmap/generate", {
        resume_id: resumeId,
        job_descriptions: descriptions,
      });
      setResult(response.data);
    } catch (err) {
      setError("Could not generate roadmap, try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPdf() {
    if (!result) return;

    setPdfLoading(true);
    try {
      const missingSkills = (result.roadmap || []).map((r) => r.skill);
      const recommendations = (result.roadmap || []).map(
        (r) =>
          `${r.skill} (${r.demand_percentage}% demand): ${r.explanation}`
      );

      const response = await client.post(
        "/roadmap-export/pdf",
        {
          job_role: "Target Role",
          missing_skills: missingSkills,
          match_percentage: result.composite_readiness_score || 0,
          recommendations: recommendations,
        },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "skillmatrix_roadmap.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Could not export PDF, try again");
    } finally {
      setPdfLoading(false);
    }
  }

  const confStyle = result ? CONFIDENCE_STYLES[result.analysis_confidence] || CONFIDENCE_STYLES.low : null;
  const relStyle = result ? RELEVANCE_STYLES[result.relevance_label] || RELEVANCE_STYLES.low : null;

  return (
    <Layout>
      <div className="page-enter">
        <PageHeader
          title="Skill Roadmap"
          subtitle="Discover which skills are most in demand across multiple job postings. Analysis accuracy depends on how well your resume aligns with the target roles."
        />

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body">
            <SectionLabel>Job Descriptions</SectionLabel>
            <p className="roadmap-info">
              Add one or more job postings to analyze skill demand
            </p>

            {jobInputs.map((value, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span className="roadmap-input-badge">
                      #{index + 1}
                    </span>
                  </div>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Paste a job description here..."
                    value={value}
                    onChange={(e) => updateJobInput(index, e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </div>
                {jobInputs.length > 1 && (
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: "22px", padding: "8px 12px", fontSize: "11px", minWidth: "36px" }}
                    onClick={() => removeJobInput(index)}
                  >
                    x
                  </button>
                )}
              </div>
            ))}

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                className="btn btn-secondary"
                onClick={addJobInput}
                style={{ fontSize: "12px" }}
              >
                + Add More
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Analyzing...
                  </>
                ) : (
                  "Generate Roadmap"
                )}
              </button>
            </div>

            {error && (
              <div className="error-box" style={{ marginTop: "14px" }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="card page-enter">
            <div className="card-gradient-bar-warm" />
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SectionLabel>Analysis Results</SectionLabel>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportPdf}
                  disabled={pdfLoading}
                  style={{ fontSize: "11px", padding: "6px 14px" }}
                >
                  {pdfLoading ? "Exporting..." : "Download PDF"}
                </button>
              </div>

              {result.relevance_label === "low" && (
                <div className="roadmap-warning">
                  <strong>Low Relevance Warning:</strong> Your resume skills do not align well with these job descriptions.
                  The {result.jd_skills_detected} skills found in the JDs overlap with only {result.overlap_skills?.length || 0} of your resume skills
                  ({result.relevance_score}% match). This roadmap may not be useful for your career path.
                  Consider analyzing job descriptions that match your field (e.g., software engineering, data science).
                </div>
              )}

              <div className="roadmap-stat-grid">
                <div className="stat-card stat-card-mauve">
                  <div className="label">Readiness</div>
                  <div className="roadmap-stat-value" style={{ color: "var(--ctp-mauve)" }}>
                    {result.composite_readiness_score}%
                  </div>
                  <div className="progress-track" style={{ marginTop: "8px" }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(result.composite_readiness_score, 100)}%`,
                        background: "linear-gradient(90deg, var(--ctp-mauve), var(--ctp-blue))",
                      }}
                    />
                  </div>
                </div>

                <div className="stat-card stat-card-sky">
                  <div className="label">Postings Analyzed</div>
                  <div className="roadmap-stat-value" style={{ color: "var(--ctp-sky)" }}>
                    {result.postings_analyzed}
                  </div>
                  <div className="roadmap-stat-sub">
                    {result.jd_skills_detected} skills detected in JDs
                  </div>
                </div>

                <div className="stat-card" style={{
                  background: confStyle?.bg || "var(--ctp-surface0)",
                  borderColor: confStyle?.border || "var(--border-subtle)",
                }}>
                  <div className="label">Analysis Confidence</div>
                  <div className="roadmap-stat-value" style={{ fontSize: "14px", color: confStyle?.color || "var(--ctp-overlay0)" }}>
                    {confStyle?.label || "Unknown"}
                  </div>
                  <div className="roadmap-stat-sub">
                    Based on skill extraction density
                  </div>
                </div>

                <div className="stat-card" style={{
                  background: relStyle?.bg || "var(--ctp-surface0)",
                  borderColor: "var(--border-subtle)",
                }}>
                  <div className="label">Resume-JD Relevance</div>
                  <div className="roadmap-stat-value" style={{ color: relStyle?.color || "var(--ctp-overlay0)" }}>
                    {result.relevance_score}%
                  </div>
                  <div className="roadmap-stat-sub">
                    {result.overlap_skills?.length || 0} shared skills
                  </div>
                </div>
              </div>

              {result.charts?.demand && (
                <ChartImage
                  src={result.charts.demand}
                  alt="Skill Demand Chart"
                  title="Skill Demand Chart"
                  maxWidth="560px"
                />
              )}

              {result.charts?.relevance && (
                <ChartImage
                  src={result.charts.relevance}
                  alt="Relevance Pie Chart"
                  title="Relevance Score"
                  maxWidth="320px"
                />
              )}

              {result.per_posting_relevance && result.per_posting_relevance.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <SectionLabel>Per-Posting Relevance</SectionLabel>
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {result.per_posting_relevance.map((posting) => {
                      const pRel = posting.relevance_percentage;
                      const pColor = pRel >= 70 ? "var(--ctp-green)" : pRel >= 40 ? "var(--ctp-peach)" : "var(--ctp-red)";
                      return (
                        <div key={posting.posting_index} className="roadmap-posting-row">
                          <span className="roadmap-input-badge">
                            #{posting.posting_index}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div className="progress-track" style={{ height: "5px" }}>
                              <div
                                className="progress-fill"
                                style={{ width: `${pRel}%`, background: pColor }}
                              />
                            </div>
                          </div>
                          <span className="roadmap-posting-pct" style={{ color: pColor }}>
                            {posting.skills_matched}/{posting.skills_found} skills
                          </span>
                          <span className="roadmap-posting-pct-label" style={{ color: pColor }}>
                            {pRel}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.roadmap.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    background: "var(--accent-green-dim)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(166, 227, 161, 0.12)",
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--ctp-green)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginBottom: "12px" }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div style={{ color: "var(--ctp-green)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "14px" }}>
                    Your resume already covers all the required skills
                  </div>
                </div>
              ) : (
                <div>
                  <SectionLabel>Skills to Acquire</SectionLabel>
                  <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.roadmap.map((item, index) => (
                      <div key={item.skill} className="result-item">
                        <div className="roadmap-item-header">
                          <div className="roadmap-item-left">
                            <span className="roadmap-item-num">#{index + 1}</span>
                            <span className="tag tag-missing">{item.skill}</span>
                          </div>
                          <span className="roadmap-item-demand">{item.demand_percentage}%</span>
                        </div>

                        <div className="roadmap-item-explanation">
                          {item.explanation}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div className="progress-track" style={{ flex: 1, height: "6px" }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${item.demand_percentage}%`,
                                background: "linear-gradient(90deg, var(--ctp-peach), var(--ctp-red))",
                              }}
                            />
                          </div>
                          <span className="roadmap-item-postings">
                            {item.appears_in_postings}/{result.postings_analyzed}
                          </span>
                        </div>

                        {item.learning_links && (item.learning_links.docs_url || item.learning_links.youtube_url || item.learning_links.course_url) && (
                            <div style={{ marginTop: "12px" }}>
                              {item.learning_links.course_url && item.learning_links.course_name && (
                                <a
                                  href={item.learning_links.course_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "14px",
                                    padding: "14px 16px",
                                    background: "var(--ctp-surface0)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "10px",
                                    textDecoration: "none",
                                    marginBottom: "10px",
                                    transition: "border-color 0.2s, box-shadow 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "var(--ctp-green)";
                                    e.currentTarget.style.boxShadow = "0 0 20px rgba(166, 227, 161, 0.08)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                                    e.currentTarget.style.boxShadow = "none";
                                  }}
                                >
                                  <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, var(--ctp-green), var(--ctp-teal))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-crust)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                      <path d="M6 12v5c3 3 10 3 12 0v-5" />
                                    </svg>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ctp-text)", marginBottom: "3px", lineHeight: 1.3 }}>
                                      {item.learning_links.course_name}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--ctp-overlay1)", fontFamily: "var(--font-mono)" }}>
                                      {item.learning_links.course_provider}
                                    </div>
                                    {item.learning_links.certificate && (
                                      <div style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        marginTop: "6px",
                                        padding: "2px 8px",
                                        background: "rgba(166, 227, 161, 0.1)",
                                        border: "1px solid rgba(166, 227, 161, 0.2)",
                                        borderRadius: "4px",
                                        fontSize: "10px",
                                        color: "var(--ctp-green)",
                                        fontFamily: "var(--font-mono)",
                                        fontWeight: 600,
                                      }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Free Certificate
                                      </div>
                                    )}
                                  </div>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-overlay0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                                    <path d="M7 17L17 7" />
                                    <path d="M7 7h10v10" />
                                  </svg>
                                </a>
                              )}
                              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                {item.learning_links.docs_url && (
                                  <a
                                    href={item.learning_links.docs_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: "11px",
                                      color: "var(--ctp-sky)",
                                      textDecoration: "none",
                                      fontFamily: "var(--font-mono)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "4px 10px",
                                      background: "rgba(137, 180, 250, 0.06)",
                                      border: "1px solid rgba(137, 180, 250, 0.1)",
                                      borderRadius: "6px",
                                      transition: "border-color 0.2s",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(137, 180, 250, 0.3)"}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(137, 180, 250, 0.1)"}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                      <path d="M14 2v6h6" />
                                    </svg>
                                    Docs
                                  </a>
                                )}
                                {item.learning_links.youtube_url && (
                                  <a
                                    href={item.learning_links.youtube_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: "11px",
                                      color: "var(--ctp-red)",
                                      textDecoration: "none",
                                      fontFamily: "var(--font-mono)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "4px 10px",
                                      background: "rgba(243, 139, 168, 0.06)",
                                      border: "1px solid rgba(243, 139, 168, 0.1)",
                                      borderRadius: "6px",
                                      transition: "border-color 0.2s",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(243, 139, 168, 0.3)"}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(243, 139, 168, 0.1)"}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    YouTube
                                  </a>
                                )}
                              </div>
                            </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!result && !loading && (
          <EmptyState
            message="Add job descriptions and click Generate to see your roadmap"
            icon={
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ctp-overlay0)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            }
          />
        )}
      </div>
    </Layout>
  );
}
