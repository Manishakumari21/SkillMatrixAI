import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import client from "../api/client";
import { PageHeader, SectionLabel, EmptyState, ApiKeyBanner } from "../components/shared";

export default function Portfolio() {
  const [form, setForm] = useState({
    full_name: "",
    title: "Software Engineer",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    website: "",
    about_me: "",
    education: "",
    projects: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    loadPortfolios();
  }, []);

  async function loadPortfolios() {
    try {
      const res = await client.get("/portfolio/list");
      setPortfolios(res.data);
    } catch {
      // ignore
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function buildPayload() {
    return {
      full_name: form.full_name,
      title: form.title,
      email: form.email,
      phone: form.phone,
      linkedin: form.linkedin,
      github: form.github,
      website: form.website,
      about_me: form.about_me,
      education: form.education,
      projects: form.projects,
    };
  }

  async function handlePreview() {
    if (!form.full_name) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await client.post("/portfolio/preview", buildPayload());
      setResult(res.data);
      setActiveTab("preview");
    } catch {
      setError("Could not generate preview. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAndDownload() {
    if (!form.full_name) {
      setError("Name is required");
      return;
    }
    setDownloading(true);
    setError("");
    try {
      const res = await client.post("/portfolio/download-live", buildPayload(), {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${form.full_name.replace(/\s+/g, "_")}_Portfolio.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      loadPortfolios();
    } catch {
      setError("Could not download PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadSaved(portfolioId, name) {
    try {
      const res = await client.post(`/portfolio/download/${portfolioId}`, {}, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${name.replace(/\s+/g, "_")}_Portfolio.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Could not delete portfolio.");
    }
  }

  async function handleDelete(portfolioId) {
    try {
      await client.delete(`/portfolio/${portfolioId}`);
      setPortfolios((prev) => prev.filter((p) => p.portfolio_id !== portfolioId));
    } catch {
      setError("Could not delete portfolio.");
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <Layout>
      <div className="page-enter">
        <PageHeader
          title="Portfolio Generator"
          subtitle="Auto-generate a professional portfolio PDF. Pulls skills from your uploaded resume."
        />

        <ApiKeyBanner />

        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {["create", "preview", "my-portfolios"].map((tab) => (
            <button
              key={tab}
              className="btn"
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: "12px",
                padding: "8px 16px",
                fontWeight: activeTab === tab ? 600 : 400,
                background:
                  activeTab === tab
                    ? "var(--accent-mauve-dim)"
                    : "var(--ctp-surface0)",
                color:
                  activeTab === tab
                    ? "var(--ctp-mauve)"
                    : "var(--ctp-overlay1)",
                border: `1px solid ${activeTab === tab ? "rgba(203, 166, 247, 0.2)" : "var(--border-default)"}`,
                textTransform: "capitalize",
              }}
            >
              {tab === "my-portfolios" ? "My Portfolios" : tab}
            </button>
          ))}
        </div>

        {activeTab === "create" && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-body">
              <SectionLabel color="var(--ctp-mauve)" marginBottom="16px">
                Personal Information
              </SectionLabel>
              <div className="form-grid">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className="input-field"
                    placeholder="Jane Smith"
                    value={form.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Title</label>
                  <input
                    className="input-field"
                    placeholder="Software Engineer"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="jane@email.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input-field"
                    placeholder="+1 (555) 123-4567"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">LinkedIn</label>
                  <input
                    className="input-field"
                    placeholder="linkedin.com/in/janesmith"
                    value={form.linkedin}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">GitHub</label>
                  <input
                    className="input-field"
                    placeholder="github.com/janesmith"
                    value={form.github}
                    onChange={(e) => updateField("github", e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Website</label>
                  <input
                    className="input-field"
                    placeholder="janesmith.dev"
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                  />
                </div>
              </div>

              <SectionLabel color="var(--ctp-blue)">
                About Me
              </SectionLabel>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Brief professional bio — or leave blank for AI-generated content..."
                value={form.about_me}
                onChange={(e) => updateField("about_me", e.target.value)}
                style={{ resize: "vertical" }}
              />

              <SectionLabel color="var(--ctp-green)">
                Education
              </SectionLabel>
              <textarea
                className="input-field"
                rows={2}
                placeholder="B.S. Computer Science, MIT 2024 — GPA: 3.8"
                value={form.education}
                onChange={(e) => updateField("education", e.target.value)}
                style={{ resize: "vertical" }}
              />

              <SectionLabel color="var(--ctp-peach)">
                Projects
              </SectionLabel>
              <textarea
                className="input-field"
                rows={3}
                placeholder={"Project 1: Description...\nProject 2: Description... (or leave blank for AI-generated from resume)"}
                value={form.projects}
                onChange={(e) => updateField("projects", e.target.value)}
                style={{ resize: "vertical" }}
              />

              <div className="form-hint">
                Skills are auto-extracted from your uploaded resume. Fill in optional fields to override AI content.
              </div>

              {error && (
                <div className="error-box" style={{ marginTop: "14px" }}>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handlePreview}
                  disabled={loading || !form.full_name}
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Generating...
                    </>
                  ) : (
                    "Preview Portfolio"
                  )}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateAndDownload}
                  disabled={downloading || !form.full_name}
                  style={{ background: "var(--ctp-green)", color: "var(--ctp-crust)" }}
                >
                  {downloading ? (
                    <>
                      <span className="spinner" /> Generating PDF...
                    </>
                  ) : (
                    "Generate & Download PDF"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preview" && result && (
          <div className="card page-enter" style={{ marginBottom: "24px" }}>
            <div className="card-gradient-bar" />
            <div className="card-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div className="label" style={{ marginBottom: 0 }}>
                  Portfolio Preview
                </div>
                <span className="tag tag-mauve" style={{ fontSize: "10px" }}>
                  {result._source || "generated"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div
                  style={{
                    flex: "0 0 280px",
                    background: "#1e1e2e",
                    borderRadius: "var(--radius-md)",
                    padding: "28px 22px",
                    color: "#e0def4",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "var(--ctp-mauve)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#1e1e2e",
                      margin: "0 auto 16px",
                    }}
                  >
                    {(form.full_name || "U")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ textAlign: "center", fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
                    {form.full_name}
                  </div>
                  <div style={{ textAlign: "center", fontSize: "12px", color: "var(--ctp-mauve)", marginBottom: "16px" }}>
                    {form.title}
                  </div>

                  <div style={{ height: "1px", background: "rgba(203, 166, 247, 0.2)", margin: "12px 0" }} />
                  <div style={{ fontSize: "8px", color: "var(--ctp-mauve)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: 700 }}>
                    Contact
                  </div>
                  {form.email && (
                    <div style={{ fontSize: "11px", marginBottom: "4px", color: "#a6adc8" }}>
                      {form.email}
                    </div>
                  )}
                  {form.phone && (
                    <div style={{ fontSize: "11px", marginBottom: "4px", color: "#a6adc8" }}>
                      {form.phone}
                    </div>
                  )}
                  {form.linkedin && (
                    <div style={{ fontSize: "11px", marginBottom: "4px", color: "#a6adc8" }}>
                      {form.linkedin}
                    </div>
                  )}
                  {form.github && (
                    <div style={{ fontSize: "11px", marginBottom: "4px", color: "#a6adc8" }}>
                      {form.github}
                    </div>
                  )}

                  {result.education?.length > 0 && (
                    <>
                      <div style={{ height: "1px", background: "rgba(203, 166, 247, 0.2)", margin: "12px 0" }} />
                      <div style={{ fontSize: "8px", color: "var(--ctp-mauve)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: 700 }}>
                        Education
                      </div>
                      {result.education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: "8px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 600 }}>{edu.degree}</div>
                          {edu.school && (
                            <div style={{ fontSize: "10px", color: "#a6adc8" }}>{edu.school}</div>
                          )}
                          {edu.year && (
                            <div style={{ fontSize: "10px", color: "#6c7086" }}>{edu.year}</div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {result.skills && (
                    <>
                      <div style={{ height: "1px", background: "rgba(203, 166, 247, 0.2)", margin: "12px 0" }} />
                      <div style={{ fontSize: "8px", color: "var(--ctp-mauve)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: 700 }}>
                        Skills
                      </div>
                      {typeof result.skills === "object" && !Array.isArray(result.skills)
                        ? Object.entries(result.skills).map(([cat, items]) => (
                            <div key={cat} style={{ marginBottom: "8px" }}>
                              <div style={{ fontSize: "9px", color: "var(--ctp-mauve)", fontWeight: 600, marginBottom: "3px" }}>
                                {cat}
                              </div>
                              <div style={{ fontSize: "10px", color: "#a6adc8", lineHeight: 1.5 }}>
                                {items.join(", ")}
                              </div>
                            </div>
                          ))
                        : Array.isArray(result.skills) && (
                            <div style={{ fontSize: "10px", color: "#a6adc8", lineHeight: 1.5 }}>
                              {result.skills.join(", ")}
                            </div>
                          )}
                    </>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: "300px" }}>
                  {result.about_me && (
                    <div style={{ marginBottom: "24px" }}>
                      <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ctp-mauve)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
                        About Me
                      </div>
                      <div style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--ctp-subtext0)" }}>
                        {result.about_me}
                      </div>
                    </div>
                  )}

                  {result.projects?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ctp-mauve)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
                        Projects
                      </div>
                      {result.projects.map((proj, i) => (
                        <div
                          key={i}
                          style={{
                            marginBottom: "16px",
                            padding: "16px",
                            background: "var(--ctp-surface0)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--ctp-text)", marginBottom: "4px" }}>
                            {proj.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--ctp-subtext0)", lineHeight: 1.6, marginBottom: "6px" }}>
                            {proj.description}
                          </div>
                          {proj.tech?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {proj.tech.map((t) => (
                                <span key={t} className="tag tag-matched" style={{ fontSize: "10px" }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateAndDownload}
                  disabled={downloading}
                  style={{ background: "var(--ctp-green)", color: "var(--ctp-crust)" }}
                >
                  {downloading ? (
                    <>
                      <span className="spinner" /> Generating PDF...
                    </>
                  ) : (
                    "Download as PDF"
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveTab("create")}
                >
                  Edit Details
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preview" && !result && (
          <EmptyState message="No preview yet. Go to Create tab and click Preview Portfolio." />
        )}

        {activeTab === "my-portfolios" && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-body">
              <SectionLabel color="var(--ctp-mauve)" marginBottom="20px">
                Saved Portfolios ({portfolios.length})
              </SectionLabel>

              {portfolios.length === 0 ? (
                <div className="portfolio-empty">
                  No portfolios generated yet. Create your first one.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {portfolios.map((p) => (
                    <div key={p.portfolio_id} className="portfolio-item">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ctp-text)" }}>
                          {p.full_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--ctp-overlay0)", fontFamily: "var(--font-mono)" }}>
                          {p.title} · {formatDate(p.generated_at)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: "11px", padding: "6px 12px" }}
                          onClick={() => handleDownloadSaved(p.portfolio_id, p.full_name)}
                        >
                          Download PDF
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: "11px", padding: "6px 12px" }}
                          onClick={() => handleDelete(p.portfolio_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
