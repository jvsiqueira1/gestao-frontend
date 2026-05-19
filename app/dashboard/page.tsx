"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, Wallet, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import Button from "../../components/Button";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const monthName = (m: number) =>
  ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][m - 1];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

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
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: "", description: "", target: "", deadline: "" });
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [editGoalId, setEditGoalId] = useState<number | null>(null);
  const [addValueGoalId, setAddValueGoalId] = useState<number | null>(null);
  const [addValueAmount, setAddValueAmount] = useState("");
  const [addValueLoading, setAddValueLoading] = useState(false);

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
      const res = await fetch(apiUrl(API_ENDPOINTS.GOAL), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Erro ao carregar metas");
      return res.json();
    },
    enabled: !!token,
  });

  const availableYears: number[] = (() => {
    const created = data?.userCreatedYear || now.getFullYear();
    const years = [];
    for (let y = created; y <= now.getFullYear(); y++) years.push(y);
    return years;
  })();

  const submitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalSubmitting(true);
    setGoalError("");
    try {
      const url = editGoalId ? `${apiUrl(API_ENDPOINTS.GOAL)}/${editGoalId}` : apiUrl(API_ENDPOINTS.GOAL);
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

  const monthlyIncome = data?.monthlyIncome || 0;
  const monthlyExpense = data?.monthlyExpense || 0;
  const balance = monthlyIncome - monthlyExpense;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{monthName(month)} de {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 px-2 text-sm rounded-md border bg-background"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{monthName(m)}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 px-2 text-sm rounded-md border bg-background"
          >
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </header>

      {isLoading ? (
        <div className="py-20"><LoadingSpinner size="lg" text="Carregando…" /></div>
      ) : (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Receitas" value={monthlyIncome} icon={ArrowUpRight} tone="success" />
            <KpiCard label="Despesas" value={monthlyExpense} icon={ArrowDownRight} tone="danger" />
            <KpiCard label="Saldo" value={balance} icon={Wallet} tone={balance >= 0 ? "success" : "danger"} />
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card title={`Receitas vs Despesas — ${year}`}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => formatCurrency(Number(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} name="Receitas" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} name="Despesas" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Despesas por categoria">
              {(!data?.categoryData || data.categoryData.length === 0) ? (
                <div className="h-[260px] grid place-items-center text-sm text-muted-foreground">
                  Sem despesas em {monthName(month)}.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.categoryData.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </section>

          {/* Metas */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Metas financeiras</h2>
              <Button size="sm" onClick={() => { setEditGoalId(null); setGoalForm({ name: "", description: "", target: "", deadline: "" }); setShowGoalModal(true); }}>
                <Plus className="w-3.5 h-3.5" /> Nova meta
              </Button>
            </div>

            {goalsLoading ? (
              <div className="py-8"><LoadingSpinner /></div>
            ) : goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma meta criada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => {
                  const percent = Math.min(100, (goal.saved / goal.target) * 100);
                  return (
                    <div key={goal.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium truncate">{goal.name}</h3>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground">até {new Date(goal.deadline).toLocaleDateString("pt-BR")}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => {
                            setEditGoalId(goal.id);
                            setGoalForm({
                              name: goal.name,
                              description: goal.description || "",
                              target: goal.target.toString(),
                              deadline: goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : "",
                            });
                            setShowGoalModal(true);
                          }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded" aria-label="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary rounded" aria-label="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {goal.description && <p className="text-xs text-muted-foreground mb-3">{goal.description}</p>}
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{formatCurrency(goal.saved)}</span>
                        <span className="font-medium">{formatCurrency(goal.target)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
                        <div className="h-full bg-foreground transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{percent.toFixed(0)}%</span>
                        <Button size="sm" variant="secondary" onClick={() => { setAddValueGoalId(goal.id); setAddValueAmount(""); }}>
                          + Adicionar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {showGoalModal && (
        <Modal onClose={() => setShowGoalModal(false)} title={editGoalId ? "Editar meta" : "Nova meta"}>
          <form onSubmit={submitGoal} className="space-y-3">
            <Field label="Nome">
              <input required value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} className="input-base" />
            </Field>
            <Field label="Descrição">
              <textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} className="input-base min-h-[60px]" />
            </Field>
            <Field label="Valor objetivo (R$)">
              <input required type="number" step="0.01" min="0.01" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} className="input-base" />
            </Field>
            <Field label="Prazo (opcional)">
              <input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })} className="input-base" />
            </Field>
            {goalError && <p className="text-xs text-destructive">{goalError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowGoalModal(false)}>Cancelar</Button>
              <Button type="submit" loading={goalSubmitting}>Salvar</Button>
            </div>
          </form>
        </Modal>
      )}

      {addValueGoalId !== null && (
        <Modal onClose={() => setAddValueGoalId(null)} title="Adicionar valor à meta">
          <form onSubmit={addToGoal} className="space-y-3">
            <Field label="Valor (R$)">
              <input required type="number" step="0.01" min="0.01" value={addValueAmount} onChange={(e) => setAddValueAmount(e.target.value)} className="input-base" autoFocus />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setAddValueGoalId(null)}>Cancelar</Button>
              <Button type="submit" loading={addValueLoading}>Adicionar</Button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          height: 36px;
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 14px;
        }
        textarea.input-base {
          height: auto;
          padding: 8px 12px;
        }
        .input-base:focus {
          outline: none;
          box-shadow: 0 0 0 2px hsl(var(--ring));
        }
      `}</style>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "success" | "danger" }) {
  const toneClass = tone === "success" ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500";
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className={`w-4 h-4 ${toneClass}`} />
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(value)}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
