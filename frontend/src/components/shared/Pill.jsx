export default function Pill({ children, color, bg, border, fontSize = "10px", className = "" }) {
  return (
    <span
      className={`pill ${className}`}
      style={{
        fontSize,
        padding: "2px 8px",
        borderRadius: "999px",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        background: bg,
        color,
        border: border ? `1px solid ${border}` : "none",
      }}
    >
      {children}
    </span>
  );
}
