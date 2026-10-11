import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import client from "../api/client";
import AuthLayout from "../components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await client.post("/auth/reset-password", { token, new_password: password });
      navigate("/login", { state: { reset: true } });
    } catch (err) {
      setError(err?.response?.data?.detail || "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout
        heading="Invalid link"
        subtitle="This password reset link is missing its token."
        bottomLink={<><Link to="/forgot-password" style={{ color: "var(--ctp-mauve)", fontWeight: 600 }}>Request a new link</Link></>}
      >
        <div className="error-box">
          Please request a fresh password reset link to continue.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading="Choose a new password"
      subtitle="Pick something strong you haven't used before."
      bottomLink={<><Link to="/login" style={{ color: "var(--ctp-mauve)", fontWeight: 600 }}>Back to sign in</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "18px" }}>
          <label className="label">New password</label>
          <input
            type="password"
            className="input-field"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label className="label">Confirm new password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && <div className="error-box" style={{ marginBottom: "16px" }}>{error}</div>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "14px" }} disabled={loading}>
          {loading ? <><span className="spinner" /> Updating...</> : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}