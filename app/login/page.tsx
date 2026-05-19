"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-form">
        <div className="flex items-center gap-2.5 mb-14">
          <div
            className="grid place-items-center"
            style={{
              width: 36,
              height: 36,
              background: "var(--fg)",
              color: "var(--bg)",
              borderRadius: 10,
              fontFamily: "var(--font-display-stack)",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            G
          </div>
          <div className="flex flex-col" style={{ lineHeight: 1.1 }}>
            <b style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Gestão</b>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>finanças pessoais</span>
          </div>
        </div>

        <div className="page-eyebrow mb-2">Entrar</div>
        <h1 className="page-title" style={{ fontSize: 40 }}>
          Bem-vindo de volta.
        </h1>
        <p className="page-sub mb-9">
          Continue acompanhando suas finanças, despesas fixas e metas em um só lugar.
        </p>

        <form onSubmit={submit} className="grid gap-3.5" style={{ maxWidth: 380 }}>
          <div className="field">
            <label>E-mail</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="field">
            <label>
              <span className="flex justify-between">
                Senha
                <Link
                  href="/esqueci-senha"
                  style={{ color: "var(--accent)", fontWeight: 500 }}
                >
                  esqueci minha senha
                </Link>
              </span>
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <label className="toggle mt-1">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
            <span className="toggle-track" />
            <span>Manter conectado</span>
          </label>

          {error && (
            <div
              className="text-xs"
              style={{
                color: "var(--neg)",
                background: "var(--neg-soft)",
                padding: "8px 10px",
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="mt-2 justify-center" loading={loading}>
            Entrar na minha conta
          </Button>
        </form>

        <div
          className="mt-auto"
          style={{ paddingTop: 56, fontSize: 11.5, color: "var(--muted)" }}
        >
          © 2026 Gestão · v2.0
        </div>
      </div>

      <div className="login-art">
        <div className="login-quote">
          Saber para onde vai cada real é o primeiro passo para fazer o dinheiro trabalhar para você.
          <span className="sub">
            Gestão é um app de finanças pessoais sem complicação. Sem planilhas, sem extratos
            confusos — só o que você precisa para tomar decisões melhores.
          </span>
        </div>
      </div>
    </div>
  );
}
