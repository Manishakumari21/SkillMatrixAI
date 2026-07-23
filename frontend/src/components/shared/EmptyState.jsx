export default function EmptyState({ icon, message, children }) {
  return (
    <div className="card" style={{ opacity: 0.6 }}>
      <div className="card-body" style={{ textAlign: "center", padding: "48px" }}>
        {icon && <div style={{ marginBottom: "12px" }}>{icon}</div>}
        <div style={{ fontSize: "13px", color: "var(--ctp-overlay0)" }}>
          {message}
        </div>
        {children}
      </div>
    </div>
  );
}
