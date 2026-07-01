export const apiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  return `${baseUrl}${path}`;
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
    FORGOT: "/auth/esqueci-senha",
    RESET: "/auth/trocar-senha",
  },
  FINANCE: {
    DASHBOARD: "/finance/dashboard",
    INCOME: "/finance/income",
    EXPENSE: "/finance/expense",
  },
  CATEGORY: "/category",
  GOAL: "/goal",
  FIXED_INCOMES: "/fixed-incomes",
  FIXED_EXPENSES: "/fixed-expenses",
  INVESTMENTS: {
    BASE: "/investments",
    SUMMARY: "/investments/summary",
    TRANSACTIONS: "/investments/transactions",
    MARKET_REFRESH: "/investments/market/refresh",
  },
} as const;

export const authenticatedRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(apiUrl(endpoint), { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro na requisição" }));
    throw new Error(error.error || `Erro ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};
