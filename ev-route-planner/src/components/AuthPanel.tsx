import React, { useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export function AuthPanel() {
  const { isAuthenticated, setToken, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = mode === 'login' ? await apiLogin(email, password) : await apiRegister(email, password, vehicleId);
      setToken(resp.access_token);
    } catch (err: any) {
      setError(err?.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <section className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Logged in</div>
          <button onClick={logout}>Logout</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setMode('login')}
          disabled={mode === 'login'}
        >Login</button>
        <button
          onClick={() => setMode('register')}
          disabled={mode === 'register'}
        >Register</button>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Vehicle ID"
            value={vehicleId}
            onChange={e => setVehicleId(e.target.value)}
            required
          />
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </section>
  );
}
