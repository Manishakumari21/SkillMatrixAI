import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  useEffect(() => {
    if (!token) return;
    client.get("/progress")
      .then((r) => setProgress(r.data))
      .catch(() => {});
  }, [token]);

  function handleFileChange(e) {
    setFile(e.target.files[0]);
    setResult(null);
    setError("");
  }

  async function handleUpload() {
    if (!file) { setError("Choose a PDF file first"); return; }
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await client.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
      localStorage.setItem("resume_id", response.data.resume_id);

      client.get("/progress").then((r) => setProgress(r.data)).catch(() => {});
    } catch (err) {
      setError("Could not upload this resume, try a different PDF");
    } finally {
      setUploading(false);
    }
  }

  const statCards = progress
    ? [
        { label: "Resumes", value: progress.resume_count, color: "var(--ctp-mauve)", cardClass: "stat-card-mauve",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-mauve)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg> },
        { label: "Gap Analyses", value: progress.gap_analyses_count, color: "var(--ctp-sky)", cardClass: "stat-card-sky",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-sky)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg> },
        { label: "Skills Learned", value: progress.learned_skills.length, color: "var(--ctp-green)", cardClass: "stat-card-green",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
        { label: "Interview Qs", value: progress.interview_questions_count, color: "var(--ctp-peach)", cardClass: "stat-card-peach",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-peach)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
      ]
    : [];

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ marginBottom: "32px" }}>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">
            Upload your resume to extract skills and check your ATS score.
          </p>
        </div>

        {progress && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
            {statCards.map((card) => (
              <div key={card.label} className={`stat-card ${card.cardClass}`}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div className="label" style={{ margin: 0 }}>{card.label}</div>
                  {card.icon}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "30px", fontWeight: 700, color: card.color }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body">
            <div className="label" style={{ marginBottom: "16px", fontSize: "11px" }}>Upload Resume</div>
            <div
              style={{
                border: "2px dashed rgba(203, 166, 247, 0.15)", borderRadius: "var(--radius-md)",
                padding: "48px 32px", textAlign: "center",
                background: file ? "rgba(203, 166, 247, 0.03)" : "transparent",
                transition: "all 0.3s ease", cursor: "pointer",
              }}
              onClick={() => document.getElementById("file-input").click()}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(203, 166, 247, 0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(203, 166, 247, 0.15)"; }}
            >
              <input id="file-input" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: "none" }} />
              {file ? (
                <div>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-mauve)" strokeWidth="1.5" style={{ marginBottom: "16px", opacity: 0.7 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>
                  </svg>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ctp-mauve)", fontWeight: 500 }}>{file.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--ctp-overlay0)", marginTop: "6px" }}>{(file.size / 1024).toFixed(1)} KB — Click to change</div>
                </div>
              ) : (
                <div>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-overlay0)" strokeWidth="1.5" style={{ marginBottom: "16px" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div style={{ fontSize: "14px", color: "var(--ctp-subtext0)", fontWeight: 500 }}>Drop your resume here or click to browse</div>
                  <div style={{ fontSize: "12px", color: "var(--ctp-overlay0)", marginTop: "6px" }}>PDF files only</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !file}>
                {uploading ? <><span className="spinner" /> Extracting skills...</> : "Upload & Analyze"}
              </button>
              {file && !uploading && !result && (
                <span style={{ fontSize: "12px", color: "var(--ctp-overlay0)", fontFamily: "var(--font-mono)" }}>Ready to upload</span>
              )}
            </div>
            {error && <div className="error-box" style={{ marginTop: "14px" }}>{error}</div>}
          </div>
        </div>

        {result && (
          <div className="card page-enter" style={{ marginBottom: "24px" }}>
            <div className="card-gradient-bar-cool" />
            <div className="card-body">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <span className="badge badge-green" style={{ fontSize: "11px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--ctp-green)" }} />
                  Skills extracted successfully
                </span>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                <div className="stat-card stat-card-mauve" style={{ flex: 1 }}>
                  <div className="label">Method</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ctp-mauve)", marginTop: "4px" }}>{result.extraction_method}</div>
                </div>
                <div className="stat-card stat-card-green" style={{ flex: 1 }}>
                  <div className="label">Skills Found</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "30px", fontWeight: 700, color: "var(--ctp-green)", marginTop: "4px" }}>{result.skills_count}</div>
                </div>
              </div>

              {result.low_confidence && (
                <div className="warning-box" style={{ marginBottom: "20px" }}>Few skills found. Consider uploading a more detailed resume.</div>
              )}

              <div className="label">Detected Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                {result.skills_found.map((skill) => (
                  <span key={skill} className="tag tag-matched">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!result && (
          <div className="card" style={{ opacity: 0.6 }}>
            <div className="card-body" style={{ textAlign: "center", padding: "48px" }}>
              <div style={{ marginBottom: "12px" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-overlay0)" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
                </svg>
              </div>
              <div style={{ fontSize: "13px", color: "var(--ctp-overlay0)" }}>Upload a resume to extract skills and see results</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
