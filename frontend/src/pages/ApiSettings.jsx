import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import client from "../api/client";
import { PageHeader, SectionLabel, Pill } from "../components/shared";

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

const label = {
  display: "block", fontSize: "12px", color: "#a6adc8",
  marginBottom: "6px", fontWeight: 600,
};

const PROVIDERS = [
  {
    key: "groq",
    name: "Groq",
    field: "groq_api_key",
    configuredKey: "groq_configured",
    hintKey: "groq_hint",
    signup: "https://console.groq.com/keys",
    placeholder: "gsk_...",
    blurb: "Primary provider. Very fast inference and a generous free tier.",
  },
  {
    key: "gemini",
    name: "Google Gemini",
    field: "gemini_api_key",
    configuredKey: "gemini_configured",
    hintKey: "gemini_hint",
    signup: "https://aistudio.google.com/apikey",
    placeholder: "AIza...",
    blurb: "Used as a fallback if the primary provider fails.",
  },
];

export default function ApiSettings() {
  const [status, setStatus] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await client.get("/user/api-keys");
      setStatus(data);
    } catch {
      setMessage({ type: "error", text: "Could not load your key settings." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const payload = {};
    let hasUpdate = false;
    for (const p of PROVIDERS) {
      const value = (drafts[p.field] || "").trim();
      if (value) {
        payload[p.field] = value;
        hasUpdate = true;
      }
    }
    if (!hasUpdate) {
      setMessage({ type: "error", text: "Enter a key first, or use Remove to delete one." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const { data } = await client.put("/user/api-keys", payload);
      setStatus(data);
      setDrafts({});
      setMessage({ type: "ok", text: "Keys saved and encrypted." });
    } catch (err) {
      const detail =
        err?.response?.data?.detail || "Could not save keys. Check the key and try again.";
      setMessage({ type: "error", text: detail });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(field) {
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await client.put("/user/api-keys", { [`clear_${field.replace("_api_key", "")}`]: true });
      setStatus(data);
      setDrafts({});
      setMessage({ type: "ok", text: "Key removed." });
    } catch {
      setMessage({ type: "error", text: "Could not remove the key." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveAll() {
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await client.delete("/user/api-keys");
      setStatus(data);
      setDrafts({});
      setMessage({ type: "ok", text: "All keys removed." });
    } catch {
      setMessage({ type: "error", text: "Could not remove keys." });
    } finally {
      setSaving(false);
    }
  }

  const anyConfigured = status?.groq_configured || status?.gemini_configured;

  return (
    <Layout>
      <div style={{ padding: "24px", maxWidth: "880px", margin: "0 auto" }}>
        <PageHeader
          title="API Keys"
          subtitle="Bring your own AI provider keys to unlock the AI-powered features."
        />

        <div style={card}>
          <SectionLabel>How this works</SectionLabel>
          <p style={{ fontSize: "13px", color: "#a6adc8", lineHeight: 1.7, marginTop: 0 }}>
            Keys are <strong style={{ color: "#e0def4" }}>yours alone</strong>. Each account uses
            only its own keys — never another user&apos;s, and never a shared server key. They are
            encrypted before being stored and are never sent back to your browser.
          </p>
          <p style={{ fontSize: "13px", color: "#a6adc8", lineHeight: 1.7, marginBottom: 0 }}>
            Without a key, everything still works using rule-based results. You only need a key for
            AI-generated content such as interview grading and resume optimisation.
          </p>
        </div>

        {loading ? (
          <div style={{ ...card, textAlign: "center", padding: "32px" }}>
            <span className="spinner" />
            <div style={{ fontSize: "13px", color: "#a6adc8", marginTop: "12px" }}>
              Loading your key settings…
            </div>
          </div>
        ) : (
          <>
            {PROVIDERS.map((p) => {
              const configured = status?.[p.configuredKey];
              const hint = status?.[p.hintKey];
              return (
                <div style={card} key={p.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#e0def4" }}>{p.name}</div>
                    {configured ? (
                      <Pill color="#a6e3a1">{hint || "configured"}</Pill>
                    ) : (
                      <Pill color="#6c7086">not set</Pill>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "#a6adc8", margin: "0 0 12px" }}>{p.blurb}</p>

                  <label style={label}>
                    {configured ? "Replace key" : `${p.name} API key`}
                  </label>
                  <input
                    type="password"
                    style={inputStyle}
                    placeholder={configured ? "Enter a new key to replace the current one" : p.placeholder}
                    value={drafts[p.field] || ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [p.field]: e.target.value }))
                    }
                    autoComplete="off"
                  />

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <a
                      href={p.signup}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "12px", color: "#b4befe", textDecoration: "none" }}
                    >
                      Get a free {p.name} key →
                    </a>
                    {configured && (
                      <button
                        style={btnGhost}
                        onClick={() => handleRemove(p.field)}
                        disabled={saving}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button style={btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save keys"}
              </button>
              {anyConfigured && (
                <button style={btnGhost} onClick={handleRemoveAll} disabled={saving}>
                  Remove all
                </button>
              )}
            </div>

            {message && (
              <p
                style={{
                  marginTop: "14px",
                  fontSize: "13px",
                  color: message.type === "ok" ? "#a6e3a1" : "#f38ba8",
                }}
              >
                {message.text}
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}