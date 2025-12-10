"use client";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format as formatDateFns } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS, apiUrl } from "../../lib/api";

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
  pending?: boolean;
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
    endDate: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [error, setError] = useState<string | null>(null);

  // CORREÇÃO 1: useCallback para evitar recriação da função em cada render
  // Evita chamadas duplicadas e problemas de dependências no useEffect
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setError(null); // Limpar erros anteriores
      const params = `?month=${selectedMonth}&year=${selectedYear}`;
      
      // CORREÇÃO 2: Verificar se as respostas são OK antes de fazer .json()
      const [incomesRes, categoriesRes] = await Promise.all([
        fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME) + params, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl(API_ENDPOINTS.CATEGORY), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // CORREÇÃO 3: Verificar status HTTP antes de processar JSON
      if (!incomesRes.ok) {
        const errorText = await incomesRes.text();
        throw new Error(
          `Erro ao carregar receitas: ${incomesRes.status} ${errorText || incomesRes.statusText}`
        );
      }

      if (!categoriesRes.ok) {
        const errorText = await categoriesRes.text();
        throw new Error(
          `Erro ao carregar categorias: ${categoriesRes.status} ${errorText || categoriesRes.statusText}`
        );
      }

      // CORREÇÃO 4: Tratamento seguro de JSON com try/catch específico
      let incomesData: Income[] = [];
      let categoriesData: Category[] = [];

      try {
        incomesData = await incomesRes.json();
      } catch (jsonError) {
        console.error("Erro ao processar JSON de receitas:", jsonError);
        throw new Error("Formato de resposta inválido ao carregar receitas");
      }

      try {
        categoriesData = await categoriesRes.json();
      } catch (jsonError) {
        console.error("Erro ao processar JSON de categorias:", jsonError);
        throw new Error("Formato de resposta inválido ao carregar categorias");
      }

      // CORREÇÃO 5: Validação de tipos mais robusta
      const incomesArray = Array.isArray(incomesData) ? incomesData : [];
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];

      setIncomes(incomesArray);
      setCategories(
        categoriesArray.filter((cat: Category) => cat.type === "income")
      );
    } catch (error) {
      // CORREÇÃO 6: Feedback ao usuário em vez de apenas logar no console
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao carregar dados";
      console.error("Erro ao carregar dados:", error);
      setError(errorMessage);
      
      // Feedback visual para o usuário (pode ser melhorado com toast/notification)
      alert(`Erro ao carregar dados: ${errorMessage}`);
    } finally {
      setLoading(false);
      setMonthLoading(false);
    }
  }, [token, selectedMonth, selectedYear]); // Dependências corretas

  // CORREÇÃO 7: Unificar os dois useEffects que faziam a mesma coisa
  // O useEffect anterior na linha 68-71 era redundante
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchData();
  }, [token, fetchData]);

  // CORREÇÃO 8: useEffect separado apenas para mudanças de mês/ano
  useEffect(() => {
    if (!token || loading) return; // Evitar chamada duplicada no primeiro carregamento
    setMonthLoading(true);
    fetchData();
  }, [selectedMonth, selectedYear, token, fetchData, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Limpar erros anteriores
    
    try {
      const url = editingId
        ? `${apiUrl(API_ENDPOINTS.FINANCE.INCOME)}/${editingId}`
        : apiUrl(API_ENDPOINTS.FINANCE.INCOME);

      const method = editingId ? "PUT" : "POST";

      // CORREÇÃO 9: Validação de dados antes de enviar
      if (!formData.description.trim()) {
        throw new Error("A descrição é obrigatória");
      }

      const value = parseFloat(formData.value);
      if (isNaN(value) || value <= 0) {
        throw new Error("O valor deve ser um número positivo");
      }

      const requestBody = {
        description: formData.description.trim(),
        value,
        date: formData.date,
        category_id: formData.category_id
          ? parseInt(formData.category_id)
          : null,
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

      // CORREÇÃO 10: Verificar status antes de processar resposta
      if (!res.ok) {
        let errorMessage = "Erro desconhecido ao salvar receita";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Se não for JSON, usar status text
          errorMessage = res.statusText || `Erro ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      // CORREÇÃO 11: Verificar se a resposta é JSON válida
      let responseData;
      try {
        responseData = await res.json();
      } catch (jsonError) {
        console.error("Resposta não é JSON válido:", jsonError);
        // Continuar mesmo sem JSON, pois a operação pode ter sido bem-sucedida
      }

      // Reset do formulário apenas se tudo deu certo
      setFormData({
        description: "",
        value: "",
        date: new Date().toISOString().split("T")[0],
        category_id: "",
        isFixed: false,
        recurrenceType: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
      setShowForm(false);
      setEditingId(null);
      setEditing(null); // CORREÇÃO: Limpar estado de edição
      
      // Recarregar dados
      await fetchData();
    } catch (error) {
      // CORREÇÃO 12: Melhor tratamento de erros com feedback ao usuário
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao salvar receita. Tente novamente.";
      console.error("Erro ao salvar receita:", error);
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (income: Income) => {
    setEditing(income.id); // CORREÇÃO 13: Manter estado de edição até o formulário ser submetido
    
    // CORREÇÃO 14: Função formatDateForInput movida para fora para evitar recriação
    const formatDateForInput = (dateString: string | undefined) => {
      if (!dateString) return new Date().toISOString().split("T")[0];
      try {
        const date = new Date(dateString);
        // CORREÇÃO 15: Validar se a data é válida
        if (isNaN(date.getTime())) {
          return new Date().toISOString().split("T")[0];
        }
        return date.toISOString().split("T")[0];
      } catch (error) {
        console.error("Erro ao formatar data:", dateString, error);
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
      startDate: income.startDate ? formatDateForInput(income.startDate) : "",
      endDate: income.endDate ? formatDateForInput(income.endDate) : "",
    });
    setEditingId(income.id);
    setShowForm(true);
    // CORREÇÃO 16: NÃO limpar editing aqui, apenas quando cancelar ou salvar
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;

    setDeleting(id);
    setError(null);
    
    try {
      const res = await fetch(`${apiUrl(API_ENDPOINTS.FINANCE.INCOME)}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // CORREÇÃO 17: Verificar status e tratar erros adequadamente
      if (!res.ok) {
        let errorMessage = "Erro ao excluir receita";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = res.statusText || `Erro ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      // Recarregar dados após exclusão bem-sucedida
      await fetchData();
    } catch (error) {
      // CORREÇÃO 18: Feedback ao usuário em vez de apenas logar
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao excluir receita. Tente novamente.";
      console.error("Erro ao excluir receita:", error);
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  // CORREÇÃO 19: useCallback para funções utilitárias que não dependem de estado
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  // CORREÇÃO 20: useCallback para formatDate
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      // CORREÇÃO 21: Validar data antes de formatar
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Erro ao formatar data:", dateString, error);
      return "Data inválida";
    }
  }, []);

  // CORREÇÃO 22: useMemo para parseLocalDate
  function parseLocalDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      // CORREÇÃO 23: Validar se os valores são números válidos
      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        return null;
      }
      const date = new Date(year, month - 1, day);
      // CORREÇÃO 24: Validar se a data criada é válida
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch (error) {
      console.error("Erro ao fazer parse da data:", dateStr, error);
      return null;
    }
  }

  // CORREÇÃO 25: useCallback para handleRegisterPending
  const handleRegisterPending = useCallback(
    async (income: Income) => {
      setRegisteringPending(true);
      setError(null);
      
      try {
        // CORREÇÃO 26: Lógica simplificada e mais robusta para extrair ID
        let fixedIncomeId: number | null = null;
        
        // Se o ID é string com prefixo "pending-", extrair o ID numérico
        const incomeIdStr = String(income.id);
        if (incomeIdStr.startsWith("pending-")) {
          const parts = incomeIdStr.split("-");
          if (parts.length >= 3) {
            const parsedId = parseInt(parts[1], 10);
            if (!isNaN(parsedId)) {
              fixedIncomeId = parsedId;
            }
          }
        } else if (typeof income.id === "number" && !isNaN(income.id)) {
          fixedIncomeId = income.id;
        }

        // CORREÇÃO 27: Validar se conseguimos extrair um ID válido
        if (fixedIncomeId === null) {
          throw new Error("Não foi possível identificar a receita fixa");
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
            fixed_income_id: fixedIncomeId,
          }),
        });

        // CORREÇÃO 28: Verificar status antes de processar resposta
        if (!res.ok) {
          let errorMessage = "Erro desconhecido ao registrar receita";
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = res.statusText || `Erro ${res.status}`;
          }
          throw new Error(errorMessage);
        }

        await fetchData();
      } catch (error) {
        // CORREÇÃO 29: Melhor tratamento de erros
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro ao registrar receita. Tente novamente.";
        console.error("Erro ao registrar receita pendente:", error);
        setError(errorMessage);
        alert(errorMessage);
      } finally {
        // CORREÇÃO 30: Remover setTimeout desnecessário - useState já é assíncrono
        setRegisteringPending(false);
      }
    },
    [token, fetchData]
  );

  // CORREÇÃO 31: useMemo para arrays estáticos
  const months = useMemo(
    () => [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ],
    []
  );

  const years = useMemo(
    () =>
      Array.from(
        { length: 10 },
        (_, i) => new Date().getFullYear() - 5 + i
      ),
    []
  );

  // CORREÇÃO 32: useCallback para handlers de navegação de mês
  const handlePreviousMonth = useCallback(() => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  }, [selectedMonth]);

  // CORREÇÃO 33: Remover código duplicado (MonthYearFilter não era usado)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando receitas..." />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* CORREÇÃO 34: Exibir erros de forma mais elegante */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Receitas
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => (window.location.href = "/rendas/fixas")}>
              <Settings className="inline w-4 h-4 mr-1 align-text-bottom" />{" "}
              Rendas Fixas
            </Button>
            <Button
              onClick={() => {
                setFormData((form) => ({
                  ...form,
                  startDate: form.date,
                }));
                setShowForm(true);
                setEditingId(null); // CORREÇÃO: Garantir que não está em modo de edição
                setEditing(null);
              }}
            >
              + Nova Receita
            </Button>
          </div>
        </div>

        {/* Filtro de mês/ano */}
        <div className="flex flex-wrap gap-2 items-center mb-4 justify-center">
          <button
            onClick={handlePreviousMonth}
            disabled={monthLoading}
            className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Mês anterior"
          >
            &lt;
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            disabled={monthLoading}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Selecionar mês"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            disabled={monthLoading}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Selecionar ano"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={handleNextMonth}
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
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
                      {formData.date
                        ? formatDateFns(
                            parseLocalDate(formData.date) || new Date(),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )
                        : "Selecione uma data"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={parseLocalDate(formData.date) || undefined}
                      onSelect={(date) => {
                        if (date) {
                          const localDate = formatDateFns(date, "yyyy-MM-dd");
                          setFormData((form) => ({
                            ...form,
                            date: localDate,
                            startDate: form.isFixed
                              ? localDate
                              : form.startDate,
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
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((form) => ({
                        ...form,
                        isFixed: checked,
                        startDate: checked ? form.date : form.startDate,
                      }));
                    }}
                    className="form-checkbox h-5 w-5 text-cyan-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Receita fixa
                  </span>
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrenceType: e.target.value,
                        })
                      }
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
                          {formData.startDate
                            ? formatDateFns(
                                parseLocalDate(formData.startDate) ||
                                  new Date(),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )
                            : "Selecione uma data"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            parseLocalDate(formData.startDate) || undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const localDate = formatDateFns(
                                date,
                                "yyyy-MM-dd"
                              );
                              setFormData((form) => ({
                                ...form,
                                startDate: localDate,
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
                          {formData.endDate
                            ? formatDateFns(
                                parseLocalDate(formData.endDate) || new Date(),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )
                            : "Selecione uma data"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            parseLocalDate(formData.endDate) || undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const localDate = formatDateFns(
                                date,
                                "yyyy-MM-dd"
                              );
                              setFormData((form) => ({
                                ...form,
                                endDate: localDate,
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
                  ) : editingId ? (
                    "Atualizar"
                  ) : (
                    "Salvar"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setEditing(null);
                    setFormData({
                      description: "",
                      value: "",
                      date: new Date().toISOString().split("T")[0],
                      category_id: "",
                      isFixed: false,
                      recurrenceType: "monthly",
                      startDate: new Date().toISOString().split("T")[0],
                      endDate: "",
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Aviso de receitas pendentes */}
        {incomes.some((i) => i.pending) && (
          <div className="mb-4 p-3 rounded bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 font-semibold">
            Existem receitas fixas pendentes para este mês. Utilize o botão
            "Registrar" ao lado de cada uma na tabela abaixo.
          </div>
        )}

        {/* Tabela de receitas */}
        {monthLoading ? (
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lista de Receitas
              </h3>
            </div>
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Carregando receitas..." />
            </div>
          </div>
        ) : (
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lista de Receitas
              </h3>
            </div>
            <div className="relative">
              {registeringPending && (
                <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 flex items-center justify-center z-10">
                  <LoadingSpinner size="lg" text="Registrando..." />
                </div>
              )}
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
                    <tr
                      key={income.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        income.pending ? "bg-yellow-50 dark:bg-yellow-900" : ""
                      }`}
                    >
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
                                disabled={
                                  registeringPending ||
                                  editing === income.id ||
                                  deleting === income.id
                                }
                                className="text-cyan-600 hover:text-cyan-900 disabled:opacity-50"
                              >
                                {editing === income.id ? (
                                  <div className="flex items-center gap-1">
                                    <LoadingSpinner size="sm" text="" />
                                    Editando...
                                  </div>
                                ) : (
                                  "Editar"
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(income.id)}
                                disabled={
                                  registeringPending ||
                                  editing === income.id ||
                                  deleting === income.id
                                }
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {deleting === income.id ? (
                                  <div className="flex items-center gap-1">
                                    <LoadingSpinner size="sm" text="" />
                                    Excluindo...
                                  </div>
                                ) : (
                                  "Excluir"
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

