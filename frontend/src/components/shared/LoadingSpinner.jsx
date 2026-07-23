export function LoadingButton({ loading, children, ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? <><span className="spinner" /> {children}</> : props.label || children}
    </button>
  );
}

export function LoadingCard({ message = "Loading..." }) {
  return (
    <div className="card">
      <div className="card-body" style={{ textAlign: "center", padding: "48px" }}>
        <span className="spinner" />
        <div style={{ fontSize: "13px", color: "var(--ctp-overlay0)", marginTop: "12px" }}>
          {message}
        </div>
      </div>
    </div>
  );
}
