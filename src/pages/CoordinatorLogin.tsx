import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onAuthChange?: () => void; // called after successful login (even if not a coordinator)
}

export default function CoordinatorLogin({ onAuthChange }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      console.error('Coordinator sign-in error:', error);
      setError('Unable to sign in. Check your email and password and try again.');
      return;
    }

    // Notify parent to re-check coordinator status
    onAuthChange?.();
  };

  return (
    <div className="min-h-screen bg-slate-25 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-md w-full">
        <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">Coordinator sign-in</h2>
        <p className="text-sm text-slate-500 mb-6">Sign in with your coordinator account to access the dashboard.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              placeholder="you@organization.org"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
