// Configuração da API
// Função para construir URLs da API
export const apiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${baseUrl}${path}`;
};

// Função utilitária para verificar se o usuário tem acesso válido
export const hasValidAccess = (user: any): boolean => {
  if (!user) return false;
  
  return (
    user.subscription_status === 'active' ||
    user.subscription_status === 'trialing' ||
    (user.subscription_status === 'canceled' && user.premium_until && new Date(user.premium_until) > new Date()) ||
    user.plan === 'TRIAL' ||
    (user.trial_end && new Date(user.trial_end) > new Date())
  );
};

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
    console.error('❌ Erro na resposta:', error);
    throw new Error(error.error || `Erro ${response.status}`);
  }

      const data = await response.json();
  return data;
}; 