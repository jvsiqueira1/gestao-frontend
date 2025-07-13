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
    console.log('🔄 AuthContext initializing...');
    const t = localStorage.getItem("token");
    console.log('📦 Token from localStorage:', t ? `${t.substring(0, 20)}...` : 'null');
    if (t) {
      setToken(t);
      fetchUser(t);
    } else {
      console.log('❌ No token found in localStorage');
    }
  }, []);

  const fetchUser = async (t: string) => {
    try {
      console.log('🔍 Fetching user with token:', t ? `${t.substring(0, 20)}...` : 'null');
      console.log('🌐 API URL:', apiUrl(API_ENDPOINTS.AUTH.ME));
      
      const res = await axios.get(apiUrl(API_ENDPOINTS.AUTH.ME), {
        headers: { Authorization: `Bearer ${t}` },
      });
      console.log('✅ User fetched successfully:', res.data.user);
      setUser(res.data.user);
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuário:', error);
      console.error('🔍 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 Attempting login for:', email);
    const res = await axios.post(apiUrl(API_ENDPOINTS.AUTH.LOGIN), { email, password });
    console.log('✅ Login successful, token received:', res.data.token ? `${res.data.token.substring(0, 20)}...` : 'null');
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