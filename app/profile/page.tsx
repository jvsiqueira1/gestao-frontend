"use client";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useRouter, useSearchParams } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  subscription_status: string;
  plan: string;
  trial_end: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Debug: log user e searchParams
  useEffect(() => {
    console.log("[ProfilePage] user:", user);
    console.log("[ProfilePage] searchParams.get('success'):", searchParams.get("success"));
  }, [user, searchParams]);

  // Detectar retorno do checkout e atualizar usuário
  useEffect(() => {
    const success = searchParams.get("success");
    // Só execute se user existir, status for 'active' e success=true
    if (success === "true" && user && user.subscription_status === "active") {
      localStorage.setItem("stripeSuccessMsg", "Assinatura reativada com sucesso!");
      router.replace("/profile");
    }
  }, [searchParams, user, router]);

  // Exibir mensagem de sucesso se existir no localStorage
  useEffect(() => {
    const msg = localStorage.getItem("stripeSuccessMsg");
    if (msg) {
      setSuccessMessage(msg);
      localStorage.removeItem("stripeSuccessMsg");
    }
  }, []);

  const handleCancelSubscription = async () => {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) return;
    
    setCancelling(true);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.STRIPE.CANCEL_SUBSCRIPTION), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await refreshUser();
        setSuccessMessage("Assinatura cancelada com sucesso.");
      } else {
        alert("Erro ao cancelar assinatura. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      alert("Erro ao cancelar assinatura. Tente novamente.");
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch(apiUrl(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erro ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      
      const { sessionId, url } = data;
      if (url) {
        // Redirecionar para o checkout do Stripe usando a URL fornecida
        window.location.href = url;
      } else if (sessionId) {
        // Fallback: usar sessionId se URL não estiver disponível
        window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
      } else {
        alert("Erro: URL ou SessionId não encontrados na resposta");
      }
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao processar pagamento: ${errorMessage}`);
    } finally {
      setUpgrading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "trialing":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "trialing":
        return "Período de Teste";
      case "canceled":
        return "Cancelado";
      case "past_due":
        return "Pagamento Pendente";
      default:
        return "Desconhecido";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!user) {
    console.log("[ProfilePage] user está null ou undefined, exibindo loading...");
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando perfil..." />
      </div>
    );
  }

  const isTrialExpired = user.subscription_status === "trialing" && new Date(user.trial_end) < new Date();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Carregando perfil..." /></div>}>
      <div className="bg-gray-50 dark-gradient-bg p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Perfil</h1>
          {successMessage && (
            <div className="mb-4 p-3 rounded bg-green-100 text-green-800 text-center font-medium">
              {successMessage}
            </div>
          )}
          {['canceled', 'past_due'].includes(user.subscription_status) && (
            <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 text-center font-medium">
              Para acessar todas as funcionalidades do sistema, é necessário regularizar sua assinatura.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações do Usuário */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card Principal */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{user.email} • Membro desde {formatDate(user.created_at)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                    <p className="text-gray-900 dark:text-white">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <p className="text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.subscription_status)}`}>
                      {getStatusLabel(user.subscription_status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plano</label>
                    <p className="text-gray-900 dark:text-white capitalize">{user.plan || "Gratuito"}</p>
                  </div>
                  {user.trial_end && user.subscription_status === "trialing" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Trial termina em
                      </label>
                      <p className={`${isTrialExpired ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                        {formatDate(user.trial_end)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações</h3>
                <div className="space-y-3">
                  {user.subscription_status === "trialing" && !isTrialExpired && (
                    <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
                      {upgrading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" text="" />
                          Processando...
                        </div>
                      ) : (
                        "Fazer Upgrade para Plano Pago"
                      )}
                    </Button>
                  )}
                  {user.subscription_status === "active" && (
                    <Button 
                      onClick={handleCancelSubscription} 
                      variant="secondary"
                      disabled={cancelling}
                      className="w-full"
                    >
                      {cancelling ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" text="" />
                          Cancelando...
                        </div>
                      ) : (
                        "Cancelar Assinatura"
                      )}
                    </Button>
                  )}
                  {isTrialExpired && (
                    <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
                      {upgrading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" text="" />
                          Processando...
                        </div>
                      ) : (
                        "Reativar Assinatura"
                      )}
                    </Button>
                  )}
                  {(user.subscription_status === "canceled" || user.subscription_status === "past_due") && (
                    <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
                      {upgrading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" text="" />
                          Processando...
                        </div>
                      ) : (
                        "Reativar Assinatura"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status da Assinatura */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status da Assinatura</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.subscription_status)}`}>
                      {getStatusLabel(user.subscription_status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Plano:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {user.plan || "Gratuito"}
                    </span>
                  </div>
                  {user.trial_end && user.subscription_status === "trialing" && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Trial:</span>
                      <span className={`text-sm font-medium ${isTrialExpired ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                        {isTrialExpired ? "Expirado" : "Ativo"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Benefícios */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Benefícios</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Dashboard completo
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Categorização de despesas
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Relatórios detalhados
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Exportação de dados
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Suporte prioritário
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
} 