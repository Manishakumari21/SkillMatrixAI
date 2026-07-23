import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await client.post("/auth/register", { email, password, full_name: fullName });
      navigate("/login");
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError("An account with this email already exists");
      } else {
        setError("Something went wrong, please try again");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      heading="Create your account"
      subtitle="Get started with SkillMatrix"
      gradientFrom="var(--ctp-blue)"
      gradientTo="var(--ctp-teal)"
      bottomLink={<>{"Already have an account? "}<Link to="/login" style={{ color: "var(--ctp-mauve)", fontWeight: 600 }}>Sign in</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "18px" }}>
          <label className="label">Full name</label>
          <input type="text" className="input-field" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div style={{ marginBottom: "18px" }}>
          <label className="label">Email</label>
          <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: "28px" }}>
          <label className="label">Password</label>
          <input type="password" className="input-field" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="error-box" style={{ marginBottom: "16px" }}>{error}</div>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "14px" }} disabled={loading}>
          {loading ? <><span className="spinner" /> Creating account...</> : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
