import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  // While we’re verifying/hydrating, don’t flash the login screen
  if (isLoading) return <div>Loading...</div>;

  // Not authenticated: redirect to login and remember where they wanted to go
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated: render the protected content
  return children;
}
