// Configuração da API
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000/api';

// Função para construir URLs da API
export const apiUrl = (endpoint: string) => `${BACKEND_URL}${endpoint}`;

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  
  // Dashboard e perfil
  PROTECTED: {
    DASHBOARD: '/protected/dashboard',
  },
  
  // Finanças
  FINANCE: {
    DASHBOARD: '/finance/dashboard',
    INCOME: '/finance/income',
    EXPENSE: '/finance/expense',
  },
  
  // Categorias
  CATEGORY: '/category',
  
  // Stripe
  STRIPE: {
    CREATE_CHECKOUT: '/stripe/create-checkout-session',
    CANCEL_SUBSCRIPTION: '/stripe/cancel-subscription',
  },
} as const;

// Função helper para fazer requisições autenticadas
export const authenticatedRequest = async (
  endpoint: string, 
  options: RequestInit = {},
  token?: string
) => {
  const url = apiUrl(endpoint);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro na requisição' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  return response.json();
}; 