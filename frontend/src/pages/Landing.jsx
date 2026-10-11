import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const blue = "#818cf8";
const pink = "#f472b6";
const blueLight = "#a5b4fc";
const pinkLight = "#f9a8d4";

const differentiators = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Grounded, not guessed",
    body: "Interview questions come from a real curated bank first. Every answer is checked against the source before it reaches you, never invented from thin air.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
    title: "Explainable, not vague",
    body: "Every recommended skill comes with a real number attached, like 'appears in 67% of the postings you gave us,' not a confident sounding guess with no source.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={blueLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Two matching modes, side by side",
    body: "See naive keyword matching and embeddings based semantic matching on the same screen, so the improvement is something you can see, not just something we claim.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pinkLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: "Built to survive failure",
    body: "Scanned resume, no API key, a slow provider, none of it breaks the app. Every real failure point has a tested fallback instead of an error page.",
  },
];

const stats = [
  { label: "matching modes", value: "2" },
  { label: "question bank", value: "45+" },
  { label: "fallback paths", value: "6" },
];

const steps = [
  {
    step: "01",
    title: "Upload",
    body: "Upload your resume. Text is extracted directly, or through OCR if it's a scanned copy.",
    color: blue,
  },
  {
    step: "02",
    title: "Compare",
    body: "Paste a job description. See keyword and semantic matches side by side, with a real percentage.",
    color: pink,
  },
  {
    step: "03",
    title: "Plan",
    body: "Paste a few real postings for your target role. Get a prioritized roadmap with demand percentages.",
    color: blueLight,
  },
  {
    step: "04",
    title: "Practice",
    body: "Run mock interviews with questions retrieved from a real bank, never invented from thin air.",
    color: pinkLight,
  },
];

export default function Landing() {
  const [gaugeValue, setGaugeValue] = useState(0);

  useEffect(() => {
    const target = 78;
    const interval = setInterval(() => {
      setGaugeValue((current) => {
        if (current >= target) {
          clearInterval(interval);
          return target;
        }
        return current + 2;
      });
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (gaugeValue / 100) * circumference;

  return (
    <div
      style={{
        background: "var(--ctp-crust)",
        color: "var(--ctp-text)",
        minHeight: "100vh",
      }}
    >
      {/* Floating orbs - blue + pink */}
      <div className="floating-orb" style={{
        width: "500px", height: "500px", top: "5%", left: "-5%",
        background: `radial-gradient(circle, rgba(129, 140, 248, 0.1), transparent 70%)`,
        animation: "float 10s ease-in-out infinite",
      }} />
      <div className="floating-orb" style={{
        width: "400px", height: "400px", top: "60%", right: "-5%",
        background: `radial-gradient(circle, rgba(244, 114, 182, 0.08), transparent 70%)`,
        animation: "float 10s ease-in-out infinite 3s",
      }} />
      <div className="floating-orb" style={{
        width: "350px", height: "350px", bottom: "10%", left: "30%",
        background: `radial-gradient(circle, rgba(165, 180, 252, 0.06), transparent 70%)`,
        animation: "float 10s ease-in-out infinite 5s",
      }} />

      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 48px",
          borderBottom: "1px solid var(--border-subtle)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${blue}, ${pink})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              fontWeight: 800,
              color: "#191724",
            }}
          >
            S
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.02em" }}>
            SkillMatrix<span style={{ color: pink }}>AI</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ padding: "10px 20px", fontSize: "13px" }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="btn btn-primary"
            style={{ padding: "10px 20px", fontSize: "13px" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "48px",
          alignItems: "center",
          padding: "80px 48px 60px",
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "100px",
              background: `rgba(129, 140, 248, 0.1)`,
              border: `1px solid rgba(129, 140, 248, 0.15)`,
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: blue,
              marginBottom: "24px",
              fontWeight: 500,
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: pink }} />
            AI-Powered Career Intelligence
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "52px",
              lineHeight: 1.1,
              fontWeight: 800,
              marginBottom: "20px",
              letterSpacing: "-0.04em",
            }}
          >
            Know exactly what stands between you and the job you want.
          </h1>

          <p
            style={{
              fontSize: "17px",
              color: "var(--ctp-subtext0)",
              lineHeight: 1.7,
              marginBottom: "36px",
              maxWidth: "500px",
            }}
          >
            SkillMatrixAI reads your resume, compares it against real job
            postings, and tells you exactly which skills to learn next — with
            the actual reasoning behind every recommendation.
          </p>

          <div
            style={{
              background: "rgba(180, 190, 254, 0.07)",
              border: "1px solid rgba(180, 190, 254, 0.16)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "28px",
              maxWidth: "500px",
              fontSize: "13px",
              lineHeight: 1.65,
              color: "var(--ctp-subtext0)",
            }}
          >
            <strong style={{ color: "var(--ctp-text)" }}>Free, and no shared AI keys.</strong>{" "}
            Create an account, then add your own free Groq or Gemini key in
            Settings to switch on AI features. Everything else works without one.
          </div>

          <div style={{ display: "flex", gap: "14px", marginBottom: "48px" }}>
            <Link
              to="/register"
              className="btn btn-primary"
              style={{ padding: "13px 28px", fontSize: "14px" }}
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="btn btn-secondary"
              style={{ padding: "13px 28px", fontSize: "14px" }}
            >
              Sign In
            </Link>
          </div>

          <div style={{ display: "flex", gap: "48px" }}>
            {stats.map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "26px",
                    fontWeight: 700,
                    color: pink,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--ctp-overlay1)",
                    marginTop: "2px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gauge card */}
        <div
          style={{
            background: "var(--ctp-base)",
            border: "1px solid var(--border-default)",
            borderRadius: "20px",
            padding: "36px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "var(--shadow-lg)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, ${blue}, ${pink})`,
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--ctp-overlay0)",
              alignSelf: "flex-start",
              marginBottom: "20px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: "var(--ctp-surface0)",
            }}
          >
            composite_readiness_score.json
          </div>

          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="var(--ctp-surface0)"
              strokeWidth="14"
            />
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="url(#gauge-gradient-landing)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 90 90)"
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
            <defs>
              <linearGradient id="gauge-gradient-landing" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={blue} />
                <stop offset="100%" stopColor={pink} />
              </linearGradient>
            </defs>
            <text
              x="90"
              y="95"
              textAnchor="middle"
              fill="var(--ctp-text)"
              fontSize="34"
              fontFamily="var(--font-display)"
              fontWeight="800"
            >
              {gaugeValue}%
            </text>
          </svg>

          <div
            style={{
              fontSize: "13px",
              color: "var(--ctp-overlay1)",
              marginTop: "12px",
              textAlign: "center",
            }}
          >
            across 3 job postings analyzed
          </div>

          <div
            style={{
              width: "100%",
              marginTop: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {[
              { skill: "docker", demand: "66.7%", pct: 66.7 },
              { skill: "system design", demand: "50%", pct: 50 },
            ].map((item) => (
              <div key={item.skill}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--ctp-subtext0)",
                    }}
                  >
                    {item.skill}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: pink,
                      fontWeight: 600,
                    }}
                  >
                    {item.demand} demand
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${item.pct}%`,
                      background: `linear-gradient(90deg, ${blue}, ${pink})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section
        style={{
          padding: "80px 48px",
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: "48px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: blue,
              marginBottom: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Why this is different
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              maxWidth: "600px",
            }}
          >
            Most tools give you a confident number and hope you don't ask where
            it came from.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="card"
              style={{ borderRadius: "16px" }}
            >
              <div className="card-body" style={{ padding: "28px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "var(--ctp-surface0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "17px",
                    fontWeight: 600,
                    marginBottom: "10px",
                    color: "var(--ctp-text)",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--ctp-overlay1)",
                    lineHeight: 1.7,
                  }}
                >
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        style={{
          padding: "80px 48px",
          maxWidth: "1200px",
          margin: "0 auto",
          borderTop: "1px solid var(--border-subtle)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: pink,
            marginBottom: "12px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          How it works
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "34px",
            fontWeight: 700,
            marginBottom: "48px",
            letterSpacing: "-0.03em",
          }}
        >
          Four steps, each one grounded in real data.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {steps.map((item) => (
            <div key={item.step} style={{ position: "relative" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: item.color,
                  opacity: 0.2,
                  marginBottom: "12px",
                  letterSpacing: "-0.02em",
                }}
              >
                {item.step}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "10px",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--ctp-overlay1)",
                  lineHeight: 1.7,
                }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 48px",
          textAlign: "center",
          borderTop: "1px solid var(--border-subtle)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: 700,
            marginBottom: "24px",
            letterSpacing: "-0.03em",
          }}
        >
          Find out exactly what's between you and your next offer.
        </h2>
        <Link
          to="/register"
          className="btn btn-primary"
          style={{
            padding: "14px 36px",
            fontSize: "15px",
            display: "inline-flex",
          }}
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "28px 48px",
          borderTop: "1px solid var(--border-subtle)",
          textAlign: "center",
          fontSize: "13px",
          color: "var(--ctp-overlay0)",
          fontFamily: "var(--font-mono)",
          position: "relative",
          zIndex: 1,
        }}
      >
        SkillMatrixAI &mdash; Built for developers who want real answers.
      </footer>
    </div>
  );
}
