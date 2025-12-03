import { useEffect, useState } from 'react';

export type HistoricalDataPoint = {
  timestamp: string;
  voltage: number;
  current: number;
  temperature: number;
  latitude: number;
  longitude: number;
};

// Base URL is taken from env; falls back to current origin without trailing slash
const API_BASE_URL = (
  (import.meta as any).env?.VITE_API_BASE_URL ?? (import.meta as any).env?.['VITE_API_BASE_URL']
)
  ? String((import.meta as any).env.VITE_API_BASE_URL).replace(/\/+$/, '')
  : window.location.origin;

export async function fetchHistory(limit: number = 100): Promise<HistoricalDataPoint[]> {
  const resp = await fetch(`${API_BASE_URL}/history?limit=${limit}`, { method: 'GET' });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const result = await resp.json();
  
  if (result.status === 'success' && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

export function useHistoricalData(limit: number = 100) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        setError(null);
        const history = await fetchHistory(limit);
        if (!mounted) return;
        setData(history);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to fetch history');
        setLoading(false);
      }
    };

    loadHistory();
    
    // Refresh history every 5 minutes
    const interval = setInterval(loadHistory, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [limit]);

  return { data, error, loading };
}
