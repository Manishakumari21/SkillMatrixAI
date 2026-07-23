function LineNumbers({ code }) {
  const lines = (code || "").split("\n").length;
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, width: "44px", height: "100%",
      background: "rgba(19, 17, 36, 0.6)", borderRight: "1px solid var(--border-subtle)",
      padding: "14px 0", overflow: "hidden", userSelect: "none",
      borderRadius: "8px 0 0 8px",
    }}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} style={{
          fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: "20.8px",
          textAlign: "right", paddingRight: "10px", color: "var(--ctp-overlay0)",
          height: "20.8px",
        }}>
          {i + 1}
        </div>
      ))}
    </div>
  );
}

export default function CodeEditor({ code, setCode, language }) {
  return (
    <div style={{ position: "relative", minHeight: "340px" }}>
      <LineNumbers code={code} />
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        style={{
          width: "100%", minHeight: "340px",
          fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: "20.8px",
          background: "var(--ctp-crust)", color: "var(--ctp-text)",
          border: "none", borderRadius: "0 0 16px 16px",
          padding: "14px 14px 14px 54px", resize: "vertical", outline: "none",
          tabSize: 2, letterSpacing: "0.01em",
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const val = code.substring(0, start) + "  " + code.substring(end);
            setCode(val);
            setTimeout(() => {
              e.target.selectionStart = e.target.selectionEnd = start + 2;
            }, 0);
          }
          if (e.key === "Enter") {
            e.preventDefault();
            const start = e.target.selectionStart;
            const before = code.substring(0, start);
            const after = code.substring(start);
            const lastLine = before.split("\n").pop();
            const indent = lastLine.match(/^(\s*)/)[1];
            const val = before + "\n" + indent + after;
            setCode(val);
            setTimeout(() => {
              e.target.selectionStart = e.target.selectionEnd = start + 1 + indent.length;
            }, 0);
          }
        }}
      />
    </div>
  );
}
