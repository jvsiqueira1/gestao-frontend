import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  console.log('=== FRONTEND API ESQUECI-SENHA ===');
  console.log('BACKEND_URL configurada:', !!BACKEND_URL);
  console.log('BACKEND_URL valor:', BACKEND_URL);
  
  if (!BACKEND_URL) {
    console.error('❌ NEXT_PUBLIC_API_URL não configurada');
    return res.status(500).json({ 
      error: 'URL do backend não configurada.',
      details: 'Configure a variável de ambiente NEXT_PUBLIC_API_URL na Vercel'
    });
  }
  
  try {
    console.log('📤 Enviando requisição para:', `${BACKEND_URL}/auth/esqueci-senha`);
    console.log('📦 Dados enviados:', req.body);
    
    const response = await fetch(`${BACKEND_URL}/auth/esqueci-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    
    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📥 Resposta bruta:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    
    console.log('📤 Enviando resposta para o cliente:', data);
    res.status(response.status).json(data);
  } catch (err) {
    console.error('❌ Erro na requisição:', err);
    const errorMessage = (err instanceof Error) ? err.message : String(err);
    res.status(500).json({ 
      error: 'Erro ao conectar ao backend.', 
      details: errorMessage,
      backendUrl: BACKEND_URL
    });
  }
} 