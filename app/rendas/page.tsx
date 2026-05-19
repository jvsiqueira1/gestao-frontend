"use client";
import { useEffect, useState } from "react";
import {
  CaretLeft,
  CaretRight,
  Plus,
  PencilSimple,
  Trash,
  Repeat,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { fmtBRL, fmtDate, MONTH_NAMES_FULL } from "../../lib/format";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import Segmented from "../../components/ui/Segmented";
import Toggle from "../../components/ui/Toggle";
import Pill from "../../components/ui/Pill";
import CatChip, { categoryColor } from "../../components/ui/CatChip";

interface Income {
  id: number | string;
  description: string;
  value: number;
  date: string;
  category_id: number | null;
  category_name?: string;
  isFixed?: boolean;
  pending?: boolean;
  recurrenceType?: string;
  startDate?: string;
  endDate?: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

type FilterMode = "all" | "fixed";

const today = () => new Date().toISOString().split("T")[0];

export default function RendasPage() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    value: "",
    date: today(),
    category_id: "",
    isFixed: false,
    recurrenceType: "monthly",
    startDate: today(),
    endDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = `?month=${month}&year=${year}`;
      const [iRes, cRes] = await Promise.all([
        fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME) + params, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl(API_ENDPOINTS.CATEGORY), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [iData, cData] = await Promise.all([iRes.json(), cRes.json()]);
      setIncomes(Array.isArray(iData) ? iData : []);
      setCategories(Array.isArray(cData) ? cData.filter((c: Category) => c.type === "income") : []);
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const filtered = incomes
    .filter((e) => (filter === "fixed" ? e.isFixed : true))
    .filter((e) =>
      search.trim() ? e.description.toLowerCase().includes(search.trim().toLowerCase()) : true
    );

  const total = incomes.filter((e) => !e.pending).reduce((s, e) => s + parseFloat(String(e.value)), 0);
  const fixedTotal = incomes.filter((e) => e.isFixed && !e.pending).reduce((s, e) => s + parseFloat(String(e.value)), 0);

  const resetForm = () => {
    setFormData({
      description: "",
      value: "",
      date: today(),
      category_id: "",
      isFixed: false,
      recurrenceType: "monthly",
      startDate: today(),
      endDate: "",
    });
    setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId
        ? `${apiUrl(API_ENDPOINTS.FINANCE.INCOME)}/${editingId}`
        : apiUrl(API_ENDPOINTS.FINANCE.INCOME);
      const method = editingId ? "PUT" : "POST";
      const body = {
        description: formData.description,
        value: parseFloat(formData.value),
        date: formData.date,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        isFixed: formData.isFixed,
        recurrenceType: formData.isFixed ? formData.recurrenceType : null,
        startDate: formData.isFixed ? formData.startDate : null,
        endDate: formData.isFixed && formData.endDate ? formData.endDate : null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erro ao salvar.");
        return;
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Excluir esta renda?")) return;
    setDeleting(id);
    try {
      await fetch(`${apiUrl(API_ENDPOINTS.FINANCE.INCOME)}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (e: Income) => {
    setEditingId(typeof e.id === "number" ? e.id : null);
    setFormData({
      description: e.description,
      value: String(e.value),
      date: new Date(e.date).toISOString().split("T")[0],
      category_id: e.category_id ? String(e.category_id) : "",
      isFixed: !!e.isFixed,
      recurrenceType: e.recurrenceType || "monthly",
      startDate: e.startDate ? new Date(e.startDate).toISOString().split("T")[0] : today(),
      endDate: e.endDate ? new Date(e.endDate).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Movimentos</div>
          <h1 className="page-title">Rendas</h1>
          <p className="page-sub">
            {MONTH_NAMES_FULL[month - 1]} de {year} · {incomes.length} lançamentos · {fmtBRL(total)} no total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center"
            style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8 }}
          >
            <button className="btn btn-ghost btn-icon" onClick={goPrev} aria-label="Anterior">
              <CaretLeft size={14} />
            </button>
            <span className="num" style={{ padding: "0 6px", fontSize: 12.5, fontWeight: 500 }}>
              {MONTH_NAMES_FULL[month - 1]} {year}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={goNext} aria-label="Próximo">
              <CaretRight size={14} />
            </button>
          </div>
          <a href="/rendas/fixas" className="btn btn-outline">
            <Repeat size={14} /> Fixas
          </a>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus size={14} /> Nova renda
          </button>
        </div>
      </div>

      <div
        className="grid mb-[var(--gap)]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}
      >
        <Stat label="Total no mês" value={fmtBRL(total)} hint={`${incomes.length} lançamentos`} />
        <Stat label="Rendas fixas" value={fmtBRL(fixedTotal)} hint={`${incomes.filter((i) => i.isFixed).length} recorrentes`} />
        <Stat label="Rendas variáveis" value={fmtBRL(total - fixedTotal)} hint={`${incomes.filter((i) => !i.isFixed).length} avulsas`} />
      </div>

      <div className="tbl-wrap">
        <div className="tbl-head">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              {
                value: "all",
                label: (
                  <>
                    Todas <span className="num" style={{ marginLeft: 4, opacity: 0.6 }}>{incomes.length}</span>
                  </>
                ),
              },
              {
                value: "fixed",
                label: (
                  <>
                    Fixas{" "}
                    <span className="num" style={{ marginLeft: 4, opacity: 0.6 }}>
                      {incomes.filter((i) => i.isFixed).length}
                    </span>
                  </>
                ),
              },
            ]}
          />
          <div
            className="flex items-center gap-2"
            style={{
              height: 30,
              padding: "0 10px",
              background: "var(--surface)",
              borderRadius: 8,
              border: "1px solid var(--border-soft)",
              width: 220,
            }}
          >
            <MagnifyingGlass size={14} style={{ color: "var(--muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="w-full bg-transparent outline-none"
              style={{ fontSize: 12.5 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>
            Nenhuma renda neste filtro.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Descrição</th>
                <th>Categoria</th>
                <th>Data</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="grid place-items-center"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "var(--surface)",
                          color: "var(--fg-soft)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: "1px solid var(--border-soft)",
                        }}
                      >
                        {(e.description || "?")[0].toUpperCase()}
                      </span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{e.description}</div>
                        {e.isFixed && (
                          <div
                            className="inline-flex items-center gap-1"
                            style={{
                              fontSize: 10.5,
                              color: "var(--muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            <Repeat size={10} /> recorrente · {e.recurrenceType === "yearly" ? "anual" : "mensal"}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {e.category_name && (
                      <CatChip name={e.category_name} color={categoryColor(e.category_id || e.category_name)} />
                    )}
                  </td>
                  <td style={{ color: "var(--fg-soft)" }}>{fmtDate(e.date)}</td>
                  <td className="num" style={{ textAlign: "right", color: "var(--pos)", fontWeight: 500 }}>
                    +{fmtBRL(parseFloat(String(e.value))).replace("R$", "").trim()}
                  </td>
                  <td>{e.isFixed ? <Pill tone="info">fixa</Pill> : <Pill>avulsa</Pill>}</td>
                  <td>
                    <div className="row-actions">
                      <button aria-label="Editar" onClick={() => openEdit(e)}>
                        <PencilSimple size={14} />
                      </button>
                      <button
                        aria-label="Excluir"
                        onClick={() => typeof e.id === "number" && remove(e.id)}
                        disabled={deleting === e.id}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <Modal
          title={editingId ? "Editar renda" : "Nova renda"}
          subtitle={`Registre uma renda em ${MONTH_NAMES_FULL[month - 1]} de ${year}.`}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
        >
          <form onSubmit={submit} className="grid gap-3.5">
            <div className="field">
              <label>Descrição</label>
              <input
                className="input"
                required
                autoFocus
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Salário maio"
              />
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label>Valor</label>
                <input
                  className="input input-currency"
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="field">
                <label>Data</label>
                <input
                  className="input"
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Categoria</label>
              <select
                className="select"
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Toggle
              checked={formData.isFixed}
              onChange={(v) => setFormData({ ...formData, isFixed: v, startDate: v ? formData.date : formData.startDate })}
            >
              Renda fixa <span style={{ color: "var(--muted)", marginLeft: 4 }}>— se repete todo mês/ano</span>
            </Toggle>
            {formData.isFixed && (
              <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="field">
                  <label>Recorrência</label>
                  <select
                    className="select"
                    value={formData.recurrenceType}
                    onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="field">
                  <label>Início</label>
                  <input
                    className="input"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Fim (opcional)</label>
                  <input
                    className="input"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                {editingId ? "Atualizar" : "Salvar renda"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        style={{
          fontSize: 10.5,
          color: "var(--muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div className="font-display num" style={{ fontSize: 24, marginTop: 8, fontWeight: 600 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
