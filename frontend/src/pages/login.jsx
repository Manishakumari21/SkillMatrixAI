import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      const response = await client.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(response.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError("Incorrect email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      heading="Welcome back"
      subtitle="Sign in to SkillMatrix"
      bottomLink={<>{"No account? "}<Link to="/register" style={{ color: "var(--ctp-mauve)", fontWeight: 600 }}>Create one</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "18px" }}>
          <label className="label">Email</label>
          <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: "28px" }}>
          <label className="label">Password</label>
          <input type="password" className="input-field" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div style={{ textAlign: "right", marginTop: "-4px", marginBottom: "18px" }}>
            <Link to="/forgot-password" style={{ fontSize: "12px", color: "var(--ctp-mauve)" }}>
              Forgot password?
            </Link>
          </div>
        </div>
        {error && <div className="error-box" style={{ marginBottom: "16px" }}>{error}</div>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "14px" }} disabled={loading}>
          {loading ? <><span className="spinner" /> Signing in...</> : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
