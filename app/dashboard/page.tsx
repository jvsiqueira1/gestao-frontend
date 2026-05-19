"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CaretLeft,
  CaretRight,
  Plus,
  PencilSimple,
  Trash,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { fmtBRL, fmtDate, MONTH_NAMES_FULL, MONTH_NAMES_SHORT } from "../../lib/format";
import { Card, CardHead, CardTitle, CardSub } from "../../components/ui/Card";
import KpiHero from "../../components/ui/KpiHero";
import LineIE from "../../components/charts/LineIE";
import Donut from "../../components/charts/Donut";
import CatChip, { categoryColor } from "../../components/ui/CatChip";
import Segmented from "../../components/ui/Segmented";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/ui/Modal";

interface Goal {
  id: number;
  name: string;
  description?: string;
  target: number;
  saved: number;
  deadline?: string | null;
  status: string;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [periodMode, setPeriodMode] = useState<"week" | "month" | "year">("month");

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editGoalId, setEditGoalId] = useState<number | null>(null);
  const [goalForm, setGoalForm] = useState({ name: "", description: "", target: "", deadline: "" });
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalError, setGoalError] = useState("");

  const [addValueGoalId, setAddValueGoalId] = useState<number | null>(null);
  const [addValueAmount, setAddValueAmount] = useState("");
  const [addValueLoading, setAddValueLoading] = useState(false);

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

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", month, year, token],
    queryFn: async () => {
      const res = await fetch(`${apiUrl(API_ENDPOINTS.FINANCE.DASHBOARD)}?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar dashboard");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["goals", token],
    queryFn: async () => {
      const res = await fetch(apiUrl(API_ENDPOINTS.GOAL), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar metas");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: recentExpenses = [] } = useQuery<any[]>({
    queryKey: ["recent-expenses", month, year, token],
    queryFn: async () => {
      const res = await fetch(`${apiUrl(API_ENDPOINTS.FINANCE.EXPENSE)}?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const arr = await res.json();
      return Array.isArray(arr) ? arr.slice(0, 6) : [];
    },
    enabled: !!token,
  });

  const monthlyIncome = data?.monthlyIncome || 0;
  const monthlyExpense = data?.monthlyExpense || 0;
  const balance = monthlyIncome - monthlyExpense;

  const monthlyData: { month: string; income: number; expense: number }[] =
    data?.monthlyData?.map((m: any, i: number) => ({
      month: typeof m.month === "string" ? m.month : MONTH_NAMES_SHORT[i],
      income: m.income || 0,
      expense: m.expense || 0,
    })) || [];

  const categoryData: { name: string; value: number }[] = data?.categoryData?.slice(0, 8) || [];

  const submitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalSubmitting(true);
    setGoalError("");
    try {
      const url = editGoalId
        ? `${apiUrl(API_ENDPOINTS.GOAL)}/${editGoalId}`
        : apiUrl(API_ENDPOINTS.GOAL);
      const method = editGoalId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: goalForm.name,
          description: goalForm.description,
          target: parseFloat(goalForm.target),
          deadline: goalForm.deadline || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setGoalError(err.error || "Erro ao salvar meta.");
        return;
      }
      setShowGoalModal(false);
      setEditGoalId(null);
      setGoalForm({ name: "", description: "", target: "", deadline: "" });
      queryClient.invalidateQueries({ queryKey: ["goals", token] });
    } finally {
      setGoalSubmitting(false);
    }
  };

  const deleteGoal = async (id: number) => {
    if (!confirm("Excluir esta meta?")) return;
    await fetch(`${apiUrl(API_ENDPOINTS.GOAL)}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    queryClient.invalidateQueries({ queryKey: ["goals", token] });
  };

  const addToGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addValueGoalId) return;
    setAddValueLoading(true);
    try {
      await fetch(`${apiUrl(API_ENDPOINTS.GOAL)}/${addValueGoalId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: addValueAmount }),
      });
      setAddValueGoalId(null);
      setAddValueAmount("");
      queryClient.invalidateQueries({ queryKey: ["goals", token] });
    } finally {
      setAddValueLoading(false);
    }
  };

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">
            {MONTH_NAMES_FULL[month - 1]} · {year}
          </div>
          <h1 className="page-title">
            {greeting}, {firstName}.
          </h1>
          <p className="page-sub">Aqui está um resumo das suas finanças neste mês.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Segmented
            value={periodMode}
            onChange={setPeriodMode}
            options={[
              { value: "week", label: "Semana" },
              { value: "month", label: "Mês" },
              { value: "year", label: "Ano" },
            ]}
          />
          <div
            className="flex items-center"
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            <button className="btn btn-ghost btn-icon" onClick={goPrev} aria-label="Mês anterior">
              <CaretLeft size={14} />
            </button>
            <span
              className="num"
              style={{ padding: "0 6px", fontSize: 12.5, fontWeight: 500 }}
            >
              {MONTH_NAMES_FULL[month - 1]} {year}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={goNext} aria-label="Próximo mês">
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" text="Carregando…" />
        </div>
      ) : (
        <>
          <KpiHero
            balance={balance}
            income={monthlyIncome}
            expense={monthlyExpense}
            incomeCount={data?.incomeCount}
            expenseCount={data?.expenseCount}
            expenseFixedCount={data?.expenseFixedCount}
            prevBalance={data?.prevBalance}
          />

          <div
            className="grid mb-[var(--gap)]"
            style={{
              gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
              gap: "var(--gap)",
            }}
          >
            <Card>
              <CardHead>
                <div>
                  <CardTitle>Receitas vs Despesas</CardTitle>
                  <CardSub>{year} · valores mensais</CardSub>
                </div>
                <div className="legend">
                  <span className="legend-item">
                    <span className="legend-swatch" style={{ background: "var(--pos)" }} /> Receitas
                  </span>
                  <span className="legend-item">
                    <span className="legend-swatch" style={{ background: "var(--neg)" }} /> Despesas
                  </span>
                </div>
              </CardHead>
              <LineIE data={monthlyData} />
            </Card>

            <Card>
              <CardHead>
                <div>
                  <CardTitle>Por categoria</CardTitle>
                  <CardSub>Despesas de {MONTH_NAMES_FULL[month - 1]}</CardSub>
                </div>
              </CardHead>
              {categoryData.length === 0 ? (
                <div className="h-[200px] grid place-items-center text-sm" style={{ color: "var(--muted)" }}>
                  Sem despesas no mês.
                </div>
              ) : (
                <Donut data={categoryData} />
              )}
            </Card>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-display"
              style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}
            >
              Metas financeiras
            </h2>
            <Button
              size="sm"
              onClick={() => {
                setEditGoalId(null);
                setGoalForm({ name: "", description: "", target: "", deadline: "" });
                setShowGoalModal(true);
              }}
            >
              <Plus size={14} /> Nova meta
            </Button>
          </div>

          {goalsLoading ? (
            <div className="py-6">
              <LoadingSpinner />
            </div>
          ) : goals.length === 0 ? (
            <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
              Nenhuma meta criada.
            </p>
          ) : (
            <div
              className="grid mb-[var(--gap)]"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--gap)" }}
            >
              {goals.map((goal, i) => {
                const pct = Math.min(100, (goal.saved / goal.target) * 100);
                const remaining = Math.max(0, goal.target - goal.saved);
                return (
                  <div
                    key={goal.id}
                    className="border bg-bg-elev relative overflow-hidden"
                    style={{
                      borderColor: "var(--border-soft)",
                      borderRadius: "var(--r-lg)",
                      padding: 20,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        style={{
                          fontSize: 10.5,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                          fontWeight: 600,
                        }}
                      >
                        Meta {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditGoalId(goal.id);
                            setGoalForm({
                              name: goal.name,
                              description: goal.description || "",
                              target: goal.target.toString(),
                              deadline: goal.deadline
                                ? new Date(goal.deadline).toISOString().split("T")[0]
                                : "",
                            });
                            setShowGoalModal(true);
                          }}
                          className="btn btn-ghost btn-icon btn-sm"
                          aria-label="Editar"
                        >
                          <PencilSimple size={13} />
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="btn btn-ghost btn-icon btn-sm"
                          aria-label="Excluir"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                    <h4
                      className="font-display"
                      style={{
                        fontWeight: 600,
                        fontSize: 19,
                        letterSpacing: "-0.02em",
                        margin: "8px 0 4px",
                      }}
                    >
                      {goal.name}
                    </h4>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {goal.deadline ? `até ${fmtDate(goal.deadline)}` : "sem prazo"} · faltam {fmtBRL(remaining)}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{
                          height: 6,
                          background: "var(--surface)",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "var(--accent)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2.5 text-xs">
                        <span>
                          <b className="font-mono num" style={{ fontWeight: 500 }}>
                            {fmtBRL(goal.saved)}
                          </b>{" "}
                          <span style={{ color: "var(--muted)" }}>/ {fmtBRL(goal.target)}</span>
                        </span>
                        <span className="num font-semibold" style={{ color: "var(--accent)" }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddValueGoalId(goal.id);
                          setAddValueAmount("");
                        }}
                      >
                        <Plus size={12} /> Adicionar valor
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="tbl-wrap">
            <div className="tbl-head">
              <div>
                <div className="card-title">Últimos lançamentos</div>
                <div className="card-sub">
                  {MONTH_NAMES_FULL[month - 1]} de {year} · {recentExpenses.length} lançamentos
                </div>
              </div>
            </div>
            {recentExpenses.length === 0 ? (
              <div className="p-10 text-sm text-center" style={{ color: "var(--muted)" }}>
                Sem lançamentos neste mês.
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: "44%" }}>Descrição</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th style={{ textAlign: "right" }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((e: any) => (
                    <tr key={e.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="grid place-items-center"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: "var(--surface)",
                              color: "var(--fg-soft)",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {(e.description || "?")[0].toUpperCase()}
                          </span>
                          <div>
                            <div style={{ fontWeight: 500 }}>{e.description}</div>
                            {e.isFixed && (
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: "var(--muted)",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                Recorrente
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
                      <td className="num" style={{ textAlign: "right", color: "var(--neg)", fontWeight: 500 }}>
                        −{fmtBRL(parseFloat(e.value)).replace("R$", "").trim()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showGoalModal && (
        <Modal
          title={editGoalId ? "Editar meta" : "Nova meta"}
          subtitle="Defina um objetivo financeiro."
          onClose={() => setShowGoalModal(false)}
        >
          <form onSubmit={submitGoal} className="grid gap-3.5">
            <div className="field">
              <label>Nome</label>
              <input
                className="input"
                required
                value={goalForm.name}
                onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Descrição</label>
              <textarea
                className="textarea"
                value={goalForm.description}
                onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label>Valor objetivo (R$)</label>
                <input
                  className="input input-currency"
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={goalForm.target}
                  onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Prazo (opcional)</label>
                <input
                  className="input"
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                />
              </div>
            </div>
            {goalError && (
              <p className="text-xs" style={{ color: "var(--neg)" }}>
                {goalError}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setShowGoalModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={goalSubmitting}>
                Salvar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {addValueGoalId !== null && (
        <Modal title="Adicionar valor à meta" onClose={() => setAddValueGoalId(null)}>
          <form onSubmit={addToGoal} className="grid gap-3.5">
            <div className="field">
              <label>Valor (R$)</label>
              <input
                className="input input-currency"
                required
                type="number"
                step="0.01"
                min="0.01"
                value={addValueAmount}
                onChange={(e) => setAddValueAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setAddValueGoalId(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={addValueLoading}>
                Adicionar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
