import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: "/skill-gap",
    label: "Skill Gap",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    path: "/roadmap",
    label: "Roadmap",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    path: "/jobs",
    label: "Jobs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    path: "/mock-interview",
    label: "Mock Interview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    path: "/dsa-practice",
    label: "DSA Practice",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    path: "/ats-resume",
    label: "ATS Resume",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
  },
  {
    path: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    path: "/apply-kit",
    label: "Apply Kit",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4Z" />
      </svg>
    ),
  },
  {
    path: "/progress-tracker",
    label: "Progress",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      <div className="mesh-bg" />

      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          background: "rgba(25, 23, 36, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(196, 167, 231, 0.06)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{ padding: "24px 20px 20px", cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #c4a7e7, #31748f)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 800,
                color: "#191724",
                boxShadow: "0 2px 12px rgba(196, 167, 231, 0.25)",
              }}
            >
              S
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#e0def4", letterSpacing: "-0.02em" }}>
                SkillMatrix
              </div>
              <div style={{ fontSize: "9px", color: "#6e6a86", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                AI Platform
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ margin: "0 16px", height: "1px", background: "rgba(196, 167, 231, 0.06)" }} />

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#e0def4" : "#908caa",
                  background: isActive ? "rgba(196, 167, 231, 0.08)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  marginBottom: "2px",
                  position: "relative",
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "18px",
                      borderRadius: "0 3px 3px 0",
                      background: "#c4a7e7",
                      boxShadow: "0 0 8px rgba(196, 167, 231, 0.4)",
                    }}
                  />
                )}
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "18px",
                    height: "18px",
                    color: isActive ? "#c4a7e7" : "#6e6a86",
                    transition: "color 0.15s ease",
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div style={{ padding: "12px 10px 16px" }}>
          <div style={{ margin: "0 6px 12px", height: "1px", background: "rgba(196, 167, 231, 0.06)" }} />
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 400,
              color: "#908caa",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              width: "100%",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#eb6f92";
              e.currentTarget.style.background = "rgba(235, 111, 146, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#908caa";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "40px 48px",
          maxWidth: "1100px",
          animation: "fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
