import { useRef, useCallback } from "react";
import { LANG_LIST, LANG_LABELS, LANG_ICONS } from "./constants";

export default function LanguageBar({ lang, setLang }) {
  const langBarRef = useRef(null);

  const scrollLangBar = useCallback((dir) => {
    if (langBarRef.current) {
      langBarRef.current.scrollBy({ left: dir * 180, behavior: "smooth" });
    }
  }, []);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(19, 17, 36, 0.4)",
      borderRadius: "16px 16px 0 0",
      overflow: "hidden",
    }}>
      <button
        onClick={() => scrollLangBar(-1)}
        style={{
          width: "32px", height: "40px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none",
          color: "var(--ctp-overlay0)", cursor: "pointer", flexShrink: 0,
          fontSize: "12px", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ctp-text)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ctp-overlay0)"; }}
      >
        ◀
      </button>

      <div
        ref={langBarRef}
        style={{
          display: "flex", gap: "2px", overflowX: "auto", overflowY: "hidden",
          scrollBehavior: "smooth", flex: 1, padding: "6px 0",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}
      >
        {LANG_LIST.map((l) => {
          const isActive = lang === l;
          return (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "8px", border: "none",
                fontSize: "12px", fontWeight: isActive ? 600 : 500,
                fontFamily: "var(--font-mono)", cursor: "pointer",
                whiteSpace: "nowrap", transition: "all 0.2s ease", flexShrink: 0,
                background: isActive ? "var(--accent-iris-dim)" : "transparent",
                color: isActive ? "var(--accent-iris)" : "var(--ctp-overlay0)",
                boxShadow: isActive ? "0 0 12px rgba(196, 167, 231, 0.15)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(224, 222, 244, 0.04)";
                  e.currentTarget.style.color = "var(--ctp-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--ctp-overlay0)";
                }
              }}
            >
              <span style={{
                fontSize: "10px", width: "20px", height: "20px", borderRadius: "4px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? "rgba(196, 167, 231, 0.2)" : "var(--ctp-surface0)",
                fontWeight: 700, letterSpacing: "-0.02em",
              }}>
                {LANG_ICONS[l]}
              </span>
              {LANG_LABELS[l]}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scrollLangBar(1)}
        style={{
          width: "32px", height: "40px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none",
          color: "var(--ctp-overlay0)", cursor: "pointer", flexShrink: 0,
          fontSize: "12px", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ctp-text)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ctp-overlay0)"; }}
      >
        ▶
      </button>
    </div>
  );
}
