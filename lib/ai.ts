// Configuração simplificada para chatbot baseado em regras
export const CHATBOT_CONFIG = {
  name: 'Suporte',
  version: '1.0.0',
  type: 'rules-based'
};

// Contexto do sistema para o chatbot
export const SYSTEM_PROMPT = `Você é um assistente de suporte especializado em um sistema de gestão financeira pessoal.

SOBRE O SISTEMA:
- É uma aplicação web para controle de receitas e despesas
- Possui dashboard com gráficos e relatórios
- Sistema de categorização para organizar gastos
- Exportação de relatórios para Excel
- Sistema de assinatura com trial gratuito

FUNCIONALIDADES PRINCIPAIS:
1. Dashboard: Resumo mensal, gráficos, filtros por período
2. Receitas: Adicionar, editar, excluir receitas com categorias
3. Despesas: Adicionar, editar, excluir despesas (categoria obrigatória)
4. Categorias: Criar categorias personalizadas por tipo
5. Exportação: Relatórios em Excel com filtros de data
6. Perfil: Gerenciar assinatura e dados pessoais

INSTRUÇÕES:
- Seja amigável e prestativo
- Forneça instruções passo a passo quando necessário
- Sugira funcionalidades relacionadas
- Se não souber algo específico, sugira contatar o suporte
- Mantenha respostas concisas mas informativas
- Use emojis ocasionalmente para ser mais amigável

EXEMPLOS DE PERGUNTAS FREQUENTES:
- Como adicionar receita/despesa
- Como usar categorias
- Como exportar relatórios
- Como usar o dashboard
- Problemas técnicos
- Assinatura e planos`;

// Interface para respostas de IA
export interface AIResponse {
  text: string;
  confidence: number;
  suggestions?: string[];
  needsHumanSupport?: boolean;
}

// Função para gerar respostas baseadas em regras
export async function callAIAPI(
  userMessage: string, 
  conversationHistory: string[] = []
): Promise<AIResponse> {
  // Sempre usar respostas baseadas em regras
  return generateRuleBasedResponse(userMessage);
}



// Resposta baseada em regras (fallback)
function generateRuleBasedResponse(userMessage: string): AIResponse {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('receita') || lowerMessage.includes('renda')) {
    return {
      text: 'Para adicionar uma receita:\n1. Acesse a página "Receitas"\n2. Clique em "+ Nova Receita"\n3. Preencha descrição, valor, data e categoria\n4. Clique em "Salvar" ✅',
      confidence: 0.8,
      suggestions: ['Como categorizar receitas?', 'Como editar uma receita?']
    };
  }
  
  if (lowerMessage.includes('despesa') || lowerMessage.includes('gasto')) {
    return {
      text: 'Para adicionar uma despesa:\n1. Acesse a página "Despesas"\n2. Clique em "+ Nova Despesa"\n3. Preencha descrição, valor, data e categoria (obrigatório)\n4. Clique em "Salvar" 💰',
      confidence: 0.8,
      suggestions: ['Por que categoria é obrigatória?', 'Como editar uma despesa?']
    };
  }
  
  if (lowerMessage.includes('categoria')) {
    return {
      text: 'As categorias ajudam a organizar suas finanças:\n• Crie categorias personalizadas\n• Separe por tipo (receita/despesa)\n• Visualize gastos por categoria no dashboard\n• Categorias são obrigatórias para despesas 🏷️',
      confidence: 0.7,
      suggestions: ['Como criar uma categoria?', 'Categorias padrão disponíveis']
    };
  }
  
  if (lowerMessage.includes('dashboard') || lowerMessage.includes('relatório')) {
    return {
      text: 'O dashboard mostra:\n• Resumo mensal (receitas, despesas, saldo)\n• Gráficos de evolução anual\n• Despesas por categoria\n• Filtros por mês/ano\n• Exportação de relatórios 📊',
      confidence: 0.7,
      suggestions: ['Como exportar relatórios?', 'Como usar os filtros?']
    };
  }
  
  if (lowerMessage.includes('exportar') || lowerMessage.includes('excel')) {
    return {
      text: 'Para exportar relatórios:\n1. No dashboard, clique em "📊 Exportar para Excel"\n2. Escolha o período (data inicial e final)\n3. Clique em "Exportar"\n4. O arquivo Excel será baixado automaticamente 📈',
      confidence: 0.8,
      suggestions: ['Quais dados são incluídos?', 'Formatos disponíveis']
    };
  }
  
  if (lowerMessage.includes('problema') || lowerMessage.includes('erro') || lowerMessage.includes('bug')) {
    return {
      text: 'Se você está enfrentando problemas:\n1. Verifique sua conexão com a internet\n2. Tente atualizar a página (F5)\n3. Limpe o cache do navegador\n4. Se o problema persistir, entre em contato conosco 🔧',
      confidence: 0.6,
      suggestions: ['Como contatar o suporte?', 'Reportar um bug'],
      needsHumanSupport: true
    };
  }
  
  if (lowerMessage.includes('suporte') || lowerMessage.includes('humano') || lowerMessage.includes('contato') || lowerMessage.includes('falar')) {
    return {
      text: 'Claro! Vou abrir um formulário de contato para você. Preencha com suas informações e sua dúvida que entraremos em contato em breve! 📧',
      confidence: 0.9,
      suggestions: [],
      needsHumanSupport: true
    };
  }
  
  return {
    text: 'Desculpe, não entendi sua pergunta. Pode reformular ou escolher uma das opções sugeridas? 🤔',
    confidence: 0.3,
    suggestions: [
      'Como adicionar receita?',
      'Como adicionar despesa?', 
      'Como usar categorias?',
      'Como usar o dashboard?',
      'Como exportar relatórios?',
      'Falar com suporte humano'
    ]
  };
}

// Gerar sugestões baseadas na mensagem
function generateSuggestions(userMessage: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('receita')) {
    return ['Como categorizar receitas?', 'Como editar receita?', 'Como excluir receita?'];
  }
  
  if (lowerMessage.includes('despesa')) {
    return ['Por que categoria é obrigatória?', 'Como editar despesa?', 'Como excluir despesa?'];
  }
  
  if (lowerMessage.includes('categoria')) {
    return ['Como criar categoria?', 'Categorias padrão', 'Como excluir categoria?'];
  }
  
  if (lowerMessage.includes('dashboard')) {
    return ['Como exportar relatórios?', 'Como usar filtros?', 'Gráficos disponíveis'];
  }
  
  return [
    'Como adicionar receita?',
    'Como adicionar despesa?',
    'Como usar categorias?',
    'Como exportar relatórios?'
  ];
} 