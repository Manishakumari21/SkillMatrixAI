export default function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
