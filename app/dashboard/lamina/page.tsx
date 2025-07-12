"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiUrl, API_ENDPOINTS } from "../../../lib/api";
import LoadingSpinner from "../../../components/LoadingSpinner";

// Função para formatar valores monetários no formato brasileiro
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function LaminaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = parseInt(searchParams.get('month') || `${new Date().getMonth() + 1}`);
  const year = parseInt(searchParams.get('year') || `${new Date().getFullYear()}`);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl(API_ENDPOINTS.FINANCE.DASHBOARD)}?month=${month}&year=${year}`);
        const result = await res.json();
        setData(result);
      } catch (error) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Carregando lâmina..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-600">Erro ao carregar dados da lâmina</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 print:shadow-none print:bg-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lâmina Financeira</h1>
          <button
            onClick={() => window.print()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold print:hidden"
          >
            Imprimir / Salvar PDF
          </button>
        </div>
        {/* Visão Geral */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Visão Geral</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Saldo</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency((data.monthlyIncome || 0) - (data.monthlyExpense || 0))}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Rendas do mês</div>
              <div className="text-2xl font-bold text-cyan-600">{formatCurrency(data.monthlyIncome || 0)}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Despesas do mês</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(data.monthlyExpense || 0)}</div>
            </div>
          </div>
        </section>
        {/* Gráficos e Resumos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Gráficos e Resumos</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center text-gray-400">
            [Gráficos de pizza/barras por categoria e proporção de rendas/despesas aqui]
          </div>
        </section>
        {/* Transações Recentes */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Transações Recentes</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center text-gray-400">
            [Lista de transações recentes aqui]
          </div>
        </section>
        <div className="text-center text-sm text-gray-400 mt-8 print:hidden">
          <button onClick={() => router.back()} className="underline">Voltar ao Dashboard</button>
        </div>
      </div>
    </div>
  );
} 