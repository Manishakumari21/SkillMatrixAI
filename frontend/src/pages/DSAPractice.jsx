import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import client from "../api/client";
import { DIFF_COLORS } from "../components/shared/DifficultyBadge";
import { LANG_SAMPLES, LS_KEY } from "../components/dsa/constants";
import LanguageBar from "../components/dsa/LanguageBar";
import CodeEditor from "../components/dsa/CodeEditor";
import RunResults from "../components/dsa/RunResults";
import ProblemDescription from "../components/dsa/ProblemDescription";
import ProblemCard from "../components/dsa/ProblemCard";

export default function DSAPractice() {
  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem(LS_KEY) || "python3");
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const isDraggingSplit = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    client.get("/dsa/categories").then((r) => setCategories(r.data.categories || [])).catch(() => {});
  }, []);
  useEffect(() => { loadProblems(); }, [activeCategory, activeDifficulty]);
  useEffect(() => { if (selected) { setCode(LANG_SAMPLES[lang] || LANG_SAMPLES.python3); setRunResult(null); } }, [selected, lang]);
  useEffect(() => { localStorage.setItem(LS_KEY, lang); }, [lang]);

  async function loadProblems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (activeDifficulty) params.set("difficulty", activeDifficulty);
      if (search) params.set("q", search);
      const r = await client.get(`/dsa?${params.toString()}`);
      setProblems(r.data.problems || []);
    } catch { setProblems([]); } finally { setLoading(false); }
  }

  function handleSearch(e) { e.preventDefault(); loadProblems(); }
  function handleSearchChange(val) { setSearch(val); if (val.trim() === "") loadProblems(); }

  async function handleRun() {
    if (!selected || !code.trim()) return;
    setRunning(true); setRunResult(null);
    try {
      const r = await client.post("/dsa/run", { problem_id: selected.id, code, language: lang });
      setRunResult(r.data);
    } catch { setRunResult({ error: "Failed to run code" }); } finally { setRunning(false); }
  }

  async function selectProblem(p) {
    if (selected?.id === p.id) { setSelected(null); setRunResult(null); return; }
    setRunResult(null);
    try { const r = await client.get(`/dsa/${p.id}`); setSelected(r.data); } catch { setSelected(p); }
  }

  const handleSplitMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingSplit.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev) => {
      if (!isDraggingSplit.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSplitRatio(Math.min(Math.max(((ev.clientX - rect.left) / rect.width) * 100, 25), 75));
    };
    const onUp = () => {
      isDraggingSplit.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  return (
    <Layout>
      <div className="page-enter">
        <div style={{ marginBottom: "32px" }}>
          <h1 className="section-title">DSA Practice</h1>
          <p className="section-subtitle">Practice data structures and algorithms. Write code, run against test cases, and learn.</p>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-body">
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <input className="input-field" type="text" placeholder="Search (e.g. array, linked list, two sum, tree)..."
                value={search} onChange={(e) => handleSearchChange(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-primary" type="submit">Search</button>
            </form>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              <button className={`btn ${!activeCategory ? "btn-primary" : "btn-secondary"}`}
                style={{ fontSize: "11px", padding: "6px 12px" }}
                onClick={() => setActiveCategory("")}>
                All ({categories.reduce((a, c) => a + c.count, 0)})
              </button>
              {categories.map((cat) => (
                <button key={cat.name} className={`btn ${activeCategory === cat.name ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "11px", padding: "6px 12px" }}
                  onClick={() => setActiveCategory(activeCategory === cat.name ? "" : cat.name)}>
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["Easy", "Medium", "Hard"].map((d) => (
                <button key={d} className={`btn ${activeDifficulty === d ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "11px", padding: "6px 14px", color: activeDifficulty === d ? DIFF_COLORS[d].color : undefined }}
                  onClick={() => setActiveDifficulty(activeDifficulty === d ? "" : d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selected ? (
          <div ref={containerRef} style={{ display: "flex", gap: "0", alignItems: "start", minHeight: "calc(100vh - 220px)" }}>
            <div style={{ width: `${splitRatio}%`, minWidth: 0, paddingRight: "10px" }}>
              <ProblemDescription problem={selected} onBack={() => setSelected(null)} />
            </div>
            <div onMouseDown={handleSplitMouseDown} style={{
              width: "6px", cursor: "col-resize", background: "transparent", borderRadius: "3px",
              flexShrink: 0, position: "relative", zIndex: 10, alignSelf: "stretch",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-iris)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                width: "2px", height: "40px", background: "var(--ctp-overlay0)", borderRadius: "1px",
              }} />
            </div>
            <div style={{ width: `${100 - splitRatio}%`, minWidth: 0, paddingLeft: "10px" }}>
              <div className="card" style={{ marginBottom: "16px" }}>
                <div className="card-body" style={{ padding: 0 }}>
                  <LanguageBar lang={lang} setLang={setLang} />
                  <CodeEditor code={code} setCode={setCode} language={lang} />
                  <div style={{ display: "flex", gap: "8px", padding: "14px 16px", borderTop: "1px solid var(--border-subtle)", background: "rgba(19, 17, 36, 0.3)" }}>
                    <button className="btn btn-primary" onClick={handleRun} disabled={running} style={{ flex: 1 }}>
                      {running ? <><span className="spinner" /> Running...</> : "▶ Run & Check"}
                    </button>
                  </div>
                </div>
              </div>
              <RunResults runResult={runResult} />
            </div>
          </div>
        ) : loading ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center", padding: "48px" }}><span className="spinner" /></div>
          </div>
        ) : problems.length === 0 ? (
          <div className="card" style={{ opacity: 0.6 }}>
            <div className="card-body" style={{ textAlign: "center", padding: "48px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ctp-overlay0)" strokeWidth="1.5" style={{ marginBottom: "12px" }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div style={{ fontSize: "13px", color: "var(--ctp-overlay0)" }}>No problems found. Try a different search.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
            {problems.map((p) => <ProblemCard key={p.id} problem={p} onClick={() => selectProblem(p)} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
