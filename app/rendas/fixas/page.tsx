'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiUrl, authenticatedRequest } from '@/lib/api';
import { hasValidAccess } from '@/lib/api';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface FixedIncome {
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

interface IncomeHistory {
  id: number;
  description: string;
  value: number;
  date: string;
  category: Category | null;
}

export default function FixedIncomesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [fixedIncomes, setFixedIncomes] = useState<FixedIncome[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIncome, setEditingIncome] = useState<FixedIncome | null>(null);
  const [showHistory, setShowHistory] = useState<number | null>(null);
  const [history, setHistory] = useState<IncomeHistory[]>([]);
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
    
    fetchFixedIncomes();
    fetchCategories();
  }, [user, token, router]);

  const fetchFixedIncomes = async () => {
    try {
      const response = await authenticatedRequest('/fixed-incomes', {}, token || undefined);
      setFixedIncomes(response);
    } catch (error) {
      console.error('Erro ao buscar rendas fixas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authenticatedRequest('/category', {}, token || undefined);
      const incomeCategories = response.filter((cat: Category) => cat.type === 'income');
      setCategories(incomeCategories);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchHistory = async (incomeId: number) => {
    setHistoryLoading(incomeId);
    try {
      const response = await authenticatedRequest(`/finance/income/${incomeId}/history`, {}, token || undefined);
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
      if (editingIncome) {
        await authenticatedRequest(`/fixed-incomes/${editingIncome.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        }, token || undefined);
      }
      
      setEditingIncome(null);
      resetForm();
      fetchFixedIncomes();
    } catch (error) {
      console.error('Erro ao salvar renda fixa:', error);
    }
  };

  const handleEdit = (income: FixedIncome) => {
    setEditingIncome(income);
    setFormData({
      description: income.description,
      value: income.value.toString(),
      category_id: income.category_id?.toString() || '',
      recurrenceType: income.recurrenceType,
      startDate: income.startDate.split('T')[0],
      endDate: income.endDate ? income.endDate.split('T')[0] : ''
    });
  };

  const handleDelete = async (incomeId: number) => {
    if (confirm('Tem certeza que deseja excluir esta renda fixa?')) {
      try {
        await authenticatedRequest(`/fixed-incomes/${incomeId}`, {
          method: 'DELETE'
        }, token || undefined);
        fetchFixedIncomes();
      } catch (error) {
        console.error('Erro ao excluir renda fixa:', error);
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
        <LoadingSpinner size="lg" text="Carregando rendas fixas..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-light dark:bg-custom-dark p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={() => window.location.href = '/receitas'} 
              className="bg-gray-500 hover:bg-gray-600"
            >
              ← Voltar às Rendas
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configuração de Rendas Fixas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas rendas recorrentes e visualize o histórico de recebimentos
          </p>
        </div>

        {/* Formulário de Edição */}
        {editingIncome && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Editar Renda Fixa
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
                    setEditingIncome(null);
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

        {/* Lista de Rendas Fixas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Rendas Fixas Configuradas ({fixedIncomes.length})
            </h3>
          </div>

          {fixedIncomes.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>Nenhuma renda fixa configurada.</p>
              <p className="text-sm mt-2">As rendas fixas devem ser criadas através da página de rendas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {fixedIncomes.map((income) => (
                <div key={income.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {income.description}
                        </h4>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {income.recurrenceType === 'monthly' ? 'Mensal' : 'Anual'}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <p><strong>Valor:</strong> {formatCurrency(income.value)}</p>
                        <p><strong>Categoria:</strong> {income.category?.name || 'Sem categoria'}</p>
                        <p><strong>Início:</strong> {formatDate(income.startDate)}</p>
                        {income.endDate && (
                          <p><strong>Fim:</strong> {formatDate(income.endDate)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(income)}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDelete(income.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </Button>
                      <Button
                        onClick={() => {
                          if (showHistory === income.id) {
                            setShowHistory(null);
                          } else {
                            setShowHistory(income.id);
                            fetchHistory(income.id);
                          }
                        }}
                        disabled={historyLoading === income.id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {historyLoading === income.id ? (
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" text="" />
                            Carregando...
                          </div>
                        ) : (
                          `${showHistory === income.id ? 'Ocultar' : 'Ver'} Histórico`
                        )}
                      </Button>
                    </div>
                  </div>

                  {showHistory === income.id && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Histórico de Recebimentos</h5>
                      {historyLoading === income.id ? (
                        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner size="md" text="Carregando histórico..." />
                        </div>
                      ) : history.length === 0 ? (
                        <p className="text-gray-500">Nenhum recebimento registrado ainda.</p>
                      ) : (
                        <div className="space-y-2">
                          {history.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                              <div>
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-gray-600">{formatDate(item.date)}</p>
                                <p className="text-sm text-gray-600">{item.category?.name || 'Sem categoria'}</p>
                              </div>
                              <span className="font-medium text-green-600">
                                +{formatCurrency(item.value)}
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