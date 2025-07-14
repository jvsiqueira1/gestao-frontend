import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  if (!BACKEND_URL) {
    return res.status(500).json({ error: 'URL do backend não configurada.' });
  }
  try {
    const response = await fetch(`${BACKEND_URL}/auth/esqueci-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    res.status(response.status).json(data);
  } catch (err) {
    const errorMessage = (err instanceof Error) ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao conectar ao backend.', details: errorMessage });
  }
} 