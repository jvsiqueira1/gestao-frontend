"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";

interface Income {
  id: number;
  description: string;
  value: number;
  date: string;
  category_id: number;
  category_name: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

export default function IncomePage() {
  const { token } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    value: "",
    date: new Date().toISOString().split("T")[0],
    category_id: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [incomesRes, categoriesRes] = await Promise.all([
        fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl(API_ENDPOINTS.CATEGORY), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      const [incomesData, categoriesData] = await Promise.all([
        incomesRes.json(),
        categoriesRes.json(),
      ]);
      
      // Verificar se os dados são arrays antes de usar
      const incomesArray = Array.isArray(incomesData) ? incomesData : [];
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
      
      setIncomes(incomesArray);
      setCategories(categoriesArray.filter((cat: Category) => cat.type === 'income'));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId 
        ? `${apiUrl(API_ENDPOINTS.FINANCE.INCOME)}/${editingId}`
        : apiUrl(API_ENDPOINTS.FINANCE.INCOME);
      
      const method = editingId ? "PUT" : "POST";
      
      const requestBody = {
        description: formData.description,
        value: parseFloat(formData.value),
        date: formData.date,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        setFormData({ description: "", value: "", date: new Date().toISOString().split("T")[0], category_id: "" });
        setShowForm(false);
        setEditingId(null);
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Erro ao salvar receita: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
      alert('Erro ao salvar receita. Verifique o console para mais detalhes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (income: Income) => {
    setFormData({
      description: income.description,
      value: income.value.toString(),
      date: income.date,
      category_id: income.category_id.toString(),
    });
    setEditingId(income.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`${apiUrl(API_ENDPOINTS.FINANCE.INCOME)}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao excluir receita:", error);
    } finally {
      setDeleting(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando receitas..." />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-screen dark-gradient-bg p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Receitas</h1>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            + Nova Receita
          </Button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? "Editar Receita" : "Nova Receita"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" text="" />
                      {editingId ? "Atualizando..." : "Salvando..."}
                    </div>
                  ) : (
                    editingId ? "Atualizar" : "Salvar"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  disabled={submitting}
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ description: "", value: "", date: new Date().toISOString().split("T")[0], category_id: "" });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lista de Receitas</h3>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {income.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(income.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                        {income.category_name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(income.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(income)}
                          disabled={deleting === income.id}
                          className="text-cyan-600 hover:text-cyan-900 disabled:opacity-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
                          disabled={deleting === income.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deleting === income.id ? (
                            <div className="flex items-center gap-1">
                              <LoadingSpinner size="sm" text="" />
                              Excluindo...
                            </div>
                          ) : (
                            'Excluir'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {incomes.map((income) => (
              <div key={income.id} className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {income.description}
                  </h4>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(income.value)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                      {income.category_name || 'N/A'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(income.date)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(income)}
                      disabled={deleting === income.id}
                      className="text-xs text-cyan-600 hover:text-cyan-900 disabled:opacity-50 px-2 py-1 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      disabled={deleting === income.id}
                      className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50 px-2 py-1 rounded"
                    >
                      {deleting === income.id ? (
                        <div className="flex items-center gap-1">
                          <LoadingSpinner size="sm" text="" />
                          Excluindo...
                        </div>
                      ) : (
                        'Excluir'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {incomes.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhuma receita encontrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 