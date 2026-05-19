"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, API_ENDPOINTS } from "../lib/api";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async (t: string) => {
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.AUTH.ME), {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error("auth-failed");
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
      setToken(null);
      if (typeof window !== "undefined") localStorage.removeItem("token");
    }
  }, []);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (t) {
      setToken(t);
      fetchUser(t).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch(apiUrl(API_ENDPOINTS.AUTH.LOGIN), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro ao fazer login." }));
      throw new Error(err.error || "Erro ao fazer login.");
    }
    const data = await res.json();
    setToken(data.token);
    localStorage.setItem("token", data.token);
    await fetchUser(data.token);
    router.push("/dashboard");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem("token");
    router.push("/login");
  };

  const refreshUser = async () => {
    if (token) await fetchUser(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
