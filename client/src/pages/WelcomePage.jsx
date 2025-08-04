import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return <div>Loading user...</div>;

  return (
    <div>
      <h1>Welcome, {user.username || user.email}!</h1> {/* ✅ Only use username */}
      <p>Email: {user.email}</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}
