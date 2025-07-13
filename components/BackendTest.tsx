"use client";
import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

export default function BackendTest() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('/auth/test'));
      const data = await response.json();
      setTestResult(data);
      console.log('✅ Backend test successful:', data);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Backend test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Testing auth with token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      const response = await fetch(apiUrl('/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult({ auth: 'success', user: data.user });
        console.log('✅ Auth test successful:', data);
      } else {
        const errorData = await response.json();
        setTestResult({ auth: 'failed', error: errorData });
        console.log('❌ Auth test failed:', errorData);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Auth test error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  return (
    <div className="fixed top-4 left-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 Backend Test</h3>
      <div className="space-y-2 mb-4">
        <button 
          onClick={testBackend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Backend'}
        </button>
        <button 
          onClick={testAuth}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Auth'}
        </button>
      </div>
      
      {error && (
        <div className="text-red-400 mb-2">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {testResult && (
        <div className="bg-gray-800 p-2 rounded text-xs">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 