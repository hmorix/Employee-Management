import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { HMorixLogo } from '../components/HMorixLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-obsidian hm-grid-bg flex items-center justify-center px-4 py-12">
      <div className="hm-card max-w-md w-full p-7 sm:p-9 space-y-6">
        <HMorixLogo subtitle="EMPLOYEE & TL LOGIN" />
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Sign in to Team Workspace</h1>
          <p className="text-sm text-cream/60 mt-1">Use your HMorix login credentials provided during onboarding.</p>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cream/60 mb-1">Work Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="hm-input" placeholder="you@hmorix.in" />
          </div>
          <div>
            <label className="block text-xs font-mono text-cream/60 mb-1">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="hm-input" />
          </div>
          <button type="submit" disabled={loading} className="hm-btn-primary w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Sign In to Workspace
          </button>
        </form>
        <div className="pt-4 border-t border-cream/10 text-xs text-center text-cream/50">
          Credentials sent via onboarding email from <span className="text-lime">support@hmorix.in</span>.
          <br />For HR issues visit <a href={import.meta.env.VITE_HRM_PORTAL_URL || 'https://hrm.hmorix.in'} className="text-lime hover:underline">hrm.hmorix.in</a>
        </div>
      </div>
    </div>
  );
}
