"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { apiUrl, API_ENDPOINTS } from "../lib/api";

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthToken: (newToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      setToken(t);
      fetchUser(t);
    }
  }, []);

  const fetchUser = async (t: string) => {
    try {
      const res = await axios.get(apiUrl(API_ENDPOINTS.AUTH.ME), {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(res.data.user);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    }
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post(apiUrl(API_ENDPOINTS.AUTH.LOGIN), { email, password });
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    await fetchUser(res.data.token);
    router.push("/dashboard");
  };

  const register = async (name: string, email: string, password: string) => {
    await axios.post(apiUrl(API_ENDPOINTS.AUTH.REGISTER), { name, email, password });
    // Após registro, faz login automático
    await login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    router.push("/");
  };

  const refreshUser = async () => {
    if (token) await fetchUser(token);
  };

  const setAuthToken = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    await fetchUser(newToken);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, refreshUser, setAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
} 