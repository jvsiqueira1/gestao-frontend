"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import Button from "../../components/Button";

function TrocarSenhaInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setErr(""), [password, confirm]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setErr("Token inválido ou ausente.");
    if (password.length < 6) return setErr("Senha precisa ter ao menos 6 caracteres.");
    if (password !== confirm) return setErr("As senhas não coincidem.");
    setLoading(true);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.AUTH.RESET), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Erro ao trocar senha.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight mb-2">Trocar senha</h1>
        <p className="text-sm text-muted-foreground mb-6">Defina sua nova senha.</p>

        {done ? (
          <p className="text-sm">Senha alterada. Redirecionando para login…</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Confirmar nova senha</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button type="submit" loading={loading} size="lg" className="w-full">Trocar</Button>
            <p className="text-xs text-muted-foreground text-center">
              <Link href="/login" className="underline">Voltar ao login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando…</div>}>
      <TrocarSenhaInner />
    </Suspense>
  );
}
