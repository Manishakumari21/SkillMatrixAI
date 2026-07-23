import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { PolarArea } from "react-chartjs-2";
import Layout from "../components/Layout";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_COLORS = {
  matched: { bar: "var(--ctp-green)", bg: "rgba(166, 227, 161, 0.12)", text: "var(--ctp-green)" },
  semantic: { bar: "var(--ctp-sky)", bg: "rgba(137, 180, 250, 0.12)", text: "var(--ctp-sky)" },
  missing: { bar: "var(--ctp-red)", bg: "rgba(243, 139, 168, 0.12)", text: "var(--ctp-red)" },
};

const CONFIDENCE_BADGE = {
  exact: { label: "Exact Match", color: "var(--ctp-green)", bg: "rgba(166, 227, 161, 0.15)" },
  high: { label: "High Confidence", color: "var(--ctp-sky)", bg: "rgba(137, 180, 250, 0.15)" },
  moderate: { label: "Moderate Match", color: "var(--ctp-peach)", bg: "rgba(250, 179, 135, 0.15)" },
  none: { label: "No Match", color: "var(--ctp-red)", bg: "rgba(243, 139, 168, 0.15)" },
};

export default function SkillGap() {
  const { token } = useAuth();
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("semantic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resources, setResources] = useState([]);
  const [learnedSkills, setLearnedSkills] = useState([]);

  useEffect(() => {
    if (!token) return;
    client
      .get("/progress")
      .then((r) => setLearnedSkills(r.data.learned_skills || []))
      .catch(() => {});
  }, [token]);

  async function handleCompare() {
    const resumeId = localStorage.getItem("resume_id");

    if (!resumeId) {
      setError("Upload a resume on the dashboard first");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Paste a job description first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setResources([]);

    const endpoint =
      mode === "semantic"
        ? "/skill-gap/compare-semantic"
        : "/skill-gap/compare";

    try {
      const response = await client.post(endpoint, {
        resume_id: resumeId,
        job_description: jobDescription,
      });
      setResult(response.data);

      if (response.data.missing_skills && response.data.missing_skills.length > 0) {
        client
          .post("/learning-resources", { skills: response.data.missing_skills })
          .then((r) => setResources(r.data.resources || []))
          .catch(() => {});
      }
    } catch (err) {
      setError("Could not compare, check that your resume is uploaded");
    } finally {
      setLoading(false);
    }
  }

  async function handleLearnSkill(skill) {
    try {
      await client.post("/progress/learn-skill", { skill });
      setLearnedSkills((prev) => [...prev, skill]);
    } catch {}
  }

  async function handleUnlearnSkill(skill) {
    try {
      await client.post("/progress/unlearn-skill", { skill });
      setLearnedSkills((prev) => prev.filter((s) => s !== skill));
    } catch {}
  }

  const chartData = result?.skill_details
    ? {
        labels: result.skill_details.slice(0, 12).map((d) => d.skill),
        datasets: [
          {
            data: result.skill_details.slice(0, 12).map((d) => d.match_percentage),
            backgroundColor: result.skill_details.slice(0, 12).map((d) => {
              if (d.status === "matched") return "rgba(166, 227, 161, 0.55)";
              if (d.status === "semantic") return "rgba(137, 180, 250, 0.55)";
              return "rgba(243, 139, 168, 0.35)";
            }),
            borderColor: result.skill_details.slice(0, 12).map((d) => {
              if (d.status === "matched") return "rgba(166, 227, 161, 0.9)";
              if (d.status === "semantic") return "rgba(137, 180, 250, 0.9)";
              return "rgba(243, 139, 168, 0.7)";
            }),
            borderWidth: 1.5,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          color: "rgba(186, 194, 222, 0.4)",
          backdropColor: "transparent",
          font: { size: 9, family: "var(--font-mono)" },
        },
        grid: {
          color: "rgba(186, 194, 222, 0.08)",
        },
        pointLabels: {
          color: "rgba(186, 194, 222, 0.7)",
          font: { size: 10, family: "var(--font-mono)" },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(30, 30, 46, 0.95)",
        titleColor: "#cdd6f4",
        bodyColor: "#bac2de",
        borderColor: "rgba(186, 194, 222, 0.15)",
        borderWidth: 1,
        titleFont: { family: "var(--font-mono)", size: 12 },
        bodyFont: { family: "var(--font-mono)", size: 11 },
        callbacks: {
          label: (ctx) => `${ctx.parsed.r}% match`,
        },
      },
    },
  };

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ marginBottom: "32px" }}>
          <h1 className="section-title">Skill Gap Analysis</h1>
          <p className="section-subtitle">
            Compare your resume against a job description to find missing
            skills. Each skill shows its match confidence and actionable next steps.
          </p>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body">
            <div className="label">Job Description</div>
            <textarea
              className="input-field"
              rows={6}
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ marginBottom: "20px", resize: "vertical" }}
            />

            <div style={{ marginBottom: "20px" }}>
              <div className="label">Analysis Mode</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { key: "exact", label: "Exact Match", desc: "keyword only" },
                  { key: "semantic", label: "Semantic Match", desc: "embeddings based" },
                ].map((m) => (
                  <button
                    key={m.key}
                    className={`btn ${mode === m.key ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setMode(m.key)}
                    style={{ fontSize: "12px", padding: "10px 18px" }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCompare}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Analyzing...
                </>
              ) : (
                "Compare Skills"
              )}
            </button>

            {error && (
              <div className="error-box" style={{ marginTop: "14px" }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="card page-enter">
            <div className="card-gradient-bar" />
            <div className="card-body">
              <div className="label">Overall Match Score</div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "60px",
                    fontWeight: 800,
                    lineHeight: 1,
                    background:
                      "linear-gradient(135deg, var(--ctp-mauve), var(--ctp-blue))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {result.match_percentage}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "22px",
                    color: "var(--ctp-overlay0)",
                  }}
                >
                  %
                </span>
              </div>

              <div
                className="progress-track"
                style={{ maxWidth: "300px", marginBottom: "32px", height: "6px" }}
              >
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(result.match_percentage, 100)}%`,
                    background:
                      "linear-gradient(90deg, var(--ctp-mauve), var(--ctp-blue))",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: result.semantic_matches
                    ? "1fr 1fr 1fr"
                    : "1fr 1fr",
                  gap: "12px",
                  marginBottom: "32px",
                }}
              >
                <div className="stat-card stat-card-green">
                  <div className="label">Exact Matched</div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "30px",
                      fontWeight: 700,
                      color: "var(--ctp-green)",
                      marginTop: "4px",
                    }}
                  >
                    {result.matched_skills.length}
                  </div>
                </div>
                {result.semantic_matches && (
                  <div className="stat-card stat-card-sky">
                    <div className="label">Semantic Match</div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "30px",
                        fontWeight: 700,
                        color: "var(--ctp-sky)",
                        marginTop: "4px",
                      }}
                    >
                      {result.semantic_matches.length}
                    </div>
                  </div>
                )}
                <div className="stat-card stat-card-red">
                  <div className="label">Missing</div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "30px",
                      fontWeight: 700,
                      color: "var(--ctp-red)",
                      marginTop: "4px",
                    }}
                  >
                    {result.missing_skills.length}
                  </div>
                </div>
              </div>

              {result.coverage && (
                <div
                  style={{
                    padding: "16px",
                    background: "var(--ctp-surface0)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    marginBottom: "28px",
                  }}
                >
                  <div
                    className="label"
                    style={{ marginBottom: "12px" }}
                  >
                    Coverage Summary
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "12px",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--ctp-overlay0)" }}>Job Skills: </span>
                      <span style={{ color: "var(--ctp-text)" }}>{result.coverage.total_job_skills}</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--ctp-overlay0)" }}>Resume Skills: </span>
                      <span style={{ color: "var(--ctp-text)" }}>{result.coverage.total_resume_skills}</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--ctp-overlay0)" }}>Coverage: </span>
                      <span style={{ color: result.coverage.coverage_ratio >= 0.6 ? "var(--ctp-green)" : "var(--ctp-peach)" }}>
                        {(result.coverage.coverage_ratio * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {result.charts?.coverage && (
                <div style={{ marginBottom: "28px" }}>
                  <div className="label">Skill Coverage Breakdown</div>
                  <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
                    <img
                      src={`data:image/png;base64,${result.charts.coverage}`}
                      alt="Skill Coverage Chart"
                      style={{ maxWidth: "420px", width: "100%", height: "auto", borderRadius: "var(--radius-md)" }}
                    />
                  </div>
                </div>
              )}

              {result.charts?.radar && (
                <div style={{ marginBottom: "28px" }}>
                  <div className="label">Skill Radar</div>
                  <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
                    <img
                      src={`data:image/png;base64,${result.charts.radar}`}
                      alt="Skill Radar Chart"
                      style={{ maxWidth: "420px", width: "100%", height: "auto", borderRadius: "var(--radius-md)" }}
                    />
                  </div>
                </div>
              )}

              {result.charts?.skill_bars && (
                <div style={{ marginBottom: "28px" }}>
                  <div className="label">Per-Skill Match</div>
                  <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
                    <img
                      src={`data:image/png;base64,${result.charts.skill_bars}`}
                      alt="Skill Match Bars"
                      style={{ maxWidth: "560px", width: "100%", height: "auto", borderRadius: "var(--radius-md)" }}
                    />
                  </div>
                </div>
              )}

              {chartData && result.skill_details.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <div className="label">Skill Coverage Chart (Interactive)</div>
                  <div
                    style={{
                      marginTop: "12px",
                      height: "280px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <PolarArea data={chartData} options={chartOptions} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      justifyContent: "center",
                      marginTop: "12px",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--ctp-overlay0)",
                    }}
                  >
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--ctp-green)",
                          marginRight: "4px",
                        }}
                      />
                      Exact Match
                    </span>
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--ctp-sky)",
                          marginRight: "4px",
                        }}
                      />
                      Semantic Match
                    </span>
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--ctp-red)",
                          marginRight: "4px",
                        }}
                      />
                      Missing
                    </span>
                  </div>
                </div>
              )}

              {result.skill_details && result.skill_details.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <div className="label">Skill-by-Skill Breakdown</div>
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {result.skill_details.map((detail) => {
                      const colors = STATUS_COLORS[detail.status];
                      const badge = CONFIDENCE_BADGE[detail.confidence];
                      return (
                        <div
                          key={detail.skill}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 14px",
                            background: colors.bg,
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${colors.bar}22`,
                          }}
                        >
                          <span
                            className={`tag tag-${detail.status === "matched" ? "matched" : detail.status === "semantic" ? "semantic" : "missing"}`}
                            style={{ minWidth: "90px", textAlign: "center" }}
                          >
                            {detail.skill}
                          </span>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="progress-track"
                              style={{ height: "6px", marginBottom: "4px" }}
                            >
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${detail.match_percentage}%`,
                                  background: colors.bar,
                                }}
                              />
                            </div>
                          </div>

                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "13px",
                              fontWeight: 700,
                              color: colors.text,
                              minWidth: "48px",
                              textAlign: "right",
                            }}
                          >
                            {detail.match_percentage}%
                          </span>

                          <span
                            style={{
                              fontSize: "10px",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              color: badge.color,
                              background: badge.bg,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {badge.label}
                          </span>

                          {detail.matched_via && (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--ctp-overlay0)",
                                fontFamily: "var(--font-mono)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              via {detail.matched_via}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.missing_skills.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <div className="label">Missing Skills - Action Required</div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "10px",
                    }}
                  >
                    {result.missing_skills.map((s) => (
                      <div
                        key={s}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 14px",
                          background: "rgba(243, 139, 168, 0.08)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid rgba(243, 139, 168, 0.12)",
                        }}
                      >
                        <span className="tag tag-missing">{s}</span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--ctp-overlay0)",
                            fontStyle: "italic",
                            flex: 1,
                          }}
                        >
                          Critical gap - learn this to improve your match score
                        </span>
                        {learnedSkills.includes(s) ? (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: "10px", padding: "4px 12px" }}
                            onClick={() => handleUnlearnSkill(s)}
                          >
                            Unmark
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: "10px", padding: "4px 12px" }}
                            onClick={() => handleLearnSkill(s)}
                          >
                            Mark Learned
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resources.length > 0 && (
                <div>
                  <div className="label">Learning Resources</div>
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {resources.map((r) => (
                      <div key={r.skill} className="result-item">
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "13px",
                            color: "var(--ctp-mauve)",
                            fontWeight: 600,
                            marginBottom: "8px",
                          }}
                        >
                          {r.skill}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <a
                            href={r.docs_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "12px",
                              color: "var(--ctp-sky)",
                              textDecoration: "none",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            Docs
                          </a>
                          <a
                            href={r.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "12px",
                              color: "var(--ctp-red)",
                              textDecoration: "none",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            YouTube
                          </a>
                          <a
                            href={r.course_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "12px",
                              color: "var(--ctp-green)",
                              textDecoration: "none",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            Course
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!result && (
          <div className="card" style={{ opacity: 0.6 }}>
            <div
              className="card-body"
              style={{ textAlign: "center", padding: "48px" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ctp-overlay0)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "12px" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div style={{ fontSize: "13px", color: "var(--ctp-overlay0)" }}>
                Paste a job description and click Compare to see results
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
