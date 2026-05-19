"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import Button from "../../components/Button";

export default function ProfileClient() {
  const { user } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  if (!user) return null;

  const requestPasswordReset = async () => {
    setResetting(true);
    setResetMsg("");
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.AUTH.FORGOT), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      setResetMsg(data.dev_reset_url ? `Link gerado: ${data.dev_reset_url}` : data.message || "Solicitação enviada.");
    } catch {
      setResetMsg("Erro ao solicitar troca de senha.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Suas informações de conta.</p>
      </header>

      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-foreground text-background grid place-items-center text-base font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-medium truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Nome</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Email</dt>
            <dd>{user.email}</dd>
          </div>
          {user.created_at && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Membro desde</dt>
              <dd>{new Date(user.created_at).toLocaleDateString("pt-BR")}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold mb-2">Senha</h2>
        <p className="text-xs text-muted-foreground mb-4">Envie um link de redefinição para o seu e-mail.</p>
        <Button onClick={requestPasswordReset} loading={resetting} variant="secondary">
          Solicitar troca de senha
        </Button>
        {resetMsg && <p className="text-xs text-muted-foreground mt-3 break-all">{resetMsg}</p>}
      </section>
    </div>
  );
}
