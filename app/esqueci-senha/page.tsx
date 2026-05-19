"use client";
import { useState } from "react";
import Link from "next/link";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import Button from "../../components/Button";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.AUTH.FORGOT), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Erro ao solicitar.");
        return;
      }
      setSent(true);
      if (data.dev_reset_url) setDevUrl(data.dev_reset_url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight mb-2">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground mb-6">Envie seu e-mail para gerar um link de redefinição.</p>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm">Se o e-mail existir, o link foi gerado.</p>
            {devUrl && (
              <div className="text-xs rounded-md border bg-card p-3 break-all">
                <p className="text-muted-foreground mb-1">Link (dev):</p>
                <a className="underline" href={devUrl}>{devUrl}</a>
              </div>
            )}
            <Link href="/login" className="text-sm underline text-muted-foreground">← Voltar</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground">E-mail</label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button type="submit" loading={loading} size="lg" className="w-full">Enviar</Button>
            <p className="text-xs text-muted-foreground text-center">
              <Link href="/login" className="underline">Voltar ao login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
