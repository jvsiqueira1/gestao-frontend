"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function TrocarSenhaPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setErro("");
  }, [password, confirm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!token) {
      setErro("Token inválido ou ausente.");
      return;
    }
    if (password.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErro("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      setLoading(false);
      if (res.ok) {
        setSucesso(true);
        setRedirecting(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        const data = await res.json();
        setErro(data.error || "Erro ao trocar senha. Tente novamente.");
      }
    } catch (err) {
      setLoading(false);
      setErro("Erro ao trocar senha. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-light dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-10">
        <h2 className="text-3xl font-extrabold text-primary-700 dark:text-primary-400 mb-2 text-center">Trocar senha</h2>
        <p className="text-text-secondary dark:text-gray-300 text-center mb-8">Digite sua nova senha abaixo.</p>
        {sucesso ? (
          <div className="text-center">
            <div className="bg-feedback-success/90 text-white rounded-md px-3 py-2 text-sm mb-4">Senha alterada com sucesso! Você já pode fazer login com sua nova senha.</div>
            {redirecting && <div className="text-text-secondary dark:text-gray-300 text-sm">Redirecionando para o login...</div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-11 px-4 border border-neutral-dark dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-white dark:bg-gray-700 text-text-primary dark:text-white placeholder:text-text-muted dark:placeholder-gray-400 transition text-base shadow-sm"
                placeholder="Digite a nova senha"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">Confirmar nova senha</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full h-11 px-4 border border-neutral-dark dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-white dark:bg-gray-700 text-text-primary dark:text-white placeholder:text-text-muted dark:placeholder-gray-400 transition text-base shadow-sm"
                placeholder="Confirme a nova senha"
                autoComplete="new-password"
              />
            </div>
            {erro && <div className="bg-feedback-error/90 text-white rounded-md px-3 py-2 text-sm text-center animate-shake">{erro}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-400 dark:hover:bg-primary-500 text-white font-semibold py-3 rounded-lg transition-colors duration-200 text-base shadow-sm"
              aria-label="Trocar senha"
            >
              {loading ? "Enviando..." : "Trocar senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 