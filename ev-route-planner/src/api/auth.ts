type TokenResponse = {
  access_token: string;
  token_type: string;
};

const API_BASE_URL = (
  (import.meta as any).env?.VITE_API_BASE_URL ?? (import.meta as any).env?.['VITE_API_BASE_URL']
)
  ? String((import.meta as any).env.VITE_API_BASE_URL).replace(/\/+$/, '')
  : window.location.origin;

export async function register(email: string, password: string, vehicleId: string): Promise<TokenResponse> {
  const resp = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, vehicle_id: vehicleId })
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const resp = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}
