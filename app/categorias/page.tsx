"use client";
import { useEffect, useState } from "react";
import { Plus, PencilSimple, Trash, DotsThreeVertical } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { fmtBRL } from "../../lib/format";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import Segmented from "../../components/ui/Segmented";
import { categoryColor } from "../../components/ui/CatChip";

interface Category {
  id: number;
  name: string;
  type: "expense" | "income";
}

interface Stat {
  count: number;
  total: number;
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setError("");
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setFormName(c.name);
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
        body: JSON.stringify({ name: formName, type: tab }),
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
  const breakdown = list
    .map((c) => ({ id: c.id, name: c.name, value: stats[c.id]?.total || 0, color: categoryColor(c.id) }))
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
                    background: categoryColor(c.id),
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
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label="Editar"
                  >
                    <PencilSimple size={13} />
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label="Excluir"
                  >
                    <Trash size={13} />
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
