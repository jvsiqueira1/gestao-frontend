"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../../lib/api";
import Button from "../../../components/Button";
import LoadingSpinner from "../../../components/LoadingSpinner";

interface IncomeFixed {
  id: number;
  description: string;
  value: number;
  category_id: number;
  category_name?: string;
  recurrenceType?: string;
  startDate?: string;
  endDate?: string;
}

export default function IncomeFixedPage() {
  const { token } = useAuth();
  const [fixedIncomes, setFixedIncomes] = useState<IncomeFixed[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IncomeFixed | null>(null);
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
    fetchFixedIncomes();
  }, [token]);

  const fetchFixedIncomes = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME) + "?fixed=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFixedIncomes(Array.isArray(data) ? data : []);
    } catch (error) {
      setFixedIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (income: IncomeFixed) => {
    setEditing(income);
    setEditData({
      description: income.description,
      value: income.value.toString(),
      category_id: income.category_id.toString(),
      recurrenceType: income.recurrenceType || "monthly",
      startDate: income.startDate ? income.startDate.split("T")[0] : "",
      endDate: income.endDate ? income.endDate.split("T")[0] : ""
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME) + `/${editing.id}`, {
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
        fetchFixedIncomes();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta receita fixa?")) return;
    setSubmitting(true);
    try {
      await fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME) + `/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFixedIncomes();
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = async (id: number) => {
    setShowHistoryId(id);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME) + `/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory((h) => ({ ...h, [id]: Array.isArray(data) ? data : [] }));
    } catch {
      setHistory((h) => ({ ...h, [id]: [] }));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Carregando receitas fixas..." /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Receitas Fixas</h1>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Editar Receita Fixa</h3>
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
            {fixedIncomes.map((income) => (
              <tr key={income.id}>
                <td className="px-4 py-2">{income.description}</td>
                <td className="px-4 py-2">R$ {income.value.toFixed(2)}</td>
                <td className="px-4 py-2">{income.recurrenceType === "yearly" ? "Anual" : "Mensal"}</td>
                <td className="px-4 py-2">{income.startDate?.split("T")[0]} {income.endDate ? `até ${income.endDate.split("T")[0]}` : ""}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => handleEdit(income)} className="text-cyan-600 hover:text-cyan-900">Editar</button>
                  <button onClick={() => handleDelete(income.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                  <button onClick={() => fetchHistory(income.id)} className="text-gray-600 hover:text-gray-900">Histórico</button>
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