"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";

interface Category {
  id: number;
  name: string;
  type: string;
  created_at: string;
}

export default function CategoryPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (forceRefresh = false) => {
    try {
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      const url = forceRefresh 
        ? `${apiUrl(API_ENDPOINTS.CATEGORY)}?_t=${timestamp}&_refresh=true`
        : `${apiUrl(API_ENDPOINTS.CATEGORY)}?_t=${timestamp}`;
        
      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      const data = await res.json();
      
      // Verificar se os dados são um array antes de usar
      const categoriesArray = Array.isArray(data) ? data : [];
      setCategories(categoriesArray);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId 
        ? `${apiUrl(API_ENDPOINTS.CATEGORY)}/${editingId}`
        : apiUrl(API_ENDPOINTS.CATEGORY);
      
      const method = editingId ? "PUT" : "POST";
      const requestBody = {
        name: formData.name,
        type: formData.type,
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
        const responseData = await res.json();
        
        if (editingId) {
          // Atualizar categoria existente
          setCategories(prevCategories => 
            prevCategories.map(cat => 
              cat.id === editingId ? responseData : cat
            )
          );
        } else {
          // Adicionar nova categoria
          setCategories(prevCategories => [...prevCategories, responseData]);
        }
        
        setFormData({ name: "", type: "expense" });
        setShowForm(false);
        setEditingId(null);
        
        // Forçar atualização completa do servidor
        await fetchCategories(true);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro na resposta:', errorData);
        alert(`Erro ao salvar categoria: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      alert('Erro ao salvar categoria. Verifique o console para mais detalhes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      type: category.type,
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`${apiUrl(API_ENDPOINTS.CATEGORY)}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        // Remover categoria do estado imediatamente
        setCategories(prevCategories => 
          prevCategories.filter(cat => cat.id !== id)
        );
        
        // Forçar atualização completa do servidor
        await fetchCategories(true);
      }
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
    } finally {
      setDeleting(null);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "income" ? "Receita" : "Despesa";
  };

  const getTypeColor = (type: string) => {
    return type === "income" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando categorias..." />
      </div>
    );
  }

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Categorias</h1>
          <Button onClick={() => setShowForm(true)}>
            + Nova Categoria
          </Button>
        </div>

        {showForm && (
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-card-foreground">
              {editingId ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground placeholder-muted-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground"
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
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
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: "", type: "expense" });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categorias de Despesa */}
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">Categorias de Despesa</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border bg-card">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-inherit">
                  {expenseCategories.map((category) => (
                    <tr key={category.id} className="bg-inherit even:bg-muted hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            disabled={deleting === category.id}
                            className="text-cyan-600 hover:text-cyan-900 disabled:opacity-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={deleting === category.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deleting === category.id ? (
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
              {expenseCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma categoria de despesa encontrada
                </div>
              )}
            </div>
          </div>

          {/* Categorias de Receita */}
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-400">Categorias de Receita</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border bg-card">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-inherit">
                  {incomeCategories.map((category) => (
                    <tr key={category.id} className="bg-inherit even:bg-muted hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            disabled={deleting === category.id}
                            className="text-cyan-600 hover:text-cyan-900 disabled:opacity-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={deleting === category.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deleting === category.id ? (
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
              {incomeCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma categoria de receita encontrada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 