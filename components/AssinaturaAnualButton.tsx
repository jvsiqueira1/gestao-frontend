import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function AssinaturaAnualButton() {
  const { token } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckoutAnual = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/stripe/checkout-annual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          success_url: window.location.origin + "/pagamento/sucesso",
          cancel_url: window.location.origin + "/pagamento/cancelado",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Erro ao redirecionar para o pagamento.");
      }
    } catch (e) {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckoutAnual}
        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded w-full md:w-auto"
        disabled={loading}
      >
        {loading ? "Redirecionando..." : "Assinatura Anual (R$150,00/ano)"}
      </button>
      {error && <div className="mt-2 text-red-600 text-sm text-center">{error}</div>}
    </div>
  );
} 