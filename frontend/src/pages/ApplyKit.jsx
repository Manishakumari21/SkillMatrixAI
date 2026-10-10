import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import client from "../api/client";
import { PageHeader, SectionLabel, EmptyState, LoadingButton, StatCard } from "../components/shared";

const TABS = ["Applications", "Autofill Profile", "Question Helper", "HR Outreach"];
const STATUSES = ["saved", "applied", "interview", "offer", "rejected"];

const card = {
  background: "rgba(25, 23, 36, 0.85)",
  border: "1px solid rgba(196, 167, 231, 0.1)",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "16px",
};
const inputStyle = {
  width: "100%", background: "#191724", border: "1px solid rgba(196,167,231,0.15)",
  borderRadius: "8px", color: "#e0def4", padding: "10px 12px", fontSize: "13px", marginBottom: "10px",
};
const btnPrimary = {
  background: "linear-gradient(135deg, #818cf8, #f472b6)", border: "none", borderRadius: "8px",
  color: "#fff", padding: "10px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
};
const btnGhost = {
  background: "transparent", border: "1px solid rgba(196,167,231,0.25)", borderRadius: "8px",
  color: "#c4a7e7", padding: "6px 12px", fontSize: "12px", cursor: "pointer",
};

export default function ApplyKit() {
  const [tab, setTab] = useState(TABS[0]);
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState("");
  const [q, setQ] = useState({ question: "", job_title: "", company: "", job_description: "" });
  const [draft, setDraft] = useState(null);
  const [hr, setHR] = useState({ company: "", domain: "" });
  const [hrResult, setHRResult] = useState(null);

  async function loadApps() {
    setLoading(true);
    try {
      const url = filter ? `/apply/list?status=${filter}` : "/apply/list";
      const { data } = await client.get(url);
      setApps(data.applications || []);
    } catch { /* empty state shows */ }
    setLoading(false);
  }
  useEffect(() => { if (tab === TABS[0]) loadApps(); }, [tab, filter]);

  async function updateStatus(id, status) {
    await client.patch(`/apply/${id}`, { status });
    loadApps();
  }
  async function removeApp(id) {
    if (!confirm("Remove this application?")) return;
    await client.delete(`/apply/${id}`);
    loadApps();
  }
  async function loadProfile() {
    setLoading(true);
    try {
      const { data } = await client.get("/apply/profile");
      setProfile(data);
    } catch { setProfile({ error: "Upload a resume first (Dashboard)." }); }
    setLoading(false);
  }
  useEffect(() => { if (tab === TABS[1] && !profile) loadProfile(); }, [tab]);

  function copyField(label, value) {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  async function getDraft() {
    if (!q.question.trim()) return;
    setLoading(true);
    try {
      const { data } = await client.post("/apply/answer", q);
      setDraft(data);
    } catch { setDraft({ draft: "Failed to generate. Try again.", source: "error" }); }
    setLoading(false);
  }

  async function getHR() {
    if (!hr.company.trim()) return;
    setLoading(true);
    try {
      const { data } = await client.post("/apply/hr-contact", hr);
      setHRResult(data);
    } catch { setHRResult(null); }
    setLoading(false);
  }

  const counts = STATUSES.map((s) => ({ label: s, value: apps.filter((a) => a.status === s).length }));

  return (
    <Layout>
      <PageHeader title="Apply Kit" subtitle="Track applications, autofill forms, draft screening answers, reach HR." />
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={t === tab ? btnPrimary : btnGhost}>{t}</button>
        ))}
      </div>

      {tab === TABS[0] && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "16px" }}>
            {counts.map((c) => (
              <StatCard key={c.label} label={c.label} value={c.value} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button onClick={() => setFilter("")} style={!filter ? btnPrimary : btnGhost}>All</button>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setFilter(s)} style={filter === s ? btnPrimary : btnGhost}>{s}</button>
            ))}
          </div>
          {loading ? <LoadingButton text="Loading applications..." /> :
            apps.length === 0 ? <EmptyState message="No applications yet. Track one from Jobs or add from here." /> :
            apps.map((a) => (
              <div key={a.application_id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#e0def4" }}>{a.job_title || a.job_id}</div>
                    <div style={{ fontSize: "12px", color: "#908caa" }}>{a.company} · {a.status}
                      {a.applied_at ? ` · applied ${new Date(a.applied_at).toLocaleDateString()}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {a.job_url && <a href={a.job_url} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: "none" }}>Open job</a>}
                    <select value={a.status} onChange={(e) => updateStatus(a.application_id, e.target.value)}
                      style={{ background: "#191724", color: "#e0def4", borderRadius: "8px", padding: "6px", fontSize: "12px" }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => removeApp(a.application_id)} style={btnGhost}>Remove</button>
                  </div>
                </div>
                {a.notes && <div style={{ fontSize: "12px", color: "#908caa", marginTop: "8px" }}>{a.notes}</div>}
              </div>
            ))}
        </>
      )}

      {tab === TABS[1] && (
        <div style={card}>
          <SectionLabel>Autofill profile — extracted once from your resume</SectionLabel>
          {!profile ? <LoadingButton text="Extracting profile..." /> :
            profile.error ? <EmptyState message={profile.error} /> :
            <>
              {[["Full name", profile.full_name], ["Email", profile.email], ["Phone", profile.phone],
                ["LinkedIn", profile.linkedin], ["GitHub", profile.github]].map(([label, value]) => (
                <div key={label} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ width: "90px", fontSize: "12px", color: "#908caa" }}>{label}</div>
                  <div style={{ flex: 1, fontSize: "13px", color: "#e0def4", overflow: "hidden", textOverflow: "ellipsis" }}>{value || "—"}</div>
                  <button onClick={() => copyField(label, value)} style={btnGhost}>{copied === label ? "Copied!" : "Copy"}</button>
                </div>
              ))}
              {profile.skills?.length > 0 && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#908caa" }}>Skills: {profile.skills.join(", ")}</div>
              )}
              <div style={{ marginTop: "12px" }}><button onClick={loadProfile} style={btnGhost}>Re-extract from latest resume</button></div>
            </>}
        </div>
      )}

      {tab === TABS[2] && (
        <div style={card}>
          <SectionLabel>Screening question helper — paste the question, get an editable draft</SectionLabel>
          <textarea placeholder="e.g. Why do you want to join us?" value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })}
            rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input placeholder="Job title (optional)" value={q.job_title} onChange={(e) => setQ({ ...q, job_title: e.target.value })} style={inputStyle} />
            <input placeholder="Company (optional)" value={q.company} onChange={(e) => setQ({ ...q, company: e.target.value })} style={inputStyle} />
          </div>
          <button onClick={getDraft} style={btnPrimary}>Draft answer</button>
          {loading && <div style={{ marginTop: "10px" }}><LoadingButton text="Drafting..." /></div>}
          {draft && (
            <div style={{ marginTop: "14px", background: "#191724", borderRadius: "8px", padding: "14px", fontSize: "13px", color: "#e0def4", whiteSpace: "pre-wrap" }}>
              {draft.draft}
              <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#6e6a86" }}>source: {draft.source} — always edit with a real project + metric before submitting</span>
                <button onClick={() => copyField("draft", draft.draft)} style={btnGhost}>{copied === "draft" ? "Copied!" : "Copy"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === TABS[3] && (
        <div style={card}>
          <SectionLabel>HR outreach — official channels only, no scraped personal data</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input placeholder="Company name" value={hr.company} onChange={(e) => setHR({ ...hr, company: e.target.value })} style={inputStyle} />
            <input placeholder="Email domain (optional, e.g. acme.com)" value={hr.domain} onChange={(e) => setHR({ ...hr, domain: e.target.value })} style={inputStyle} />
          </div>
          <button onClick={getHR} style={btnPrimary}>Get outreach kit</button>
          {hrResult && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#e0def4", marginBottom: "8px" }}>Official channels</div>
              {hrResult.official_channels.map((c) => (
                <div key={c.label} style={{ marginBottom: "6px" }}>
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ color: "#c4a7e7", fontSize: "13px" }}>{c.label} ↗</a>
                </div>
              ))}
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#e0def4", margin: "12px 0 8px" }}>Email patterns to verify on their site</div>
              {hrResult.email_patterns_to_verify.map((e) => (
                <div key={e} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                  <code style={{ fontSize: "12px", color: "#e0def4" }}>{e}</code>
                  <button onClick={() => copyField(e, e)} style={btnGhost}>{copied === e ? "Copied!" : "Copy"}</button>
                </div>
              ))}
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#e0def4", margin: "12px 0 8px" }}>Outreach template</div>
              <pre style={{ background: "#191724", borderRadius: "8px", padding: "14px", fontSize: "12px", color: "#e0def4", whiteSpace: "pre-wrap" }}>{hrResult.outreach_template}</pre>
              <div style={{ fontSize: "11px", color: "#6e6a86", marginTop: "8px" }}>{hrResult.disclaimer}</div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
