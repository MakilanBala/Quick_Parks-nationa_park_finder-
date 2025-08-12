import React from "react";

const AuthCtx = React.createContext({
  token: null,
  user: null,
  isAuthenticated: false,
  login: async () => { throw new Error("AuthProvider not mounted"); },
  logout: () => {}
});

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("authUser") || "null"); } catch { return null; }
  });

  const login = React.useCallback(async (emailOrObj, passwordArg) => {
    const email = typeof emailOrObj === "object" ? emailOrObj.email : emailOrObj;
    const password = typeof emailOrObj === "object" ? emailOrObj.password : passwordArg;

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || `Login failed (${res.status})`);

    const t = data?.token || data?.accessToken || data?.jwt;
    console.debug("[AuthContext] server token:", t ? t.slice(0, 24) + "…" : t);
    if (!t) throw new Error("No token in response");

    // overwrite storage every time
    localStorage.setItem("authToken", t);
    localStorage.setItem("authUser", JSON.stringify(data.user || null));
    console.debug("[AuthContext] stored token:", (localStorage.getItem("authToken") || "").slice(0, 24) + "…");

    setToken(t);
    setUser(data.user || null);
    window.dispatchEvent(new Event("auth:changed"));
    return data;
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("auth:changed"));
  }, []);

  return (
    <AuthCtx.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthCtx);
}