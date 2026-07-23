import { Link } from "react-router-dom";

export default function AuthLayout({
  heading,
  subtitle,
  gradientFrom = "var(--ctp-mauve)",
  gradientTo = "var(--ctp-blue)",
  children,
  bottomLink,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "var(--ctp-crust)",
      }}
    >
      <div className="dot-grid" />

      <div
        className="floating-orb floating-orb-mauve"
        style={{ width: "350px", height: "350px", top: "15%", left: "10%" }}
      />
      <div
        className="floating-orb floating-orb-blue"
        style={{
          width: "300px",
          height: "300px",
          bottom: "15%",
          right: "10%",
        }}
      />

      <div
        className="card"
        style={{
          width: "420px",
          animation: "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
          }}
        />
        <div className="card-body" style={{ padding: "44px 40px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, var(--ctp-mauve), var(--ctp-blue))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--ctp-crust)",
                margin: "0 auto 20px",
                boxShadow: "0 8px 32px rgba(203, 166, 247, 0.25)",
              }}
            >
              S
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "6px",
              }}
            >
              {heading}
            </h1>
            <p
              style={{
                color: "var(--ctp-overlay1)",
                fontSize: "14px",
              }}
            >
              {subtitle}
            </p>
          </div>

          {children}

          {bottomLink && (
            <p
              style={{
                marginTop: "28px",
                fontSize: "13px",
                color: "var(--ctp-overlay1)",
                textAlign: "center",
              }}
            >
              {bottomLink}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
