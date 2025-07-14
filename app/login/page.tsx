"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Button from "../../components/Button";
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-light dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-10">
        <h2 className="text-3xl font-extrabold text-primary-700 dark:text-primary-400 mb-2 text-center">Bem-vindo de volta</h2>
        <p className="text-text-secondary dark:text-gray-300 text-center mb-8">Acesse sua conta para gerenciar seus gastos</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-white mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 border border-neutral-dark dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-white dark:bg-gray-700 text-text-primary dark:text-white placeholder:text-text-muted dark:placeholder-gray-400 transition text-base shadow-sm"
              placeholder="Digite seu email"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary dark:text-white mb-1">Senha</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full h-11 px-4 pr-10 border border-neutral-dark dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-white dark:bg-gray-700 text-text-primary dark:text-white placeholder:text-text-muted dark:placeholder-gray-400 transition text-base shadow-sm"
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2 top-8 text-text-muted dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-lg focus:outline-none"
              style={{ top: '2.1rem' }}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <div className="flex justify-end mt-1">
              <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium">Esqueceu a senha?</a>
            </div>
          </div>
          {error && <div className="bg-feedback-error/90 text-white rounded-md px-3 py-2 text-sm text-center animate-shake">{error}</div>}
          <Button
            type="submit"
            loading={loading}
            className="w-full mt-2"
            size="lg"
            aria-label="Entrar"
          >
            Entrar
          </Button>
        </form>
        <div className="mt-8 text-center text-sm text-text-secondary dark:text-gray-300">
          Não tem conta? <a href="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Cadastre-se</a>
        </div>
      </div>
    </div>
  );
} 