import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import client from "../api/client";

export default function JobListings() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchMode, setMatchMode] = useState(false);
  const [allMatched, setAllMatched] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    client
      .get("/jobs/categories")
      .then((r) => setCategories((r.data.categories || []).slice(0, 20)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (matchMode) return;
    loadJobs();
  }, [page, tagFilter, matchMode]);

  async function loadJobs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("per_page", "20");
      if (search) params.set("q", search);
      if (tagFilter) params.set("tags", tagFilter);

      const r = await client.get(`/jobs?${params.toString()}`);
      setJobs(r.data.jobs || []);
      setTotal(r.data.total || 0);
      setTotalPages(r.data.total_pages || 1);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    if (matchMode) return;
    loadJobs();
  }

  async function toggleMatchMode() {
    if (matchMode) {
      setMatchMode(false);
      setPage(1);
      return;
    }

    const resumeId = localStorage.getItem("resume_id");
    if (!resumeId) {
      setMatchError("Upload a resume on the Dashboard first to enable matching.");
      return;
    }
    setMatchLoading(true);
    setMatchError("");
    try {
      const r = await client.post("/jobs/match", { resume_id: resumeId });
      if (r.data.error) {
        setMatchError(r.data.error);
        return;
      }
      setAllMatched(r.data.jobs || []);
      setMatchMode(true);
      setPage(1);
    } catch (err) {
      const msg = err.response?.data?.detail || "Match failed. Please try again.";
      setMatchError(msg);
    } finally {
      setMatchLoading(false);
    }
  }

  const filteredMatched = allMatched.filter((job) => {
    if (search) {
      const q = search.toLowerCase();
      const inTitle = job.title?.toLowerCase().includes(q);
      const inCompany = job.company?.toLowerCase().includes(q);
      const inTags = job.tags?.some((t) => t.toLowerCase().includes(q));
      if (!inTitle && !inCompany && !inTags) return false;
    }
    if (tagFilter) {
      const tf = tagFilter.toLowerCase();
      if (!job.tags?.some((t) => t.toLowerCase().includes(tf))) return false;
    }
    return true;
  });

  const perPage = 20;
  const matchTotal = filteredMatched.length;
  const matchTotalPages = Math.max(1, Math.ceil(matchTotal / perPage));
  const paginatedMatched = filteredMatched.slice((page - 1) * perPage, page * perPage);

  const displayJobs = matchMode ? paginatedMatched : jobs;
  const displayTotal = matchMode ? matchTotal : total;
  const displayTotalPages = matchMode ? matchTotalPages : totalPages;

  function formatPosted(val) {
    if (!val) return "";
    let ts;
    if (typeof val === "number" && val > 0) {
      ts = val > 1e12 ? val : val * 1000;
    } else {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "";
      ts = d.getTime();
    }
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  function isNewJob(val) {
    if (!val) return false;
    let ts;
    if (typeof val === "number" && val > 0) {
      ts = val > 1e12 ? val : val * 1000;
    } else {
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      ts = d.getTime();
    }
    return (Date.now() - ts) < 3 * 86400000;
  }

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ marginBottom: "32px" }}>
          <h1 className="section-title">Job Listings</h1>
          <p className="section-subtitle">
            Browse real remote jobs from across the web. Match against your resume skills.
          </p>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body">
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <input
                className="input-field"
                type="text"
                placeholder="Search jobs (e.g. react, python, devops)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" type="submit">
                Search
              </button>
              <button
                className={`btn ${matchMode ? "btn-primary" : "btn-secondary"}`}
                type="button"
                onClick={toggleMatchMode}
                disabled={matchLoading}
                style={matchMode ? { background: "var(--accent-green)", color: "var(--bg-base)" } : {}}
              >
                {matchLoading ? <><span className="spinner" /> Matching...</> : matchMode ? "Matching: ON" : "Match My Resume"}
              </button>
            </form>

            {categories.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <button
                  className={`btn ${!tagFilter ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "11px", padding: "6px 12px" }}
                  onClick={() => { setTagFilter(""); setPage(1); }}
                >
                  All
                </button>
                {categories.slice(0, 15).map((cat) => (
                  <button
                    key={cat.name}
                    className={`btn ${tagFilter === cat.name ? "btn-primary" : "btn-secondary"}`}
                    style={{ fontSize: "11px", padding: "6px 12px" }}
                    onClick={() => { setTagFilter(cat.name); setPage(1); }}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {matchError && (
          <div style={{
            marginBottom: "16px", padding: "12px 16px", borderRadius: "8px",
            background: "var(--accent-red-dim)", color: "var(--accent-red)",
            fontSize: "13px", fontFamily: "var(--font-mono)",
          }}>
            {matchError}
          </div>
        )}

        {matchMode && (
          <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="badge badge-green" style={{ fontSize: "11px" }}>
              Sorted by match score — {matchTotal} jobs matched
            </span>
          </div>
        )}

        {loading ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center", padding: "48px" }}>
              <span className="spinner" style={{ marginRight: "8px" }} />
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Loading jobs...
              </span>
            </div>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="card" style={{ opacity: 0.6 }}>
            <div className="card-body" style={{ textAlign: "center", padding: "48px" }}>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                No jobs found. Try a different search.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {displayTotal} jobs found
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {displayJobs.map((job) => (
                <div key={job.id} className="card job-card">
                  <div className="card-body" style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                            {job.title}
                          </span>
                          {matchMode && job.match_score != null && (
                            <span style={{
                              fontSize: "10px", padding: "2px 8px", borderRadius: "999px", fontWeight: 700,
                              background: job.match_score >= 50 ? "rgba(166, 227, 161, 0.15)" : job.match_score >= 20 ? "rgba(250, 179, 135, 0.15)" : "rgba(243, 139, 168, 0.12)",
                              color: job.match_score >= 50 ? "var(--ctp-green)" : job.match_score >= 20 ? "var(--ctp-peach)" : "var(--ctp-red)",
                              fontFamily: "var(--font-mono)",
                            }}>
                              {job.match_score}%
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                          {job.company}
                          <span style={{ margin: "0 6px", color: "var(--text-muted)" }}>·</span>
                          {job.location || "Remote"}
                          {job.salary && (
                            <>
                              <span style={{ margin: "0 6px", color: "var(--text-muted)" }}>·</span>
                              <span style={{ color: "var(--accent-gold)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                                {job.salary}
                              </span>
                            </>
                          )}
                        </div>

                        {job.tags && job.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                            {job.tags.slice(0, 8).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  background: "var(--bg-elevated)",
                                  color: "var(--text-secondary)",
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {job.tags.length > 8 && (
                              <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "2px 4px" }}>
                                +{job.tags.length - 8}
                              </span>
                            )}
                          </div>
                        )}

                        {job.matched_skills && job.matched_skills.length > 0 && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                            Matched: {job.matched_skills.map((s) => (
                              <span key={s} style={{ color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>{s}</span>
                            )).reduce((a, b) => [a, ", ", b])}
                          </div>
                        )}

                        {job.missing_skills && job.missing_skills.length > 0 && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                            Missing: {job.missing_skills.map((s) => (
                              <span key={s} style={{ color: "var(--ctp-peach)", fontFamily: "var(--font-mono)" }}>{s}</span>
                            )).reduce((a, b) => [a, ", ", b])}
                          </div>
                        )}

                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {isNewJob(job.posted_at) && (
                            <span style={{
                              fontSize: "9px", padding: "2px 7px", borderRadius: "999px",
                              background: "rgba(166, 227, 161, 0.15)", color: "var(--ctp-green)",
                              fontWeight: 700, marginRight: "8px",
                            }}>
                              NEW
                            </span>
                          )}
                          {formatPosted(job.posted_at)}
                          <span style={{ margin: "0 6px" }}>·</span>
                          {job.source}
                        </div>
                      </div>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ fontSize: "12px", padding: "8px 20px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
                      >
                        Apply
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {displayTotalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "12px" }}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </button>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", padding: "8px 12px" }}>
                  {page} / {displayTotalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "12px" }}
                  disabled={page >= displayTotalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
