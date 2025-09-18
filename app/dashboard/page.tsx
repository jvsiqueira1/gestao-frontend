"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRequestLoading } from "../../lib/useRequestLoading";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis as BarXAxis, YAxis as BarYAxis, Tooltip as BarTooltip, Legend } from "recharts";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from 'xlsx';
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import DashboardLoadingOverlay from "../../components/DashboardLoadingOverlay";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { hasValidAccess } from '../../lib/api';
import { FileText, Calendar, BarChart3 } from 'lucide-react';

// Função para formatar valores monetários no formato brasileiro
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função utilitária para agrupar receitas/despesas por categoria
function mergeCategoryData(incomes: any[], expenses: any[]) {
  const catMap: Record<string, { receita: number; despesa: number; categoria: string }> = {};
  incomes.forEach((i) => {
    const cat = i.category_name || 'N/A';
    if (!catMap[cat]) catMap[cat] = { receita: 0, despesa: 0, categoria: cat };
    catMap[cat].receita += parseFloat(i.value) || 0;
  });
  expenses.forEach((e) => {
    const cat = e.category_name || 'N/A';
    if (!catMap[cat]) catMap[cat] = { receita: 0, despesa: 0, categoria: cat };
    catMap[cat].despesa += parseFloat(e.value) || 0;
  });
  return Object.values(catMap);
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const { withLoading } = useRequestLoading();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', description: '', target: '', deadline: '' });
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalError, setGoalError] = useState('');
  const [showAddValueModal, setShowAddValueModal] = useState(false);
  const [addValueGoalId, setAddValueGoalId] = useState<number | null>(null);
  const [addValueAmount, setAddValueAmount] = useState('');
  const [addValueLoading, setAddValueLoading] = useState(false);
  const [addValueError, setAddValueError] = useState('');
  const [editGoalId, setEditGoalId] = useState<number | null>(null);
  const [editGoalForm, setEditGoalForm] = useState({ name: '', description: '', target: '', deadline: '', status: 'active' });
  const [editGoalLoading, setEditGoalLoading] = useState(false);
  const [editGoalError, setEditGoalError] = useState('');
  const [deleteGoalId, setDeleteGoalId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [celebratedGoals, setCelebratedGoals] = useState<number[]>([]);
  const [showLamina, setShowLamina] = useState(false);
  const laminaRef = useRef<HTMLDivElement>(null);
  const [laminaLoading, setLaminaLoading] = useState(false);
  const [laminaData, setLaminaData] = useState<{incomes: any[], expenses: any[]}|null>(null);

  const queryClient = useQueryClient();
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useQuery({
    queryKey: ['goals', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(apiUrl('/goal'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao carregar metas financeiras.');
      }
      return await res.json();
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [selectedMonth, selectedYear, token]);

  useEffect(() => {
    // Só redireciona se o usuário não tem acesso válido
    if (user) {
      if (!hasValidAccess(user)) {
        router.replace("/perfil");
      }
    }
  }, [user, router]);

  // Atualizar dados quando o usuário volta para a página (foco na janela)
  useEffect(() => {
    const handleFocus = () => {
      if (user && hasValidAccess(user)) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, selectedMonth, selectedYear]);

  const fetchData = async () => {
    await withLoading(async () => {
      try {
        const res = await fetch(`${apiUrl(API_ENDPOINTS.FINANCE.DASHBOARD)}?month=${selectedMonth}&year=${selectedYear}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setData(result);
        
        // Gerar lista de anos disponíveis baseada na data de cadastro do usuário
        if (result.userCreatedYear) {
          const currentYear = new Date().getFullYear();
          const years = [];
          for (let year = result.userCreatedYear; year <= currentYear; year++) {
            years.push(year);
          }
          setAvailableYears(years);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    });
  };

  const fetchExportData = async () => {
    try {
      const [incomesRes, expensesRes] = await Promise.all([
        fetch(apiUrl(API_ENDPOINTS.FINANCE.INCOME), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl(API_ENDPOINTS.FINANCE.EXPENSE), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!incomesRes.ok) {
        throw new Error(`Erro ao buscar receitas: ${incomesRes.status} ${incomesRes.statusText}`);
      }

      if (!expensesRes.ok) {
        throw new Error(`Erro ao buscar despesas: ${expensesRes.status} ${expensesRes.statusText}`);
      }

      const [incomesData, expensesData] = await Promise.all([
        incomesRes.json(),
        expensesRes.json(),
      ]);

      const incomes = Array.isArray(incomesData) ? incomesData : [];
      const expenses = Array.isArray(expensesData) ? expensesData : [];

      return { incomes, expenses };
    } catch (error) {
      console.error("Erro detalhado ao buscar dados para exportação:", error);
      throw error;
    }
  };

  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const exportData = await fetchExportData();
      
      // Filtrar dados pelo range de datas
      const filteredIncomes = exportData.incomes.filter((income: any) => {
        // Extrair apenas a data (YYYY-MM-DD) da string
        const incomeDateStr = income.date.split('T')[0];
        const startDateStr = dateRange.startDate;
        const endDateStr = dateRange.endDate;
        
        return incomeDateStr >= startDateStr && incomeDateStr <= endDateStr;
      });

      const filteredExpenses = exportData.expenses.filter((expense: any) => {
        // Extrair apenas a data (YYYY-MM-DD) da string
        const expenseDateStr = expense.date.split('T')[0];
        const startDateStr = dateRange.startDate;
        const endDateStr = dateRange.endDate;
        
        return expenseDateStr >= startDateStr && expenseDateStr <= endDateStr;
      });

      // Preparar dados para o Excel
      const incomesSheet = filteredIncomes.map((income: any) => ({
        'Tipo': 'Receita',
        'Descrição': income.description || 'Sem descrição',
        'Valor': parseFloat(income.value) || 0,
        'Data': new Date(income.date).toLocaleDateString('pt-BR'),
        'Categoria': income.category_name || 'N/A',
        'Data de Criação': new Date(income.created_at).toLocaleDateString('pt-BR')
      }));

      const expensesSheet = filteredExpenses.map((expense: any) => ({
        'Tipo': 'Despesa',
        'Descrição': expense.description || 'Sem descrição',
        'Valor': parseFloat(expense.value) || 0,
        'Data': new Date(expense.date).toLocaleDateString('pt-BR'),
        'Categoria': expense.category_name || 'N/A',
        'Data de Criação': new Date(expense.created_at).toLocaleDateString('pt-BR')
      }));

      // Combinar dados
      const allData = [...incomesSheet, ...expensesSheet];

      if (allData.length === 0) {
        alert('Nenhum dado encontrado no período selecionado para exportar.');
        return;
      }

      // Criar workbook
      const wb = XLSXUtils.book_new();
      
      // Criar worksheet
      const ws = XLSXUtils.json_to_sheet(allData);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 10 }, // Tipo
        { wch: 30 }, // Descrição
        { wch: 15 }, // Valor
        { wch: 12 }, // Data
        { wch: 20 }, // Categoria
        { wch: 15 }, // Data de Criação
      ];
      ws['!cols'] = colWidths;

      // Adicionar worksheet ao workbook
      XLSXUtils.book_append_sheet(wb, ws, 'Relatório Financeiro');

      // Gerar nome do arquivo com data
      const fileName = `relatorio_financeiro_${dateRange.startDate}_${dateRange.endDate}.xlsx`;

      // Salvar arquivo
      XLSXWriteFile(wb, fileName);

      setShowExportModal(false);
      alert(`Relatório exportado com sucesso!\nArquivo: ${fileName}\nRegistros: ${allData.length}`);
    } catch (error) {
      console.error("Erro detalhado ao exportar:", error);
      alert(`Erro ao exportar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setExportLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  // Função para abrir modal de adicionar valor
  const openAddValueModal = (goalId: number) => {
    setAddValueGoalId(goalId);
    setAddValueAmount('');
    setAddValueError('');
    setShowAddValueModal(true);
  };

  // Função para abrir modal de edição
  const openEditGoalModal = (goal: any) => {
    setEditGoalId(goal.id);
    setEditGoalForm({
      name: goal.name,
      description: goal.description || '',
      target: goal.target.toString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      status: goal.status || 'active',
    });
    setEditGoalError('');
    setShowGoalModal(false);
  };

  // Função para deletar meta
  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    setDeleteGoalId(goalId);
    try {
      const res = await fetch(apiUrl(`/goal/${goalId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccessMessage('Meta excluída com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['goals', token] });
      }
    } catch {}
    setDeleteGoalId(null);
  };

  // Função para disparar confete ao atingir 100%
  const celebrateGoal = async (goalId: number) => {
    if (!celebratedGoals.includes(goalId)) {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
      });
      setCelebratedGoals((prev) => [...prev, goalId]);
    }
  };

  // Carregar metas celebradas do localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem('celebratedGoals');
    if (stored) {
      setCelebratedGoals(JSON.parse(stored));
    }
  }, []);

  // Salvar metas celebradas no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('celebratedGoals', JSON.stringify(celebratedGoals));
  }, [celebratedGoals]);

  // Disparar confete só quando uma meta for batida agora (não ao abrir a página)
  useEffect(() => {
    goals.forEach((goal: any) => {
      const percent = Math.min(100, (goal.saved / goal.target) * 100);
      // Só celebra se: atingiu 100% agora, não está em celebratedGoals, e não estava batida antes
      if (
        percent >= 100 &&
        !celebratedGoals.includes(goal.id) &&
        // Só dispara se a meta não estava batida ao carregar a página
        (!goal._wasCompleted || goal._wasCompleted === false)
      ) {
        celebrateGoal(goal.id);
      }
    });
    // eslint-disable-next-line
  }, [goals]);

  // Marcar metas já batidas ao carregar (para não disparar confete ao abrir a página)
  useEffect(() => {
    setCelebratedGoals((prev) => {
      const alreadyCompleted = goals
        .filter((goal: any) => (goal.saved / goal.target) * 100 >= 100)
        .map((goal: any) => goal.id);
      // Marca como já celebradas metas já batidas, sem disparar confete
      return Array.from(new Set([...prev, ...alreadyCompleted]));
    });
  }, [goals.length === 0]);

  // Popup de sucesso desaparece automaticamente após 3 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleGerarLamina = async () => {
    setLaminaLoading(true);
    // Busca todas as transações do mês
    const exportData = await fetchExportData();
    // Filtra pelo mês/ano atual
    const monthStr = selectedMonth.toString().padStart(2, '0');
    const yearStr = selectedYear.toString();
    const filteredIncomes = exportData.incomes.filter((income: any) => {
      const d = new Date(income.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
    const filteredExpenses = exportData.expenses.filter((expense: any) => {
      const d = new Date(expense.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
    setLaminaData({ incomes: filteredIncomes, expenses: filteredExpenses });
    setShowLamina(true);
    setTimeout(async () => {
      if (laminaRef.current) {
        const canvas = await (html2canvas as any)(laminaRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let pdfWidth = pageWidth;
        let pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        if (pdfHeight > pageHeight) {
          pdfHeight = pageHeight;
          pdfWidth = (canvas.width * pdfHeight) / canvas.height;
        }
        const x = (pageWidth - pdfWidth) / 2;
        const y = 20;
        pdf.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight - 40);
        pdf.save(`lamina_financeira_${selectedMonth}_${selectedYear}.pdf`);
      }
      setShowLamina(false);
      setLaminaLoading(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          {/* Título principal fora de card: */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <Button onClick={handleGerarLamina} className="w-full sm:w-auto" disabled={laminaLoading}>
            {laminaLoading ? "Gerando..." : <><FileText className="inline w-4 h-4 mr-1 align-text-bottom" /> Gerar Lâmina</>}
          </Button>
        </div>

        {/* Filtros de Mês e Ano */}
        <div className="bg-card dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
            {(selectedMonth !== new Date().getMonth() + 1 || selectedYear !== new Date().getFullYear()) && (
              <Button 
                variant="secondary" 
                onClick={() => {
                  setSelectedMonth(new Date().getMonth() + 1);
                  setSelectedYear(new Date().getFullYear());
                }}
                className="text-xs px-3 py-1 h-8 w-full sm:w-auto"
              >
                <Calendar className="inline w-4 h-4 mr-1 align-text-bottom" /> Voltar ao Atual
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Mês
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className={`w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 bg-background text-foreground ${
                  selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-cyan-500'
                }`}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 bg-background text-foreground ${
                  selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-cyan-500'
                }`}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year} {year === new Date().getFullYear() ? '' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3">
            {data.userCreatedAt && (
              <p className="text-sm text-muted-foreground">
                Membro desde {new Date(data.userCreatedAt).toLocaleDateString('pt-BR')}
              </p>
            )}
            {(selectedMonth !== new Date().getMonth() + 1 || selectedYear !== new Date().getFullYear()) && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                <BarChart3 className="inline w-4 h-4 mr-1 align-text-bottom" /> Visualizando dados históricos
              </p>
            )}
          </div>
        </div>
        
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2">
              Receitas de {getMonthName(selectedMonth)}/{selectedYear}
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {formatCurrency(data.monthlyIncome || 0)}
            </p>
          </div>
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2">
              Despesas de {getMonthName(selectedMonth)}/{selectedYear}
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {formatCurrency(data.monthlyExpense || 0)}
            </p>
          </div>
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2">Saldo</h3>
            <p className={`text-2xl sm:text-3xl font-bold ${(data.monthlyIncome - data.monthlyExpense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency((data.monthlyIncome || 0) - (data.monthlyExpense || 0))}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Gráfico de linha */}
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4 sm:p-6 select-none">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Receitas x Despesas ({selectedYear})
            </h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <LineChart data={data.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `${label} ${selectedYear}`}
                />
                <Line type="monotone" dataKey="income" stroke="#00C49F" strokeWidth={2} name="Receitas" />
                <Line type="monotone" dataKey="expense" stroke="#FF8042" strokeWidth={2} name="Despesas" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de pizza */}
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Despesas por Categoria ({getMonthName(selectedMonth)}/{selectedYear})
            </h3>
            {(!data.categoryData || data.categoryData.length === 0) ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <div className="text-center">
                  <div className="text-6xl mb-4"><BarChart3 className="inline w-10 h-10 text-gray-400" /></div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                    Sem dados para exibir
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Nenhuma despesa registrada em {getMonthName(selectedMonth)}/{selectedYear}
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [formatCurrency(value), '']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Após os gráficos, antes do modal de exportação */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Metas Financeiras</h2>
            <Button onClick={() => setShowGoalModal(true)}>+ Nova Meta</Button>
          </div>
          {goalsLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="md" text="Carregando metas..." />
            </div>
          ) : goalsError ? (
            <div className="text-center text-red-600 dark:text-red-400 py-2 font-medium animate-shake">
              {goalsError instanceof Error ? goalsError.message : goalsError}
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhuma meta cadastrada ainda.<br />
              <span className="text-sm">Clique em <b>+ Nova Meta</b> para criar sua primeira meta financeira!</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal: any) => {
                const percent = Math.min(100, (goal.saved / goal.target) * 100);
                return (
                  <div key={goal.id} className="bg-card text-card-foreground border border-border rounded-lg shadow p-6 flex flex-col gap-3 relative">
                    {/* Selo de meta concluída */}
                    {percent >= 100 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce z-10">
                        🎉 Meta Concluída!
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                      {goal.deadline && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Até {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                    {goal.description && <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{goal.description}</p>}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Guardado: <b>R$ {goal.saved.toFixed(2)}</b></span>
                      <span className="text-sm">Meta: <b>R$ {goal.target.toFixed(2)}</b></span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                      <div
                        className="bg-cyan-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{percent.toFixed(0)}% atingido</span>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openAddValueModal(goal.id)} title="Adicionar valor">Adicionar valor</Button>
                        <Button variant="secondary" onClick={() => openEditGoalModal(goal)} title="Editar">✏️</Button>
                        <Button variant="secondary" onClick={() => handleDeleteGoal(goal.id)} disabled={deleteGoalId === goal.id} title="Excluir">{deleteGoalId === goal.id ? '...' : '🗑️'}</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal de Exportação */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Exportar Relatório para Excel
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>O relatório incluirá:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                    <li>• Todas as receitas e despesas no período</li>
                    <li>• Descrição, valor, data e categoria</li>
                    <li>• Formato Excel (.xlsx)</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button 
                  onClick={exportToExcel}
                  disabled={exportLoading}
                  className="flex-1"
                >
                  {exportLoading ? 'Exportando...' : 'Exportar'}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setShowExportModal(false)}
                  disabled={exportLoading}
                  className="flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {showGoalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Nova Meta Financeira</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setGoalSubmitting(true);
                setGoalError('');
                try {
                  const res = await fetch(apiUrl('/goal'), {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      name: goalForm.name,
                      description: goalForm.description,
                      target: parseFloat(goalForm.target),
                      deadline: goalForm.deadline || undefined,
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    setGoalError(err.error || 'Erro ao criar meta.');
                  } else {
                    setShowGoalModal(false);
                    setGoalForm({ name: '', description: '', target: '', deadline: '' });
                    queryClient.invalidateQueries({ queryKey: ['goals', token] });
                  }
                } catch (err) {
                  setGoalError('Erro ao criar meta.');
                } finally {
                  setGoalSubmitting(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Nome</label>
                  <input type="text" value={goalForm.name} onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Descrição</label>
                  <textarea value={goalForm.description} onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Valor objetivo (R$)</label>
                  <input type="number" min="0.01" step="0.01" value={goalForm.target} onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))} required className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Data limite (opcional)</label>
                  <input type="date" value={goalForm.deadline} onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                {goalError && <div className="text-red-600 text-sm">{goalError}</div>}
                <div className="flex gap-3 mt-4">
                  <Button type="submit" disabled={goalSubmitting}>{goalSubmitting ? 'Salvando...' : 'Salvar'}</Button>
                  <Button type="button" variant="secondary" onClick={() => { setShowGoalModal(false); setGoalForm({ name: '', description: '', target: '', deadline: '' }); }} disabled={goalSubmitting}>Cancelar</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddValueModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Adicionar valor à meta</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setAddValueLoading(true);
                setAddValueError('');
                try {
                  const res = await fetch(apiUrl(`/goal/${addValueGoalId}/add`), {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ amount: addValueAmount }),
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    setAddValueError(err.error || 'Erro ao adicionar valor.');
                  } else {
                    setShowAddValueModal(false);
                    setSuccessMessage('Valor adicionado com sucesso!');
                    queryClient.invalidateQueries({ queryKey: ['goals', token] });
                  }
                } catch {
                  setAddValueError('Erro ao adicionar valor.');
                } finally {
                  setAddValueLoading(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Valor a adicionar (R$)</label>
                  <input type="number" min="0.01" step="0.01" value={addValueAmount} onChange={e => setAddValueAmount(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                {addValueError && <div className="text-red-600 text-sm">{addValueError}</div>}
                <div className="flex gap-3 mt-4">
                  <Button type="submit" disabled={addValueLoading}>{addValueLoading ? 'Adicionando...' : 'Adicionar'}</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowAddValueModal(false)} disabled={addValueLoading}>Cancelar</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editGoalId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Editar Meta Financeira</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setEditGoalLoading(true);
                setEditGoalError('');
                try {
                  const res = await fetch(apiUrl(`/goal/${editGoalId}`), {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      name: editGoalForm.name,
                      description: editGoalForm.description,
                      target: editGoalForm.target,
                      deadline: editGoalForm.deadline || undefined,
                      status: editGoalForm.status,
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    setEditGoalError(err.error || 'Erro ao editar meta.');
                  } else {
                    setEditGoalId(null);
                    setSuccessMessage('Meta editada com sucesso!');
                    queryClient.invalidateQueries({ queryKey: ['goals', token] });
                  }
                } catch {
                  setEditGoalError('Erro ao editar meta.');
                } finally {
                  setEditGoalLoading(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Nome</label>
                  <input type="text" value={editGoalForm.name} onChange={e => setEditGoalForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Descrição</label>
                  <textarea value={editGoalForm.description} onChange={e => setEditGoalForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Valor objetivo (R$)</label>
                  <input type="number" min="0.01" step="0.01" value={editGoalForm.target} onChange={e => setEditGoalForm(f => ({ ...f, target: e.target.value }))} required className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Data limite (opcional)</label>
                  <input type="date" value={editGoalForm.deadline} onChange={e => setEditGoalForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                  <select value={editGoalForm.status} onChange={e => setEditGoalForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-background text-foreground">
                    <option value="active">Ativa</option>
                    <option value="completed">Concluída</option>
                  </select>
                </div>
                {editGoalError && <div className="text-red-600 text-sm">{editGoalError}</div>}
                <div className="flex gap-3 mt-4">
                  <Button type="submit" disabled={editGoalLoading}>{editGoalLoading ? 'Salvando...' : 'Salvar'}</Button>
                  <Button type="button" variant="secondary" onClick={() => setEditGoalId(null)} disabled={editGoalLoading}>Cancelar</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            {successMessage}
            <button className="ml-4 text-white font-bold" onClick={() => setSuccessMessage('')}>×</button>
          </div>
        )}
      </div>
      
      {/* Loading Overlay */}
      <DashboardLoadingOverlay />
      {/* Lâmina oculta para PDF */}
      {showLamina && laminaData ? (() => {
        // Indicadores Visuais Simples - Despesas por Categoria
        const catMap: Record<string, number> = {};
        laminaData.expenses.forEach((e) => {
          const cat = e.category_name || 'N/A';
          catMap[cat] = (catMap[cat] || 0) + parseFloat(e.value) || 0;
        });
        const total = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        const despesasPorCategoria = sorted.length === 0 ? (
          <div style={{ color: '#aaa', fontSize: 14 }}>Sem despesas no mês</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map(([cat, val], idx) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 140, fontWeight: 500, color: '#444', fontSize: 15 }}>{cat}</div>
                <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: `${(val / total) * 100}%`, background: '#dc2626', height: '100%', borderRadius: 6, transition: 'width 0.3s' }} />
                </div>
                <div style={{ width: 90, textAlign: 'right', fontWeight: 600, color: '#dc2626', fontSize: 15 }}>{formatCurrency(val)}</div>
              </div>
            ))}
          </div>
        );
        // Resumo do mês: tabela de despesas
        const despesas = laminaData.expenses;
        const totalDespesas = despesas.reduce((acc, t) => acc + parseFloat(t.value), 0);
        const tabelaDespesas = (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, marginBottom: 8 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Data</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Categoria</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Descrição</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {despesas.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: 12 }}>Nenhuma despesa registrada no mês</td>
                </tr>
              ) : (
                despesas
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((t: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                        {(() => {
                          const date = new Date(t.date);
                          const year = date.getUTCFullYear();
                          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                          const day = String(date.getUTCDate()).padStart(2, '0');
                          return `${day}/${month}/${year}`;
                        })()}
                      </td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{t.category_name || '-'}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{t.description || '-'}</td>
                      <td style={{ padding: 8, border: '1px solid #e5e7eb', color: '#dc2626', fontWeight: 600 }}>{formatCurrency(parseFloat(t.value))}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        );
        return (
          <div style={{ position: "fixed", left: -9999, top: 0, width: 900, background: "#f8fafc" }}>
            <div ref={laminaRef} style={{ background: "white", color: "#222", padding: 32, width: 900, fontFamily: 'Arial, sans-serif', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
              {/* Cabeçalho */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <img src="/apple-touch-icon.png" alt="Logo Gestão de Gastos" style={{ width: 48, height: 48, marginRight: 20, borderRadius: 12, boxShadow: '0 1px 4px #0002' }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>Lâmina Financeira</div>
                  <div style={{ fontSize: 16, color: '#666' }}>{getMonthName(selectedMonth)}/{selectedYear} {user?.name ? `- ${user.name}` : ''}</div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 12, color: '#888', textAlign: 'right' }}>Gerado em {new Date().toLocaleString('pt-BR')}</div>
              </div>
              {/* Cards de visão geral */}
              <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                <div style={{ flex: 1, background: '#e0f7fa', borderRadius: 8, padding: 20, textAlign: 'center', boxShadow: '0 1px 4px #0001' }}>
                  <div style={{ fontSize: 14, color: '#0891b2', marginBottom: 4 }}>Receitas</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0891b2' }}>{formatCurrency(data.monthlyIncome || 0)}</div>
                </div>
                <div style={{ flex: 1, background: '#ffebee', borderRadius: 8, padding: 20, textAlign: 'center', boxShadow: '0 1px 4px #0001' }}>
                  <div style={{ fontSize: 14, color: '#dc2626', marginBottom: 4 }}>Despesas</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(data.monthlyExpense || 0)}</div>
                </div>
                <div style={{ flex: 1, background: '#e8f5e9', borderRadius: 8, padding: 20, textAlign: 'center', boxShadow: '0 1px 4px #0001' }}>
                  <div style={{ fontSize: 14, color: '#16a34a', marginBottom: 4 }}>Saldo</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{formatCurrency((data.monthlyIncome || 0) - (data.monthlyExpense || 0))}</div>
                </div>
              </div>
              {/* Indicadores Visuais Simples - Despesas por Categoria */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Despesas por Categoria</div>
                {despesasPorCategoria}
              </div>
              {/* Tabela de Despesas do Mês */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Despesas do Mês</div>
                {tabelaDespesas}
              </div>
              <div style={{ textAlign: 'right', color: '#aaa', fontSize: 12, marginTop: 16 }}>
                Relatório gerado por {user?.name || 'Usuário'} em {new Date().toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
} 