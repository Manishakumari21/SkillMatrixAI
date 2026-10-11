import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";

export function useUserKeys() {
  const [configured, setConfigured] = useState(null);

  useEffect(() => {
    let active = true;
    client
      .get("/user/api-keys")
      .then(({ data }) => {
        if (active) setConfigured(Boolean(data.groq_configured || data.gemini_configured));
      })
      .catch(() => {
        if (active) setConfigured(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return configured;
}

export default function ApiKeyBanner({ variant = "info" }) {
  const configured = useUserKeys();

  if (configured === null || configured === true) return null;

  const styles =
    variant === "warning"
      ? {
          background: "rgba(249, 226, 175, 0.1)",
          border: "1px solid rgba(249, 226, 175, 0.2)",
          color: "#f9e2af",
        }
      : {
          background: "rgba(180, 190, 254, 0.08)",
          border: "1px solid rgba(180, 190, 254, 0.18)",
          color: "#b4befe",
        };

  return (
    <div
      style={{
        ...styles,
        borderRadius: "8px",
        padding: "12px 14px",
        marginBottom: "16px",
        fontSize: "12.5px",
        lineHeight: 1.6,
      }}
    >
      <strong style={{ color: "#e0def4" }}>No API key added yet.</strong>{" "}
      This app no longer ships with shared AI keys — every account uses its own.
      Everything works without one using rule-based results, but AI features
      (interview grading, resume optimisation, portfolio writing) stay off.{" "}
      <Link to="/settings/api-keys" style={{ color: styles.color, fontWeight: 600 }}>
        Add your free key →
      </Link>
    </div>
  );
}