import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import AuthLayout from "../components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await client.post("/auth/forgot-password", { email });
      setSent(true);
      // Helpful locally: the server logs the link when SMTP is not configured.
      if (data.delivery === "log") {
        setDevLink("Email delivery is not configured on this server. Check the backend logs for the reset link.");
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        heading="Check your inbox"
        subtitle="If an account exists for that email, a reset link is on its way."
        bottomLink={<><Link to="/login" style={{ color: "var(--ctp-mauve)", fontWeight: 600 }}>Back to sign in</Link></>}
      >
        <div className="success-box" style={{ marginBottom: "16px" }}>
          We sent a password reset link to <strong>{email}</strong>. It expires in 30 minutes and can only be used once.
        </div>
        {devLink && (
          <div className="error-box" style={{ marginBottom: "16px" }}>{devLink}</div>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading="Reset password"
      subtitle="Enter your email and we'll send you a reset link."
      bottomLink={<><Link to="/login" style={{ color: "var(--ctp-mauve)", fontWeight: 600 }}>Back to sign in</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "24px" }}>
          <label className="label">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && <div className="error-box" style={{ marginBottom: "16px" }}>{error}</div>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "14px" }} disabled={loading}>
          {loading ? <><span className="spinner" /> Sending...</> : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}