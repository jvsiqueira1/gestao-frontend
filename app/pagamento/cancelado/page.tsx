'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function PagamentoCancelado() {
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pagamento Cancelado
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            O pagamento foi cancelado. Nenhum valor foi cobrado.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
              O que acontece agora?
            </h3>
            <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <li>• Nenhum valor foi cobrado da sua conta</li>
              <li>• Você continua com acesso gratuito</li>
              <li>• Pode tentar novamente quando quiser</li>
            </ul>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Redirecionando em {countdown} segundos...</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/perfil')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Voltar ao Perfil
            </button>
            
            <button
              onClick={() => router.push('/perfil')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 