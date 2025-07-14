'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiUrl, authenticatedRequest } from '@/lib/api';
import { hasValidAccess } from '@/lib/api';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Pencil, Trash2, Clock } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface FixedExpense {
  id: number;
  description: string;
  value: number;
  category_id: number | null;
  category: Category | null;
  recurrenceType: string;
  startDate: string;
  endDate: string | null;
  created_at: string;
}

interface ExpenseHistory {
  id: number;
  description: string;
  value: number;
  date: string;
  category: Category | null;
}

export default function FixedExpensesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [showHistory, setShowHistory] = useState<number | null>(null);
  const [history, setHistory] = useState<ExpenseHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    category_id: '',
    recurrenceType: 'monthly',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Wait for authentication to be fully loaded
    if (user === null && token === null) {
      // Still loading, don't redirect yet
      return;
    }
    
    if (user === null && token) {
      // Token exists but user is still loading, wait
      return;
    }
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Usar a função utilitária para verificar acesso
    if (!hasValidAccess(user)) {
      router.push('/perfil');
      return;
    }
    
    fetchFixedExpenses();
    fetchCategories();
  }, [user, token, router]);

  const fetchFixedExpenses = async () => {
    try {
      const response = await authenticatedRequest('/fixed-expenses', {}, token || undefined);
      setFixedExpenses(response);
    } catch (error) {
      console.error('Erro ao buscar despesas fixas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authenticatedRequest('/category', {}, token || undefined);
      const expenseCategories = response.filter((cat: Category) => cat.type === 'expense');
      setCategories(expenseCategories);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchHistory = async (expenseId: number) => {
    setHistoryLoading(expenseId);
    try {
      const response = await authenticatedRequest(`/finance/expense/${expenseId}/history`, {}, token || undefined);
      setHistory(response);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setHistoryLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingExpense) {
        await authenticatedRequest(`/fixed-expenses/${editingExpense.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        }, token || undefined);
      }
      
      setEditingExpense(null);
      resetForm();
      fetchFixedExpenses();
    } catch (error) {
      console.error('Erro ao salvar despesa fixa:', error);
    }
  };

  const handleEdit = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      value: expense.value.toString(),
      category_id: expense.category_id?.toString() || '',
      recurrenceType: expense.recurrenceType,
      startDate: expense.startDate.split('T')[0],
      endDate: expense.endDate ? expense.endDate.split('T')[0] : ''
    });
  };

  const handleDelete = async (expenseId: number) => {
    if (confirm('Tem certeza que deseja excluir esta despesa fixa?')) {
      try {
        await authenticatedRequest(`/fixed-expenses/${expenseId}`, {
          method: 'DELETE'
        }, token || undefined);
        fetchFixedExpenses();
      } catch (error) {
        console.error('Erro ao excluir despesa fixa:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      value: '',
      category_id: '',
      recurrenceType: 'monthly',
      startDate: '',
      endDate: ''
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-light dark:bg-custom-dark flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando despesas fixas..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-light dark:bg-custom-dark p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={() => window.location.href = '/despesas'} 
              className="bg-gray-500 hover:bg-gray-600"
            >
              ← Voltar às Despesas
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configuração de Despesas Fixas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas despesas recorrentes e visualize o histórico de pagamentos
          </p>
        </div>

        {/* Formulário de Edição */}
        {editingExpense && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Editar Despesa Fixa
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recorrência
                  </label>
                  <select
                    value={formData.recurrenceType}
                    onChange={e => setFormData({ ...formData, recurrenceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Fim (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingExpense(null);
                    resetForm();
                  }}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Despesas Fixas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Despesas Fixas Configuradas ({fixedExpenses.length})
            </h3>
          </div>

          {fixedExpenses.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>Nenhuma despesa fixa configurada.</p>
              <p className="text-sm mt-2">As despesas fixas devem ser criadas através da página de despesas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {fixedExpenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {expense.description}
                        </h4>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {expense.recurrenceType === 'monthly' ? 'Mensal' : 'Anual'}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <p><strong>Valor:</strong> {formatCurrency(expense.value)}</p>
                        <p><strong>Categoria:</strong> {expense.category?.name || 'Sem categoria'}</p>
                        <p><strong>Início:</strong> {formatDate(expense.startDate)}</p>
                        {expense.endDate && (
                          <p><strong>Fim:</strong> {formatDate(expense.endDate)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(expense)}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Pencil className="inline w-4 h-4 mr-1 align-text-bottom" /> Editar
                      </Button>
                      <Button
                        onClick={() => handleDelete(expense.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="inline w-4 h-4 mr-1 align-text-bottom" /> Excluir
                      </Button>
                      <Button
                        onClick={() => {
                          if (showHistory === expense.id) {
                            setShowHistory(null);
                          } else {
                            setShowHistory(expense.id);
                            fetchHistory(expense.id);
                          }
                        }}
                        disabled={historyLoading === expense.id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {historyLoading === expense.id ? (
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" text="" />
                            Carregando...
                          </div>
                        ) : (
                          <>
                            <Clock className="inline w-4 h-4 mr-1 align-text-bottom" />
                            {showHistory === expense.id ? 'Ocultar' : 'Ver'} Histórico
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {showHistory === expense.id && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Histórico de Pagamentos</h5>
                      {historyLoading === expense.id ? (
                        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner size="md" text="Carregando histórico..." />
                        </div>
                      ) : history.length === 0 ? (
                        <p className="text-gray-500">Nenhum pagamento registrado ainda.</p>
                      ) : (
                        <div className="space-y-2">
                          {history.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                              <div>
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-gray-600">{formatDate(item.date)}</p>
                                <p className="text-sm text-gray-600">{item.category?.name || 'Sem categoria'}</p>
                              </div>
                              <span className="font-medium text-red-600">
                                -{formatCurrency(item.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 