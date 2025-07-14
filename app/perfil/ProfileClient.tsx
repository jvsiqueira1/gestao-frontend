"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import AssinaturaAnualButton from "../../components/AssinaturaAnualButton";
import ColorThemeSelector from "../../components/ColorThemeSelector";
import Link from "next/link";

export default function ProfileClient() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Detectar retorno do checkout e atualizar usuário
  useEffect(() => {
    const success = searchParams?.get("success");
    // Só execute se user existir, status for 'active' e success=true
    if (success === "true" && user && user.subscription_status === "active") {
      localStorage.setItem("stripeSuccessMsg", "Assinatura reativada com sucesso!");
      router.replace("/perfil");
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
    setCancelling(true);
    try {
      let res;
      
      if (user.plan === 'anual') {
        // Cancelamento de plano anual (pagamento único)
        res = await fetch("http://localhost:4000/api/stripe/cancel-annual", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Cancelamento de assinatura mensal (recorrente)
        res = await fetch("http://localhost:4000/api/stripe/cancel-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.premium_until) {
          const expirationDate = new Date(data.premium_until).toLocaleDateString("pt-BR");
          const planType = user.plan === 'anual' ? 'anual' : 'mensal';
          setSuccessMessage(`${data.message || `Assinatura ${planType} cancelada com sucesso!`} Você ainda tem acesso premium até ${expirationDate}.`);
        } else {
          setSuccessMessage("Assinatura cancelada com sucesso!");
        }
        // Recarregar dados do usuário
        await refreshUser();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erro ao cancelar assinatura");
      }
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      alert("Erro ao cancelar assinatura");
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
        window.location.href = url;
      } else if (sessionId) {
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
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando perfil..." />
      </div>
    );
  }

  const isTrialExpired = user.subscription_status === "trialing" && new Date(user.trial_end) < new Date();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Perfil</h1>
        {successMessage && user.subscription_status === "active" && (
          <div className="mb-4 p-3 rounded bg-green-100 text-green-800 text-center font-medium">
            {successMessage}
          </div>
        )}
        {user.subscription_status === "past_due" && (
          <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 text-center font-medium">
            Para acessar todas as funcionalidades do sistema, é necessário regularizar sua assinatura.
          </div>
        )}
        {user.subscription_status === "canceled" && user.plan === "anual" && user.premium_until && (
          <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800 text-center font-medium">
            Sua assinatura anual foi cancelada, mas você ainda tem acesso premium até <strong>{formatDate(user.premium_until)}</strong>. 
            Após essa data, será necessário renovar para continuar usando todas as funcionalidades.
          </div>
        )}
        {user.subscription_status === "canceled" && user.plan === "mensal" && user.premium_until && (
          <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800 text-center font-medium">
            Sua assinatura mensal foi cancelada, mas você ainda tem acesso premium até <strong>{formatDate(user.premium_until)}</strong>. 
            Após essa data, será necessário renovar para continuar usando todas as funcionalidades.
          </div>
        )}
        {user.subscription_status === "canceled" && user.plan !== "anual" && user.plan !== "mensal" && (
          <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 text-center font-medium">
            Para acessar todas as funcionalidades do sistema, é necessário regularizar sua assinatura.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Usuário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground">{user.name}</h2>
                  <p className="text-muted-foreground">{user.email} • Membro desde {formatDate(user.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-foreground">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.subscription_status)}`}>
                    {getStatusLabel(user.subscription_status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Plano</label>
                  <p className="text-foreground capitalize">{user.plan || "Gratuito"}</p>
                </div>
                {user.trial_end && user.subscription_status === "trialing" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Trial termina em
                    </label>
                    <p className={`${isTrialExpired ? "text-red-600" : "text-foreground"}`}>
                      {formatDate(user.trial_end)}
                    </p>
                  </div>
                )}
                {user.premium_until && user.subscription_status === "canceled" && user.plan === "anual" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Acesso premium até
                    </label>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {formatDate(user.premium_until)}
                    </p>
                  </div>
                )}
                {user.premium_until && user.subscription_status === "canceled" && user.plan === "mensal" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Acesso premium até
                    </label>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {formatDate(user.premium_until)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ações</h3>
              <div className="space-y-3">
                <div className="max-w-3xl mx-auto mt-8">
                  {user.subscription_status !== "active" && (
                    <h2 className="text-2xl font-bold text-center mb-6">Escolha seu plano</h2>
                  )}
                  {user.subscription_status !== "active" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Plano Mensal */}
                      <div className="bg-card text-card-foreground border-border rounded-lg shadow p-6 flex flex-col items-center border-2 border-cyan-500 h-full">
                        <h3 className="text-xl font-semibold mb-2">Mensal</h3>
                        <div className="text-3xl font-bold text-cyan-600 mb-2">R$19,90</div>
                        <div className="text-muted-foreground mb-4">por mês</div>
                        <ul className="mb-6 text-sm text-muted-foreground space-y-1 flex-grow">
                          <li>✔️ Acesso total ao sistema</li>
                          <li>✔️ Suporte prioritário</li>
                          <li>✔️ Cancelamento a qualquer momento</li>
                        </ul>
                        <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
                          {upgrading ? "Redirecionando..." : "Assinar Mensal"}
                        </Button>
                      </div>
                      {/* Plano Anual */}
                      <div className="bg-card text-card-foreground border-border rounded-lg shadow p-6 flex flex-col items-center border-4 border-yellow-500 h-full">
                        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                          Anual
                          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">Economize 37%</span>
                        </h3>
                        <div className="text-3xl font-bold text-yellow-600 mb-2">R$150,00</div>
                        <div className="text-muted-foreground mb-1">por ano</div>
                        <ul className="mb-6 text-sm text-muted-foreground space-y-1 flex-grow">
                          <li>✔️ Todos os benefícios do mensal</li>
                          <li>✔️ Economia de <b>R$89,80</b> ao ano</li>
                          <li>✔️ Pagamento único, sem surpresas</li>
                        </ul>
                        <AssinaturaAnualButton />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 text-center">
                      <div className="text-green-700 font-semibold mb-2">Sua assinatura está ativa!</div>
                      <div className="text-muted-foreground text-sm mb-4">Plano: {user.plan || 'Premium'}</div>
                      {user.premium_until && (
                        <div className="text-muted-foreground text-sm mb-4">
                          Acesso premium até: {formatDate(user.premium_until)}
                        </div>
                      )}
                      <Button 
                        onClick={() => {
                          if (confirm("Tem certeza que deseja cancelar sua assinatura?")) {
                            handleCancelSubscription();
                          }
                        }} 
                        disabled={cancelling} 
                        variant="secondary"
                        className="mt-4"
                      >
                        {cancelling ? "Cancelando..." : "Cancelar Assinatura"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Sidebar de Benefícios */}
          <div className="space-y-6">
            <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-card-foreground mb-4">Benefícios do Plano Pago</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Dashboard completo</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Categorização de despesas</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Relatórios detalhados</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Exportação de dados</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Suporte prioritário</li>
              </ul>
            </div>
            {/* Personalização de Cores */}
            <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-card-foreground mb-2">Personalizar Cores do App</h3>
              <p className="text-muted-foreground mb-4">Escolha as cores que mais combinam com seu estilo. As mudanças são aplicadas instantaneamente.</p>
              <ColorThemeSelector />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 