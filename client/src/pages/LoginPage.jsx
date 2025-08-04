import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login, signup, error } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/welcome";

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signup({ email, password, username: displayName }); // ✅ Changed userName to username: displayName
      } else {
        await login({ email, password });
      }
      navigate(from, { replace: true });
    } catch {}
    setLoading(false);
  };

  return (
    <div>
      <h2>{isSignup ? "Sign Up" : "Log In"}</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {isSignup && (
          <div>
            <label>Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
        )}
        <div>
          <label>Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} type="submit">
          {isSignup ? "Sign Up" : "Log In"}
        </button>
      </form>
      <button type="button" onClick={() => setIsSignup(s => !s)}>
        {isSignup ? "Have an account? Log in" : "No account? Sign up"}
      </button>
    </div>
  );
}
