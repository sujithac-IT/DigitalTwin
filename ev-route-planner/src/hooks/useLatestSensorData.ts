import { useEffect, useRef, useState } from 'react';
import { fetchLatest, type SensorData } from '../api/sensors';

export function useLatestSensorData(pollMs = 1000) {
  const [data, setData] = useState<SensorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;

    const getOnce = async () => {
      try {
        setError(null);
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const d = await fetchLatest();
        if (!mounted) return;
        setData(d);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to fetch');
        setLoading(false);
      }
    };

    getOnce();
    timerRef.current = window.setInterval(getOnce, pollMs);

    return () => {
      mounted = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, [pollMs]);

  return { data, error, loading };
}
