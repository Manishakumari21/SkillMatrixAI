export default function ChartImage({ src, alt, maxWidth = "100%", title }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      {title && <div className="label" style={{ marginBottom: "12px" }}>{title}</div>}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src={`data:image/png;base64,${src}`}
          alt={alt}
          style={{ maxWidth, width: "100%", height: "auto", borderRadius: "var(--radius-md)" }}
        />
      </div>
    </div>
  );
}
