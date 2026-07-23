export default function StatCard({ label, value, color = "var(--ctp-mauve)", icon }) {
  return (
    <div className="stat-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value" style={{ color }}>{value}</div>
        {icon && <div className="stat-card-icon" style={{ color }}>{icon}</div>}
      </div>
    </div>
  );
}
