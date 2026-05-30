import React, { useState } from 'react';
import { api } from '../../lib/api';
import { saveSession } from '../../lib/auth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import StatusMessage from '../ui/StatusMessage';
import { LogIn, HelpCircle, Key, Mail } from 'lucide-react';

interface LoginBlockProps {
  onNavigate: (path: string) => void;
}

export default function LoginBlock({ onNavigate }: LoginBlockProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Authenticate with backend API v1
      const res = await api.login(email.trim(), password);
      
      // 2. Save active token to client
      saveSession(res.access_token);

      // 3. Fetch full profile to capture dynamic Name / Email / Role parameters
      const profile = await api.getMe();

      // 4. Update session storage with full profile
      saveSession(res.access_token, profile);

      // 4. Navigate based on role
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect email address or password combination.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 select-none">
      <Card className="p-6 md:p-8 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-6 shadow-xl rounded-2xl relative overflow-hidden">
        
        {/* Banner header decoration */}
        <div className="text-center space-y-1 pb-2">
          <span className="p-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl inline-block shadow-md">
            <LogIn className="h-5 w-5 animate-pulse" />
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3 heading-font tracking-tight">
            Login to Learniverse
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Resume your diagnostic tests, physics simulations, and AI tutorials.
          </p>
        </div>

        {errorMsg && (
          <StatusMessage type="error" message={errorMsg} />
        )}

        {/* Input Blocks form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <Input
            label="E-mail Address"
            type="email"
            placeholder="student@learniverse.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-slate-200 focus:border-indigo-500 text-xs"
          />

          <Input
            label="Secret Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl border-slate-200 focus:border-indigo-505 text-xs"
          />

          <Button type="submit" isLoading={loading} className="w-full justify-center rounded-xl p-3 text-xs font-bold leading-none mt-2">
            Authenticate Access
          </Button>

        </form>

        {/* Create accounts option */}
        <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-5 text-xs font-semibold select-text">
          <span className="text-slate-500 dark:text-slate-400">First time using the virtual classroom? </span>
          <button
            onClick={() => onNavigate('/register')}
            className="text-blue-500 font-black hover:underline hover:text-blue-600 transition"
          >
            Register Student Account
          </button>
        </div>

      </Card>
    </div>
  );
}
