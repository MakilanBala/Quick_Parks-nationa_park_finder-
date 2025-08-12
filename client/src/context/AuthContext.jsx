import React from "react";

const AuthCtx = React.createContext({
  token: null,
  user: null,
  isAuthenticated: false,
  login: async () => { throw new Error("AuthProvider not mounted"); },
  logout: () => {}
});

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("authUser") || "null"); } catch { return null; }
  });

  const login = async (emailOrObj, passwordArg) => {
    const email = typeof emailOrObj === "object" && emailOrObj
      ? emailOrObj.email
      : emailOrObj;
    const password = typeof emailOrObj === "object" && emailOrObj
      ? emailOrObj.password
      : passwordArg;

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    let data;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      let msg = (data && data.message) || `Login failed (${res.status})`;
      throw new Error(msg);
    }

    const token = data?.token || data?.accessToken || data?.jwt || data?.data?.token;
    const user = data?.user || data?.data?.user || null;
    if (!token) throw new Error("Login succeeded but no token in response");

    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(user));
    setToken(token);
    setUser(user);
    window.dispatchEvent(new Event("auth:changed"));
    return data;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("auth:changed"));
  };

  React.useEffect(() => {
    const sync = () => {
      const t = localStorage.getItem("authToken");
      let u = null;
      try { u = JSON.parse(localStorage.getItem("authUser") || "null"); } catch {}
      setToken(t || null);
      setUser(u);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("auth:changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth:changed", sync);
    };
  }, []);

  const value = React.useMemo(() => ({
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout
  }), [token, user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return React.useContext(AuthCtx);
}