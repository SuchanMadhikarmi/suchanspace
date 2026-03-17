import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        setMessage('Account created. Check email for verification if required, then sign in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 className="font-serif" style={{ margin: 0, fontSize: 34, color: 'var(--green)' }}>SuchanSpace</h1>
          <p style={{ marginTop: 8, marginBottom: 0, color: 'var(--muted)', fontSize: 14 }}>
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            style={{ width: '100%', padding: '11px 12px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--white)', color: 'var(--text)' }}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
            style={{ width: '100%', padding: '11px 12px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--white)', color: 'var(--text)' }}
          />

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>
          )}
          {message && (
            <div style={{ color: 'var(--sage)', fontSize: 13 }}>{message}</div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setError(null);
            setMessage(null);
            setMode(prev => (prev === 'signin' ? 'signup' : 'signin'));
          }}
          style={{ marginTop: 12, width: '100%' }}
        >
          {mode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
}
