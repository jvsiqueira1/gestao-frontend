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
import { bulkDelete } from "../../lib/bulk";
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
  category_color?: string | null;
  isFixed?: boolean;
  pending?: boolean;
  recurrenceType?: string;
  startDate?: string;
  endDate?: string;
}

interface FixedIncome {
  id: number;
  description: string;
  value: number;
  category_id: number | null;
  category?: { id: number; name: string } | null;
  recurrenceType: string;
  startDate: string;
  endDate: string | null;
}

interface Category {
  id: number;
  name: string;
  type: string;
  color?: string | null;
}

type ViewMode = "all" | "fixed";
type EditTarget = { kind: "occurrence"; id: number } | { kind: "fixed"; id: number } | null;

const today = () => new Date().toISOString().split("T")[0];

export default function RendasPage() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [fixedTemplates, setFixedTemplates] = useState<FixedIncome[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("all");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, month, year]);

  const fetchData = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const params = `?month=${month}&year=${year}`;
      const [iRes, fRes, cRes] = await Promise.all([
        fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME) + params, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl(API_ENDPOINTS.FIXED_INCOMES), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl(API_ENDPOINTS.CATEGORY), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [iData, fData, cData] = await Promise.all([iRes.json(), fRes.json(), cRes.json()]);
      setIncomes(Array.isArray(iData) ? iData : []);
      setFixedTemplates(Array.isArray(fData) ? fData : []);
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

  const realized = incomes.filter((e) => !e.pending);
  const total = realized.reduce((s, e) => s + parseFloat(String(e.value)), 0);
  const fixedTotal = fixedTemplates
    .filter((f) => f.recurrenceType === "monthly")
    .reduce((s, f) => s + parseFloat(String(f.value)), 0);

  const occurrencesFiltered = realized.filter((e) =>
    search.trim() ? e.description.toLowerCase().includes(search.trim().toLowerCase()) : true
  );
  const templatesFiltered = fixedTemplates.filter((f) =>
    search.trim() ? f.description.toLowerCase().includes(search.trim().toLowerCase()) : true
  );

  const resetForm = () => {
    setFormData({
      description: "",
      value: "",
      date: today(),
      category_id: "",
      isFixed: view === "fixed",
      recurrenceType: "monthly",
      startDate: today(),
      endDate: "",
    });
    setEditTarget(null);
  };

  const openCreate = () => {
    resetForm();
    setFormData((f) => ({ ...f, isFixed: view === "fixed" }));
    setShowForm(true);
  };

  const openEditOccurrence = (e: Income) => {
    setEditTarget({ kind: "occurrence", id: Number(e.id) });
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

  const openEditTemplate = (f: FixedIncome) => {
    setEditTarget({ kind: "fixed", id: f.id });
    setFormData({
      description: f.description,
      value: String(f.value),
      date: today(),
      category_id: f.category_id ? String(f.category_id) : "",
      isFixed: true,
      recurrenceType: f.recurrenceType,
      startDate: f.startDate.split("T")[0],
      endDate: f.endDate ? f.endDate.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget?.kind === "fixed") {
        const body = {
          description: formData.description,
          value: parseFloat(formData.value),
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          recurrenceType: formData.recurrenceType,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
        };
        const res = await fetch(`${apiUrl(API_ENDPOINTS.FIXED_INCOMES)}/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Erro ao salvar.");
          return;
        }
      } else {
        const url =
          editTarget?.kind === "occurrence"
            ? `${apiUrl(API_ENDPOINTS.FINANCE.INCOME)}/${editTarget.id}`
            : apiUrl(API_ENDPOINTS.FINANCE.INCOME);
        const method = editTarget?.kind === "occurrence" ? "PUT" : "POST";
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
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const removeOccurrence = async (id: number) => {
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

  const removeTemplate = async (id: number) => {
    if (!confirm("Excluir esta renda fixa? Todos os lançamentos vinculados serão removidos.")) return;
    setDeleting(id);
    try {
      await fetch(`${apiUrl(API_ENDPOINTS.FIXED_INCOMES)}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } finally {
      setDeleting(null);
    }
  };

  const selectableIds = occurrencesFiltered
    .filter((e) => typeof e.id === "number")
    .map((e) => e.id as number);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const toggleAll = () => {
    setSelectedIds((prev) =>
      selectableIds.every((id) => prev.has(id)) ? new Set() : new Set(selectableIds)
    );
  };
  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const bulkRemove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Excluir ${ids.length} renda${ids.length > 1 ? "s" : ""}? Esta ação não pode ser desfeita.`))
      return;
    setBulkDeleting(true);
    try {
      const { fail } = await bulkDelete(
        ids,
        (id) => `${apiUrl(API_ENDPOINTS.FINANCE.INCOME)}/${id}`,
        token
      );
      if (fail.length) alert(`${fail.length} renda(s) não puderam ser excluídas.`);
      setSelectedIds(new Set());
      fetchData();
    } finally {
      setBulkDeleting(false);
    }
  };

  const createLabel = view === "fixed" ? "Nova renda fixa" : "Nova renda";
  const modalTitle =
    editTarget?.kind === "fixed"
      ? "Editar renda fixa"
      : editTarget?.kind === "occurrence"
      ? "Editar renda"
      : view === "fixed"
      ? "Nova renda fixa"
      : "Nova renda";

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Movimentos</div>
          <h1 className="page-title">Rendas</h1>
          <p className="page-sub">
            {MONTH_NAMES_FULL[month - 1]} de {year} · {realized.length} lançamentos · {fmtBRL(total)} no total
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
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={14} /> {createLabel}
          </button>
        </div>
      </div>

      <div
        className="grid mb-[var(--gap)]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}
      >
        <Stat label="Total no mês" value={fmtBRL(total)} hint={`${realized.length} lançamentos`} />
        <Stat
          label="Rendas fixas"
          value={fmtBRL(fixedTotal)}
          hint={`${fixedTemplates.length} templates · ${realized.filter((i) => i.isFixed).length} no mês`}
        />
        <Stat
          label="Avulsas"
          value={fmtBRL(
            total - realized.filter((i) => i.isFixed).reduce((s, i) => s + parseFloat(String(i.value)), 0)
          )}
          hint={`${realized.filter((i) => !i.isFixed).length} lançamentos`}
        />
      </div>

      <div className="tbl-wrap">
        <div className="tbl-head">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              {
                value: "all",
                label: (
                  <>
                    Lançamentos <span className="num" style={{ marginLeft: 4, opacity: 0.6 }}>{realized.length}</span>
                  </>
                ),
              },
              {
                value: "fixed",
                label: (
                  <>
                    Fixas <span className="num" style={{ marginLeft: 4, opacity: 0.6 }}>{fixedTemplates.length}</span>
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

        {view === "all" && selectedIds.size > 0 && (
          <div
            className="flex items-center justify-between gap-3"
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-soft)",
              background: "var(--surface)",
            }}
          >
            <span style={{ fontSize: 13 }}>
              <b className="num">{selectedIds.size}</b> selecionada{selectedIds.size > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>
                Limpar
              </button>
              <button
                className="btn btn-destructive btn-sm"
                onClick={bulkRemove}
                disabled={bulkDeleting}
              >
                <Trash size={14} /> Excluir selecionadas
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : view === "fixed" ? (
          templatesFiltered.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>
              Nenhuma renda fixa configurada.
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: "36%" }}>Descrição</th>
                  <th>Categoria</th>
                  <th>Recorrência</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {templatesFiltered.map((f) => {
                  const catName =
                    f.category?.name || categories.find((c) => c.id === f.category_id)?.name;
                  return (
                    <tr key={f.id}>
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
                            {f.description[0].toUpperCase()}
                          </span>
                          <div>
                            <div style={{ fontWeight: 500 }}>{f.description}</div>
                            <div
                              className="inline-flex items-center gap-1"
                              style={{
                                fontSize: 10.5,
                                color: "var(--muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                              }}
                            >
                              <Repeat size={10} /> recorrente
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {catName && (
                          <CatChip
                            name={catName}
                            color={categoryColor(
                              f.category_id ?? catName,
                              categories.find((c) => c.id === f.category_id)?.color
                            )}
                          />
                        )}
                      </td>
                      <td>
                        <Pill tone="info">{f.recurrenceType === "yearly" ? "anual" : "mensal"}</Pill>
                      </td>
                      <td style={{ color: "var(--fg-soft)" }}>{fmtDate(f.startDate)}</td>
                      <td style={{ color: "var(--fg-soft)" }}>{f.endDate ? fmtDate(f.endDate) : "—"}</td>
                      <td className="num" style={{ textAlign: "right", color: "var(--pos)", fontWeight: 500 }}>
                        +{fmtBRL(parseFloat(String(f.value))).replace("R$", "").trim()}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button aria-label="Editar" onClick={() => openEditTemplate(f)}>
                            <PencilSimple size={14} />
                          </button>
                          <button
                            aria-label="Excluir"
                            onClick={() => removeTemplate(f.id)}
                            disabled={deleting === f.id}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : occurrencesFiltered.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>
            Sem rendas no mês.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Selecionar todos"
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={{ width: "40%" }}>Descrição</th>
                <th>Categoria</th>
                <th>Data</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {occurrencesFiltered.map((e) => (
                <tr key={e.id} style={typeof e.id === "number" && selectedIds.has(e.id) ? { background: "var(--surface)" } : undefined}>
                  <td style={{ width: 36 }}>
                    {typeof e.id === "number" && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(e.id)}
                        onChange={() => toggleId(e.id as number)}
                        aria-label="Selecionar"
                        style={{ cursor: "pointer" }}
                      />
                    )}
                  </td>
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
                            <Repeat size={10} /> recorrente
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {e.category_name && (
                      <CatChip
                        name={e.category_name}
                        color={categoryColor(e.category_id ?? e.category_name, e.category_color)}
                      />
                    )}
                  </td>
                  <td style={{ color: "var(--fg-soft)" }}>{fmtDate(e.date)}</td>
                  <td className="num" style={{ textAlign: "right", color: "var(--pos)", fontWeight: 500 }}>
                    +{fmtBRL(parseFloat(String(e.value))).replace("R$", "").trim()}
                  </td>
                  <td>{e.isFixed ? <Pill tone="info">fixa</Pill> : <Pill>avulsa</Pill>}</td>
                  <td>
                    <div className="row-actions">
                      <button aria-label="Editar" onClick={() => openEditOccurrence(e)}>
                        <PencilSimple size={14} />
                      </button>
                      <button
                        aria-label="Excluir"
                        onClick={() => typeof e.id === "number" && removeOccurrence(e.id)}
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
          title={modalTitle}
          subtitle={
            editTarget?.kind === "fixed" || (view === "fixed" && !editTarget)
              ? "Configure uma renda recorrente."
              : `Registre uma renda em ${MONTH_NAMES_FULL[month - 1]} de ${year}.`
          }
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
                placeholder="Ex: Salário, Freela…"
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
              {editTarget?.kind !== "fixed" && !(view === "fixed" && !editTarget) && (
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
              )}
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
            {editTarget?.kind !== "fixed" && (
              <Toggle
                checked={formData.isFixed}
                onChange={(v) =>
                  setFormData({ ...formData, isFixed: v, startDate: v ? formData.date : formData.startDate })
                }
              >
                Renda fixa{" "}
                <span style={{ color: "var(--muted)", marginLeft: 4 }}>— se repete todo mês/ano</span>
              </Toggle>
            )}
            {(formData.isFixed || editTarget?.kind === "fixed") && (
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
                    required
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
                {editTarget ? "Atualizar" : "Salvar"}
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
