import { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(error.message);
  };

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email first, then click "Forgot password".');
      return;
    }
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) setError(error.message);
    else setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Building2 className="w-9 h-9 text-blue-600" />
          <div>
            <div className="text-gray-900 text-xl">Builder CRM</div>
            <div className="text-xs text-gray-500">Lead-to-Possession Management</div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {resetSent && <p className="text-sm text-green-700">Password reset link sent. Check your inbox.</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
          <button type="button" onClick={handleReset} className="w-full text-sm text-blue-600 hover:underline">
            Forgot password?
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">© {new Date().getFullYear()} GENXA</p>
      </div>
    </div>
  );
}
