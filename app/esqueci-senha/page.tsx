"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setLoading(false);
      if (res.ok) {
        setEnviado(true);
        setRedirecting(true);
        setTimeout(() => router.push("/"), 2000);
      } else {
        const data = await res.json();
        setErro(data.error || "Erro ao enviar e-mail. Tente novamente.");
      }
    } catch (err) {
      setLoading(false);
      setErro("Erro ao enviar e-mail. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-light dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-10">
        <h2 className="text-3xl font-extrabold text-primary-700 dark:text-primary-400 mb-2 text-center">Recuperar senha</h2>
        <p className="text-text-secondary dark:text-gray-300 text-center mb-8">Informe seu e-mail para receber o link de redefinição de senha.</p>
        {enviado ? (
          <div className="text-center">
            <div className="bg-feedback-success/90 text-white rounded-md px-3 py-2 text-sm mb-4">Se o e-mail existir, enviaremos instruções para redefinir sua senha.</div>
            {redirecting && <div className="text-text-secondary dark:text-gray-300 text-sm">Redirecionando para a página inicial...</div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-white mb-1">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 border border-neutral-dark dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-white dark:bg-gray-700 text-text-primary dark:text-white placeholder:text-text-muted dark:placeholder-gray-400 transition text-base shadow-sm"
                placeholder="Digite seu e-mail"
                autoComplete="email"
                autoFocus
              />
            </div>
            {erro && <div className="bg-feedback-error/90 text-white rounded-md px-3 py-2 text-sm text-center animate-shake">{erro}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-400 dark:hover:bg-primary-500 text-white font-semibold py-3 rounded-lg transition-colors duration-200 text-base shadow-sm"
              aria-label="Enviar e-mail de recuperação"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 