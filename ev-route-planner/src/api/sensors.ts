export type SensorData = {
  voltage: number;
  current: number;
  temperature: number;
  latitude: number;
  longitude: number;
  soh?: number; // State of Health - calculated from historical data
};

// Base URL is taken from env; falls back to current origin without trailing slash
const API_BASE_URL = (
  (import.meta as any).env?.VITE_API_BASE_URL ?? (import.meta as any).env?.['VITE_API_BASE_URL']
)
  ? String((import.meta as any).env.VITE_API_BASE_URL).replace(/\/+$/, '')
  : window.location.origin;

export async function fetchLatest(): Promise<SensorData | null> {
  const resp = await fetch(`${API_BASE_URL}/latest`, { method: 'GET' });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const data = await resp.json();
  console.log('Fetched sensor data:', data);
  // Handle { status: "no data yet" }
  if (data && typeof data === 'object' && 'status' in data) return null;

  const required = ['voltage', 'current', 'temperature', 'latitude', 'longitude'] as const;
  for (const key of required) {
    if (!(key in data)) return null;
  }
  return data as SensorData;
}
