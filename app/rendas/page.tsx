"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import dayjs from "dayjs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format as formatDateFns } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Settings } from 'lucide-react';

interface Income {
  id: number;
  description: string;
  value: number;
  date: string;
  category_id: number;
  category_name: string;
  created_at: string;
  isFixed?: boolean;
  recurrenceType?: string;
  startDate?: string;
  endDate?: string;
  pending?: boolean; // Adicionado para indicar receitas pendentes
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
  const [monthLoading, setMonthLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [registeringPending, setRegisteringPending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    value: "",
    date: new Date().toISOString().split("T")[0],
    category_id: "",
    isFixed: false,
    recurrenceType: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  // Remover estados e funções relacionados a editPending e editPendingData

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setMonthLoading(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      const params = `?month=${selectedMonth}&year=${selectedYear}`;
      const [incomesRes, categoriesRes] = await Promise.all([
        fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME) + params, {
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
      setMonthLoading(false);
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
        isFixed: formData.isFixed,
        recurrenceType: formData.recurrenceType,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
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
        setFormData({ description: "", value: "", date: new Date().toISOString().split("T")[0], category_id: "", isFixed: false, recurrenceType: "monthly", startDate: new Date().toISOString().split("T")[0], endDate: "" });
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
    setEditing(income.id);
    // Função para formatar data para YYYY-MM-DD
    const formatDateForInput = (dateString: string | undefined) => {
      if (!dateString) return new Date().toISOString().split("T")[0];
      try {
        return new Date(dateString).toISOString().split("T")[0];
      } catch (error) {
        console.error('Erro ao formatar data:', dateString, error);
        return new Date().toISOString().split("T")[0];
      }
    };

    setFormData({
      description: income.description,
      value: income.value.toString(),
      date: formatDateForInput(income.date),
      category_id: income.category_id.toString(),
      isFixed: income.isFixed || false, 
      recurrenceType: income.recurrenceType || "monthly",
      startDate: formatDateForInput(income.startDate),
      endDate: formatDateForInput(income.endDate) || ""
    });
    setEditingId(income.id);
    setShowForm(true);
    setEditing(null);
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

  function parseLocalDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando receitas..." />
      </div>
    );
  }

  // Nova função para registrar pendente diretamente
  const handleRegisterPending = async (income: Income) => {
    setRegisteringPending(true);
    try {
      // Para itens pendentes, extrair o ID real da receita fixa
      let fixedIncomeId = null;
      const incomeId = String(income.id);
      if (incomeId.startsWith('pending-')) {
        // Formato: pending-{id}-{month}-{year}
        const parts = incomeId.split('-');
        if (parts.length >= 3) {
          fixedIncomeId = parseInt(parts[1]);
        }
      } else if (typeof income.id === 'number') {
        fixedIncomeId = income.id;
      }



      const res = await fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: income.description,
          value: income.value,
          date: income.date,
          category_id: income.category_id,
          isFixed: false,
          fixed_income_id: fixedIncomeId
        }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Erro ao registrar receita: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao registrar receita pendente:', error);
      alert('Erro ao registrar receita. Verifique o console para mais detalhes.');
    } finally {
      // Pequeno delay para evitar bug visual
      setTimeout(() => {
        setRegisteringPending(false);
      }, 500);
    }
  };



  // UI do filtro de mês/ano (antes da tabela/lista)
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Antes do return, defina o filtro de mês/ano como um componente
  const MonthYearFilter = (
    <div className="flex flex-wrap gap-2 items-center mb-6 justify-center">
      <button
        onClick={() => {
          if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
          } else {
            setSelectedMonth(selectedMonth - 1);
          }
        }}
        className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
        aria-label="Mês anterior"
      >
        &lt;
      </button>
      <select
        value={selectedMonth}
        onChange={e => setSelectedMonth(Number(e.target.value))}
        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        aria-label="Selecionar mês"
      >
        {months.map((m, idx) => (
          <option key={m} value={idx + 1}>{m}</option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={e => setSelectedYear(Number(e.target.value))}
        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        aria-label="Selecionar ano"
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <button
        onClick={() => {
          if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
          } else {
            setSelectedMonth(selectedMonth + 1);
          }
        }}
        className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
        aria-label="Próximo mês"
      >
        &gt;
      </button>
      <span className="font-semibold text-gray-900 dark:text-white ml-2">
        {months[selectedMonth - 1]} de {selectedYear}
      </span>
    </div>
  );

  // Remover todo o JSX solto do corpo do componente.
  // No final do componente, coloque:
  return (
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Receitas</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => window.location.href = '/rendas/fixas'} 
            >
              <Settings className="inline w-4 h-4 mr-1 align-text-bottom" /> Rendas Fixas
            </Button>
            <Button onClick={() => {
              setFormData(form => ({
                ...form,
                startDate: form.date
              }));
              setShowForm(true);
            }}>
              + Nova Receita
            </Button>
          </div>
        </div>

        {/* Filtro de mês/ano */}
        <div className="flex flex-wrap gap-2 items-center mb-4 justify-center">
          <button
            onClick={() => {
              if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            disabled={monthLoading}
            className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Mês anterior"
          >
            &lt;
          </button>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            disabled={monthLoading}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Selecionar mês"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            disabled={monthLoading}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Selecionar ano"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            disabled={monthLoading}
            className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Próximo mês"
          >
            &gt;
          </button>
          <span className="font-semibold text-gray-900 dark:text-white ml-2">
            {months[selectedMonth - 1]} de {selectedYear}
          </span>
        </div>

        {/* Formulário de receita */}
        {showForm && (
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-card-foreground">
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
                  required
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
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    >
                      {formData.date ? formatDateFns(parseLocalDate(formData.date) || new Date(), "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={parseLocalDate(formData.date) || undefined}
                      onSelect={date => {
                        if (date) {
                          const localDate = formatDateFns(date, "yyyy-MM-dd");
                          setFormData(form => ({
                            ...form,
                            date: localDate,
                            startDate: form.isFixed ? localDate : form.startDate
                          }));
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isFixed}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData(form => ({
                        ...form,
                        isFixed: checked,
                        startDate: checked ? form.date : form.startDate
                      }));
                    }}
                    className="form-checkbox h-5 w-5 text-cyan-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Receita fixa</span>
                </label>
              </div>
              {formData.isFixed && (
                <div className="space-y-2">
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
                      Início da recorrência
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                        >
                          {formData.startDate ? formatDateFns(parseLocalDate(formData.startDate) || new Date(), "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={parseLocalDate(formData.startDate) || undefined}
                          onSelect={date => {
                            if (date) {
                              const localDate = formatDateFns(date, "yyyy-MM-dd");
                              setFormData(form => ({
                                ...form,
                                startDate: localDate
                              }));
                            }
                          }}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fim da recorrência (opcional)
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                        >
                          {formData.endDate ? formatDateFns(parseLocalDate(formData.endDate) || new Date(), "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={parseLocalDate(formData.endDate) || undefined}
                          onSelect={date => {
                            if (date) {
                              const localDate = formatDateFns(date, "yyyy-MM-dd");
                              setFormData(form => ({
                                ...form,
                                endDate: localDate
                              }));
                            }
                          }}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
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
                    setFormData({ description: "", value: "", date: new Date().toISOString().split("T")[0], category_id: "", isFixed: false, recurrenceType: "monthly", startDate: new Date().toISOString().split("T")[0], endDate: "" });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Aviso de receitas pendentes */}
        {incomes.some(i => i.pending) && (
          <div className="mb-4 p-3 rounded bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 font-semibold">
            Existem receitas fixas pendentes para este mês. Utilize o botão "Registrar" ao lado de cada uma na tabela abaixo.
          </div>
        )}

        {/* Tabela de receitas */}
        {monthLoading ? (
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lista de Receitas</h3>
            </div>
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Carregando receitas..." />
            </div>
          </div>
        ) : (
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lista de Receitas</h3>
            </div>
            <div className="relative">
              {registeringPending && (
                <div className="absolute inset-0 bg-white dark:bg-gray-800 flex items-center justify-center z-10">
                  <LoadingSpinner size="lg" text="Registrando..." />
                </div>
              )}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {incomes.map((income) => (
                    <tr key={income.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${income.pending ? 'bg-yellow-50 dark:bg-yellow-900' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {income.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(income.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {income.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(income.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {income.pending ? (
                            <button
                              onClick={() => handleRegisterPending(income)}
                              disabled={registeringPending}
                              className="text-green-700 hover:text-green-900 font-semibold border border-green-600 rounded px-2 py-1 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                            >
                              Registrar
                            </button>
                          ) : (
                                                          <>
                                <button
                                  onClick={() => handleEdit(income)}
                                  disabled={registeringPending || editing === income.id || deleting === income.id}
                                  className="text-cyan-600 hover:text-cyan-900 disabled:opacity-50"
                                >
                                  {editing === income.id ? (
                                    <div className="flex items-center gap-1">
                                      <LoadingSpinner size="sm" text="" />
                                      Editando...
                                    </div>
                                  ) : (
                                    'Editar'
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(income.id)}
                                  disabled={registeringPending || editing === income.id || deleting === income.id}
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
                              </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}