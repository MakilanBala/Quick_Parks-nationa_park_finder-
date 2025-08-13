const API_BASE = import.meta.env.VITE_API_BASE || "";

import React, { createContext, useState, useEffect, use } from "react";

export const AuthContext = createContext();

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  React.useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const login = async ({ email, password }) => {
    setError(null);
    // Clear any stale token before login
    localStorage.removeItem(TOKEN_KEY);

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.message || "Login failed";
      setError(msg);
      throw new Error(msg);
    }

    const t = data?.token || data?.accessToken || data?.jwt;
    if (!t) throw new Error("No token in response");

    console.debug("[Auth] server token (prefix):", t.slice(0, 24));
    setToken(t);
    setUser(data.user || null);
    window.dispatchEvent(new Event("auth:changed"));
    return data.user;
  };

  const signup = async ({ email, password, username }) => {
    setError(null);
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.message || "Signup failed";
      setError(msg);
      throw new Error(msg);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("auth:changed"));
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}