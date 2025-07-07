"use client";
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { callAIAPI, AIResponse } from '../lib/ai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-reply' | 'link' | 'contact-form';
}

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface QuickReply {
  text: string;
  action: string;
}

const FAQ_DATA = {
  'como-adicionar-receita': {
    question: 'Como adicionar uma receita?',
    answer: 'Para adicionar uma receita:\n1. Acesse a página "Receitas"\n2. Clique em "+ Nova Receita"\n3. Preencha descrição, valor, data e categoria\n4. Clique em "Salvar"',
    quickReplies: [
      { text: 'Como categorizar receitas?', action: 'categorias-receitas' },
      { text: 'Editar receita existente', action: 'editar-receita' }
    ]
  },
  'como-adicionar-despesa': {
    question: 'Como adicionar uma despesa?',
    answer: 'Para adicionar uma despesa:\n1. Acesse a página "Despesas"\n2. Clique em "+ Nova Despesa"\n3. Preencha descrição, valor, data e categoria (obrigatório)\n4. Clique em "Salvar"',
    quickReplies: [
      { text: 'Categorias obrigatórias?', action: 'categorias-obrigatorias' },
      { text: 'Como editar despesa?', action: 'editar-despesa' }
    ]
  },
  'categorias': {
    question: 'Como funcionam as categorias?',
    answer: 'As categorias ajudam a organizar suas finanças:\n• Crie categorias personalizadas\n• Separe por tipo (receita/despesa)\n• Visualize gastos por categoria no dashboard\n• Categorias são obrigatórias para despesas',
    quickReplies: [
      { text: 'Criar nova categoria', action: 'criar-categoria' },
      { text: 'Categorias padrão', action: 'categorias-padrao' }
    ]
  },
  'dashboard': {
    question: 'Como usar o dashboard?',
    answer: 'O dashboard mostra:\n• Resumo mensal (receitas, despesas, saldo)\n• Gráficos de evolução anual\n• Despesas por categoria\n• Filtros por mês/ano\n• Exportação de relatórios',
    quickReplies: [
      { text: 'Exportar relatórios', action: 'exportar' },
      { text: 'Filtros temporais', action: 'filtros' }
    ]
  },
  'exportar': {
    question: 'Como exportar relatórios?',
    answer: 'Para exportar:\n1. No dashboard, clique em "📊 Exportar para Excel"\n2. Escolha o período (data inicial e final)\n3. Clique em "Exportar"\n4. O arquivo Excel será baixado automaticamente',
    quickReplies: [
      { text: 'Formatos disponíveis', action: 'formatos-exportacao' },
      { text: 'Dados incluídos', action: 'dados-exportacao' }
    ]
  },
  'assinatura': {
    question: 'Como funciona a assinatura?',
    answer: 'Sistema de assinatura:\n• Trial gratuito disponível\n• Upgrade para plano pago\n• Cancelamento a qualquer momento\n• Suporte prioritário para assinantes\n• Acesse seu perfil para gerenciar',
    quickReplies: [
      { text: 'Fazer upgrade', action: 'upgrade' },
      { text: 'Cancelar assinatura', action: 'cancelar' }
    ]
  },
  'problemas-tecnicos': {
    question: 'Problemas técnicos?',
    answer: 'Se você está enfrentando problemas:\n1. Verifique sua conexão com a internet\n2. Tente atualizar a página (F5)\n3. Limpe o cache do navegador\n4. Se o problema persistir, entre em contato conosco',
    quickReplies: [
      { text: 'Contato suporte', action: 'contato' },
      { text: 'Reportar bug', action: 'reportar-bug' }
    ]
  }
};

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mensagem inicial
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        text: `Olá ${user?.name || 'usuário'}! 👋 Como posso ajudar você hoje?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      
      const quickReplies: Message = {
        id: '2',
        text: 'Escolha uma opção ou digite sua pergunta:',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply'
      };
      
      setMessages([welcomeMessage, quickReplies]);
    }
  }, [isOpen, user?.name]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus no input quando abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleQuickReply = (action: string) => {
    const faqItem = FAQ_DATA[action as keyof typeof FAQ_DATA];
    if (faqItem) {
      // Adicionar pergunta do usuário
      const userMessage: Message = {
        id: Date.now().toString(),
        text: faqItem.question,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Simular digitação
      setIsTyping(true);
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: faqItem.answer,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        
        // Adicionar quick replies se existirem
        if (faqItem.quickReplies && faqItem.quickReplies.length > 0) {
          const quickReplyMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: 'Posso ajudar com mais alguma coisa?',
            sender: 'bot',
            timestamp: new Date(),
            type: 'quick-reply'
          };
          setMessages(prev => [...prev, quickReplyMessage]);
        }
      }, 1000);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, inputValue]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Gerar resposta baseada em regras
      const aiResponse: AIResponse = await callAIAPI(inputValue, conversationHistory);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Adicionar sugestões se disponíveis
      if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        const suggestionsMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: 'Aqui estão algumas sugestões relacionadas:',
          sender: 'bot',
          timestamp: new Date(),
          type: 'quick-reply'
        };
        setMessages(prev => [...prev, suggestionsMessage]);
      }
      
      // Se precisar de suporte humano
      if (aiResponse.needsHumanSupport) {
        // Aguardar um pouco antes de mostrar o formulário
        setTimeout(() => {
          showContactFormMessage();
        }, 1000);
      }
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, tive um problema ao processar sua pergunta. Tente novamente ou entre em contato conosco.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateResponse = (input: string): { text: string; quickReplies?: QuickReply[] } => {
    const lowerInput = input.toLowerCase();
    
    // Buscar por palavras-chave
    if (lowerInput.includes('receita') || lowerInput.includes('renda')) {
      return {
        text: 'Para adicionar uma receita, acesse a página "Receitas" e clique em "+ Nova Receita". Preencha os campos e salve!',
        quickReplies: [
          { text: 'Como categorizar?', action: 'categorias-receitas' },
          { text: 'Editar receita', action: 'editar-receita' }
        ]
      };
    }
    
    if (lowerInput.includes('despesa') || lowerInput.includes('gasto')) {
      return {
        text: 'Para adicionar uma despesa, acesse a página "Despesas" e clique em "+ Nova Despesa". A categoria é obrigatória!',
        quickReplies: [
          { text: 'Categorias obrigatórias?', action: 'categorias-obrigatorias' },
          { text: 'Como editar?', action: 'editar-despesa' }
        ]
      };
    }
    
    if (lowerInput.includes('categoria')) {
      return {
        text: 'As categorias ajudam a organizar suas finanças. Acesse "Categorias" para criar, editar ou excluir categorias personalizadas.',
        quickReplies: [
          { text: 'Criar categoria', action: 'criar-categoria' },
          { text: 'Categorias padrão', action: 'categorias-padrao' }
        ]
      };
    }
    
    if (lowerInput.includes('dashboard') || lowerInput.includes('relatório')) {
      return {
        text: 'O dashboard mostra resumos, gráficos e análises dos seus dados financeiros. Use os filtros para visualizar períodos específicos.',
        quickReplies: [
          { text: 'Exportar dados', action: 'exportar' },
          { text: 'Filtros temporais', action: 'filtros' }
        ]
      };
    }
    
    if (lowerInput.includes('exportar') || lowerInput.includes('excel')) {
      return {
        text: 'Para exportar relatórios, use o botão "📊 Exportar para Excel" no dashboard. Escolha o período e baixe o arquivo!',
        quickReplies: [
          { text: 'Formatos disponíveis', action: 'formatos-exportacao' },
          { text: 'Dados incluídos', action: 'dados-exportacao' }
        ]
      };
    }
    
    if (lowerInput.includes('assinatura') || lowerInput.includes('plano') || lowerInput.includes('pago')) {
      return {
        text: 'Acesse seu perfil para gerenciar sua assinatura. Temos trial gratuito e planos pagos com suporte prioritário!',
        quickReplies: [
          { text: 'Fazer upgrade', action: 'upgrade' },
          { text: 'Cancelar assinatura', action: 'cancelar' }
        ]
      };
    }
    
    if (lowerInput.includes('problema') || lowerInput.includes('erro') || lowerInput.includes('bug')) {
      return {
        text: 'Se você está enfrentando problemas técnicos, tente atualizar a página ou limpar o cache. Se persistir, entre em contato conosco.',
        quickReplies: [
          { text: 'Contato suporte', action: 'contato' },
          { text: 'Reportar bug', action: 'reportar-bug' }
        ]
      };
    }
    
    // Resposta padrão
    return {
      text: 'Desculpe, não entendi sua pergunta. Pode reformular ou escolher uma das opções abaixo?',
      quickReplies: [
        { text: 'Como adicionar receita?', action: 'como-adicionar-receita' },
        { text: 'Como adicionar despesa?', action: 'como-adicionar-despesa' },
        { text: 'Como usar categorias?', action: 'categorias' },
        { text: 'Como usar o dashboard?', action: 'dashboard' }
      ]
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (!res.ok) throw new Error('Erro ao enviar');

      const confirmationMessage: Message = {
        id: Date.now().toString(),
        text: '✅ Sua mensagem foi enviada com sucesso! Entraremos em contato em breve.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmationMessage]);
      hideContactForm();

    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '❌ Erro ao enviar mensagem. Tente novamente ou envie diretamente para: suporte@gestaodegastos.com',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactFormChange = (field: keyof ContactForm, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showContactFormMessage = () => {
    const contactMessage: Message = {
      id: Date.now().toString(),
      text: 'Preencha o formulário abaixo para entrar em contato conosco:',
      sender: 'bot',
      timestamp: new Date(),
      type: 'contact-form'
    };
    
    setMessages(prev => [...prev, contactMessage]);
    setShowContactForm(true);
  };

  const hideContactForm = () => {
    // Remove a última mensagem se for do tipo contact-form
    setMessages(prev => prev.filter(msg => msg.type !== 'contact-form'));
    setShowContactForm(false);
    
    // Resetar formulário
    setContactForm({
      name: user?.name || '',
      email: user?.email || '',
      subject: '',
      message: ''
    });
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50"
        aria-label="Abrir chat de suporte"
      >
        {isOpen ? (
          <span className="text-lg sm:text-xl">✕</span>
        ) : (
          <span className="text-lg sm:text-xl">💬</span>
        )}
      </button>

      {/* Modal do Chat */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md h-96 sm:h-96 flex flex-col">
            {/* Header */}
            <div className="bg-cyan-500 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h3 className="font-semibold">Suporte</h3>
                    <p className="text-sm opacity-90">Como posso ajudar?</p>
                    <p className="text-xs opacity-75">Powered by Gestão de Gastos</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    
                    {/* Quick Replies */}
                    {message.type === 'quick-reply' && (
                      <div className="mt-3 space-y-2">
                        {Object.entries(FAQ_DATA).slice(0, 4).map(([key, faq]) => (
                          <button
                            key={key}
                            onClick={() => handleQuickReply(key)}
                            className="block w-full text-left text-xs bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                          >
                            {faq.question}
                          </button>
                        ))}
                        
                        {/* Botão de contato manual */}
                        <button
                          onClick={showContactFormMessage}
                          className="block w-full text-left text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-200 px-3 py-2 rounded border border-cyan-300 dark:border-cyan-700 hover:bg-cyan-200 dark:hover:bg-cyan-800 transition-colors"
                        >
                          📧 Falar com suporte humano
                        </button>
                      </div>
                    )}
                    
                    {/* Links */}
                    {message.type === 'link' && (
                      <div className="mt-3">
                        <a
                          href="mailto:suporte@gestaodegastos.com"
                          className="text-cyan-500 hover:text-cyan-600 underline text-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          suporte@gestaodegastos.com
                        </a>
                      </div>
                    )}
                    
                    {/* Formulário de Contato */}
                    {message.type === 'contact-form' && (
                      <div className="mt-4">
                        <form onSubmit={handleContactFormSubmit} className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nome *
                            </label>
                            <input
                              type="text"
                              value={contactForm.name}
                              onChange={(e) => handleContactFormChange('name', e.target.value)}
                              required
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="Seu nome completo"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              value={contactForm.email}
                              onChange={(e) => handleContactFormChange('email', e.target.value)}
                              required
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="seu@email.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Assunto *
                            </label>
                            <input
                              type="text"
                              value={contactForm.subject}
                              onChange={(e) => handleContactFormChange('subject', e.target.value)}
                              required
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="Resumo da sua dúvida"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Mensagem *
                            </label>
                            <textarea
                              value={contactForm.message}
                              onChange={(e) => handleContactFormChange('message', e.target.value)}
                              required
                              rows={3}
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                              placeholder="Descreva sua dúvida ou problema em detalhes..."
                            />
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex-1 px-3 py-2 text-xs"
                            >
                              {isSubmitting ? (
                                <LoadingSpinner size="sm" text="Enviando..." />
                              ) : (
                                '📧 Enviar Mensagem'
                              )}
                            </Button>
                            
                            <button
                              type="button"
                              onClick={hideContactForm}
                              className="px-3 py-2 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="px-4 py-2"
                >
                  {isTyping ? (
                    <LoadingSpinner size="sm" text="" />
                  ) : (
                    'Enviar'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 