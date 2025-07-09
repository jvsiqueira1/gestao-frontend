"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../../lib/api";
import Button from "../../../components/Button";
import LoadingSpinner from "../../../components/LoadingSpinner";

interface ExpenseFixed {
  id: number;
  description: string;
  value: number;
  category_id: number;
  category_name?: string;
  recurrenceType?: string;
  startDate?: string;
  endDate?: string;
}

export default function ExpenseFixedPage() {
  const { token } = useAuth();
  const [fixedExpenses, setFixedExpenses] = useState<ExpenseFixed[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ExpenseFixed | null>(null);
  const [editData, setEditData] = useState({
    description: "",
    value: "",
    category_id: "",
    recurrenceType: "monthly",
    startDate: "",
    endDate: ""
  });
  const [history, setHistory] = useState<{ [id: number]: string[] }>({});
  const [showHistoryId, setShowHistoryId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchFixedExpenses();
  }, [token]);

  const fetchFixedExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.FINANCE.EXPENSE) + "?fixed=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFixedExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      setFixedExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: ExpenseFixed) => {
    setEditing(expense);
    setEditData({
      description: expense.description,
      value: expense.value.toString(),
      category_id: expense.category_id.toString(),
      recurrenceType: expense.recurrenceType || "monthly",
      startDate: expense.startDate ? expense.startDate.split("T")[0] : "",
      endDate: expense.endDate ? expense.endDate.split("T")[0] : ""
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.FINANCE.EXPENSE) + `/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editData,
          value: parseFloat(editData.value),
          category_id: parseInt(editData.category_id),
          isFixed: true,
        }),
      });
      if (res.ok) {
        setEditing(null);
        fetchFixedExpenses();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa fixa?")) return;
    setSubmitting(true);
    try {
      await fetch(apiUrl(API_ENDPOINTS.FINANCE.EXPENSE) + `/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFixedExpenses();
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = async (id: number) => {
    setShowHistoryId(id);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.FINANCE.EXPENSE) + `/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory((h) => ({ ...h, [id]: Array.isArray(data) ? data : [] }));
    } catch {
      setHistory((h) => ({ ...h, [id]: [] }));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Carregando despesas fixas..." /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Despesas Fixas</h1>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Editar Despesa Fixa</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input type="text" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                <input type="number" step="0.01" value={editData.value} onChange={e => setEditData({ ...editData, value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recorrência</label>
                <select value={editData.recurrenceType} onChange={e => setEditData({ ...editData, recurrenceType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início</label>
                <input type="date" value={editData.startDate} onChange={e => setEditData({ ...editData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fim (opcional)</label>
                <input type="date" value={editData.endDate} onChange={e => setEditData({ ...editData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setEditing(null)} variant="secondary">Cancelar</Button>
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descrição</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recorrência</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Período</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {fixedExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-4 py-2">{expense.description}</td>
                <td className="px-4 py-2">R$ {expense.value.toFixed(2)}</td>
                <td className="px-4 py-2">{expense.recurrenceType === "yearly" ? "Anual" : "Mensal"}</td>
                <td className="px-4 py-2">{expense.startDate?.split("T")[0]} {expense.endDate ? `até ${expense.endDate.split("T")[0]}` : ""}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => handleEdit(expense)} className="text-cyan-600 hover:text-cyan-900">Editar</button>
                  <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                  <button onClick={() => fetchHistory(expense.id)} className="text-gray-600 hover:text-gray-900">Histórico</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showHistoryId && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded">
            <h4 className="font-semibold mb-2">Histórico de registros</h4>
            <ul className="list-disc ml-6">
              {(history[showHistoryId] || []).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
            <Button onClick={() => setShowHistoryId(null)} variant="secondary" className="mt-2">Fechar</Button>
          </div>
        )}
      </div>
    </div>
  );
} 