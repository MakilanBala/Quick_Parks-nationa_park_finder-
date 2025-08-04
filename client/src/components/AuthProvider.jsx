import React, { createContext, useState, useEffect, use } from "react";

export const AuthContext = createContext();

const TOKEN_KEY = "park_suggestor_token";
const USER_KEY = "park_suggestor_user";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function hydrate() {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await fetch("http://localhost:4000/api/user/me", {
                headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Session invalid");
                const { user: u } = await res.json();
                setUser(u);
            } catch (e) {
                console.warn("Auth hydrate failed:", e);
                setToken(null);
                setUser(null);
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            } finally {
                setIsLoading(false);
            }
        }
        hydrate();
    } , [token]);

    useEffect(() => {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    }, [token]);

    useEffect(() => {
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
        else localStorage.removeItem(USER_KEY);
    }, [user]);

    const login = async ({ email, password }) => {
        setError(null);
        const res = await fetch("http://localhost:4000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const { message } = await res.json();
            setError(message || "Login failed");
            throw new Error(message);
        }
        const { token: t, user: u } = await res.json();
        setToken(t);
        setUser(u);
        return u;
    };

    const signup = async ({ email, password, username }) => {
        setError(null);
        const res = await fetch("http://localhost:4000/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, username}), // ✅ Changed displayName to username
        });
        if (!res.ok) {
            const { message } = await res.json();
            setError(message || "Signup failed");
            throw new Error(message);
        }
        const { token: t, user: u } = await res.json();
        setToken(t);
        setUser(u);
        return u;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    
    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isLoading,
                error,
                login,
                signup,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}