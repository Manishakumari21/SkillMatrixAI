export default function SectionLabel({ children, color = "var(--ctp-overlay0)", marginBottom = "10px" }) {
  return (
    <div className="section-label" style={{ color, marginBottom }}>
      {children}
    </div>
  );
}
