import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./LoginComponent.css";

export default function LoginComponent() {
  const { login, signup, error } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/welcome";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signup({ email, password, username: displayName });
      } else {
        await login({ email, password });
      }
      navigate(from, { replace: true });
    } catch {}
    setLoading(false);
  };

  return (
    <div className="login-component">
      <h2>{isSignup ? "Sign Up" : "Log In"}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {isSignup && (
          <div className="form-group">
            <label>Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        )}
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="submit-button" disabled={loading} type="submit">
          {isSignup ? "Sign Up" : "Log In"}
        </button>
      </form>
      <button
        className="toggle-button"
        type="button"
        onClick={() => setIsSignup((s) => !s)}
      >
        {isSignup ? "Have an account? Log in" : "No account? Sign up"}
      </button>
    </div>
  );
}
