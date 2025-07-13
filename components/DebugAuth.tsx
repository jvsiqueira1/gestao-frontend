"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl, API_ENDPOINTS } from '../lib/api';

export default function DebugAuth() {
  const { user, token } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      hasUser: !!user,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
      apiUrl: apiUrl(API_ENDPOINTS.AUTH.ME),
      localStorageToken: typeof window !== 'undefined' ? localStorage.getItem('token') : 'SSR',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
    console.log('🔍 Debug Auth Info:', info);
  }, [user, token]);

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔍 Auth Debug</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
} 