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

  const initial = (user.name?.[0] || user.email[0] || "?").toUpperCase();
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Configurações</div>
          <h1 className="page-title">Perfil</h1>
          <p className="page-sub">Suas informações de conta.</p>
        </div>
      </div>

      <div className="grid gap-[var(--gap)]" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)" }}>
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="grid place-items-center font-display"
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "var(--accent-soft)",
                color: "var(--accent-ink)",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {initial}
            </div>
            <div>
              <h2
                className="font-display"
                style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}
              >
                {user.name}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>{user.email}</p>
            </div>
          </div>

          <dl
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
          >
            <Field label="Nome" value={user.name} />
            <Field label="Email" value={user.email} />
            {memberSince && <Field label="Membro desde" value={memberSince} />}
            <Field label="ID" value={`#${user.id}`} />
          </dl>
        </div>

        <div className="card">
          <h3
            className="font-display mb-2"
            style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}
          >
            Segurança
          </h3>
          <p style={{ fontSize: 12, color: "var(--muted)" }} className="mb-4">
            Envie um link de redefinição de senha para o seu e-mail.
          </p>
          <Button onClick={requestPasswordReset} loading={resetting} variant="outline" size="sm">
            Solicitar troca de senha
          </Button>
          {resetMsg && (
            <p
              className="text-xs mt-3 break-all"
              style={{ color: "var(--fg-soft)" }}
            >
              {resetMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        style={{
          fontSize: 10.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--muted)",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </dt>
      <dd style={{ fontSize: 14, color: "var(--fg)" }}>{value}</dd>
    </div>
  );
}
