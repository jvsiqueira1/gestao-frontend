"use client";
import { useEffect, useState } from "react";
import { Plus, PencilSimple, Trash, DotsThreeVertical, ArrowCounterClockwise } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { fmtBRL } from "../../lib/format";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import Segmented from "../../components/ui/Segmented";
import { categoryColor, PALETTE } from "../../components/ui/CatChip";

interface Category {
  id: number;
  name: string;
  type: "expense" | "income";
  color?: string | null;
}

interface Stat {
  count: number;
  total: number;
}

interface MissingDefault {
  name: string;
  type: "expense" | "income";
}

export default function CategoriasPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Record<number, Stat>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"expense" | "income">("expense");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState<string>(PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [missingDefaults, setMissingDefaults] = useState<MissingDefault[]>([]);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const cRes = await fetch(apiUrl(API_ENDPOINTS.CATEGORY), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cData = await cRes.json();
      const cats: Category[] = Array.isArray(cData) ? cData : [];
      setCategories(cats);

      const [eRes, iRes] = await Promise.all([
        fetch(apiUrl(API_ENDPOINTS.FINANCE.EXPENSE), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [eData, iData] = await Promise.all([eRes.json(), iRes.json()]);
      const all = [...(Array.isArray(eData) ? eData : []), ...(Array.isArray(iData) ? iData : [])];
      const map: Record<number, Stat> = {};
      for (const t of all) {
        if (!t.category_id) continue;
        if (!map[t.category_id]) map[t.category_id] = { count: 0, total: 0 };
        map[t.category_id].count++;
        map[t.category_id].total += parseFloat(String(t.value)) || 0;
      }
      setStats(map);

      // Categorias padrão faltantes (deletadas pelo usuário)
      const mRes = await fetch(`${apiUrl(API_ENDPOINTS.CATEGORY)}/defaults/missing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mData = await mRes.json().catch(() => []);
      setMissingDefaults(Array.isArray(mData) ? mData : []);
    } finally {
      setLoading(false);
    }
  };

  const restoreDefaults = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const res = await fetch(`${apiUrl(API_ENDPOINTS.CATEGORY)}/restore-defaults`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erro ao restaurar categorias padrão.");
        return;
      }
      await fetchAll();
    } finally {
      setRestoring(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    // sugere uma cor da paleta ainda não usada nas categorias da aba atual
    const used = new Set(categories.filter((c) => c.type === tab && c.color).map((c) => c.color));
    setFormColor(PALETTE.find((c) => !used.has(c)) || PALETTE[0]);
    setError("");
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setFormName(c.name);
    setFormColor(c.color || categoryColor(c.id));
    setError("");
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const url = editingId
        ? `${apiUrl(API_ENDPOINTS.CATEGORY)}/${editingId}`
        : apiUrl(API_ENDPOINTS.CATEGORY);
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: formName, type: tab, color: formColor || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Erro ao salvar.");
        return;
      }
      setShowForm(false);
      fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Excluir esta categoria? Lançamentos vinculados ficarão sem categoria.")) return;
    await fetch(`${apiUrl(API_ENDPOINTS.CATEGORY)}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  };

  const list = categories.filter((c) => c.type === tab);
  const missingForTab = missingDefaults.filter((m) => m.type === tab);
  const breakdown = list
    .map((c) => ({ id: c.id, name: c.name, value: stats[c.id]?.total || 0, color: categoryColor(c.id, c.color) }))
    .filter((b) => b.value > 0)
    .sort((a, b) => b.value - a.value);
  const totalBreak = breakdown.reduce((s, b) => s + b.value, 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Configurações</div>
          <h1 className="page-title">Categorias</h1>
          <p className="page-sub">Organize seus lançamentos em rótulos que fazem sentido para você.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={14} /> Nova categoria
        </Button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "expense", label: "Despesas" },
            { value: "income", label: "Rendas" },
          ]}
        />
      </div>

      {!loading && missingForTab.length > 0 && (
        <div
          className="flex items-center gap-3"
          style={{
            border: "1px solid var(--border-soft)",
            background: "var(--bg-elev)",
            borderRadius: "var(--r)",
            padding: "12px 14px",
            marginBottom: 16,
          }}
        >
          <ArrowCounterClockwise size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <div className="flex-1 min-w-0" style={{ fontSize: 13, lineHeight: 1.4 }}>
            <b style={{ fontWeight: 600 }}>
              {missingForTab.length} {missingForTab.length === 1 ? "categoria padrão" : "categorias padrão"} faltando
            </b>{" "}
            <span style={{ color: "var(--muted)" }}>
              ({missingForTab.map((m) => m.name).join(", ")})
            </span>
          </div>
          <Button variant="ghost" onClick={restoreDefaults} loading={restoring}>
            Restaurar
          </Button>
        </div>
      )}

      {loading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : list.length === 0 ? (
        <div className="card text-center py-12" style={{ color: "var(--muted)" }}>
          Nenhuma categoria de {tab === "expense" ? "despesa" : "renda"} ainda.
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {list.map((c) => {
            const st = stats[c.id] || { count: 0, total: 0 };
            return (
              <div
                key={c.id}
                className="border bg-bg-elev flex items-center gap-3"
                style={{
                  borderColor: "var(--border-soft)",
                  borderRadius: "var(--r)",
                  padding: "14px 16px",
                }}
              >
                <div
                  className="grid place-items-center text-white font-semibold"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: categoryColor(c.id, c.color),
                    fontSize: 12,
                  }}
                >
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0" style={{ lineHeight: 1.25 }}>
                  <b style={{ fontSize: 13, fontWeight: 600, display: "block" }}>{c.name}</b>
                  <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    <span className="num">{st.count}</span> lançamentos · {fmtBRL(st.total)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="btn btn-ghost btn-icon"
                    aria-label="Editar"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="btn btn-ghost btn-icon"
                    aria-label="Excluir"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2"
            style={{
              border: "1.5px dashed var(--border)",
              borderRadius: "var(--r)",
              padding: "14px 16px",
              color: "var(--muted)",
              background: "transparent",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Adicionar categoria
          </button>
        </div>
      )}

      {breakdown.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="card-title mb-3">Distribuição</div>
          <div className="card">
            <div
              className="flex w-full overflow-hidden mb-4"
              style={{ height: 12, borderRadius: 999, background: "var(--surface)" }}
            >
              {breakdown.map((b) => (
                <div
                  key={b.id}
                  style={{ background: b.color, width: `${(b.value / totalBreak) * 100}%` }}
                  title={b.name}
                />
              ))}
            </div>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
            >
              {breakdown.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between items-center gap-2"
                  style={{ fontSize: 12.5, padding: "6px 0" }}
                >
                  <span className="inline-flex items-center gap-2 truncate">
                    <span
                      style={{ width: 8, height: 8, borderRadius: 999, background: b.color, flexShrink: 0 }}
                    />
                    <span style={{ color: "var(--fg-soft)" }} className="truncate">
                      {b.name}
                    </span>
                  </span>
                  <span className="num font-mono" style={{ fontSize: 12 }}>
                    {((b.value / totalBreak) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <Modal
          title={editingId ? "Editar categoria" : "Nova categoria"}
          subtitle={`Tipo: ${tab === "expense" ? "Despesa" : "Renda"}`}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={submit} className="grid gap-3.5">
            <div className="field">
              <label>Nome</label>
              <input
                className="input"
                required
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Cor</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PALETTE.map((c) => {
                  const active = formColor.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      onClick={() => setFormColor(c)}
                      className="grid place-items-center"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        background: c,
                        cursor: "pointer",
                        border: active ? "2px solid var(--fg)" : "2px solid transparent",
                        boxShadow: active ? "0 0 0 2px var(--bg-elev)" : "none",
                      }}
                    />
                  );
                })}
                <label
                  className="grid place-items-center"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    border: "1px dashed var(--border)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    background: PALETTE.includes(formColor) ? "transparent" : formColor,
                  }}
                  title="Cor personalizada"
                >
                  {PALETTE.includes(formColor) && (
                    <Plus size={13} style={{ color: "var(--muted)" }} />
                  )}
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  />
                </label>
              </div>
            </div>
            {error && (
              <p className="text-xs" style={{ color: "var(--neg)" }}>
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                Salvar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
