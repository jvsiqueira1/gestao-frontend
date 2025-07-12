'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PagamentoSucesso() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // Efeito para redirecionamento automático
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/perfil');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  // Efeito para contador
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pagamento Realizado!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Seu acesso premium foi liberado com sucesso.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              O que acontece agora?
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Seu acesso premium está ativo</li>
              <li>• Todas as funcionalidades estão liberadas</li>
              <li>• Você pode começar a usar imediatamente</li>
            </ul>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Redirecionando em {countdown} segundos...</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          <button
            onClick={() => router.push('/perfil')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Ir para o Perfil
          </button>
        </div>
      </div>
    </div>
  );
} 