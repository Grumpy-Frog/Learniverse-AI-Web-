import React, { useState } from 'react';
import { api } from '../../lib/api';
import { saveSession } from '../../lib/auth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import StatusMessage from '../ui/StatusMessage';
import { Sparkles, UserPlus } from 'lucide-react';

interface RegisterBlockProps {
  onNavigate: (path: string) => void;
}

export default function RegisterBlock({ onNavigate }: RegisterBlockProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Submit Registration criteria
      await api.register(name.trim(), email.trim(), password);

      // 2. Automatically authenticate upon successful registration
      const loginRes = await api.login(email.trim(), password);

      // 3. Save active token to client
      saveSession(loginRes.access_token);

      // 4. Collect me profile details
      const profile = await api.getMe();

      // 5. Update session storage with full profile
      saveSession(loginRes.access_token, profile);

      // 5. Direct navigation
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. That e-mail format or credential combination may be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 select-none">
      <Card className="p-6 md:p-8 border-slate-205 dark:border-slate-850 bg-white dark:bg-slate-900 space-y-6 shadow-xl rounded-2xl relative overflow-hidden">
        
        {/* Banner */}
        <div className="text-center space-y-1 pb-2">
          <span className="p-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl inline-block shadow-md">
            <UserPlus className="h-5 w-5 animate-pulse" />
          </span>
          <h2 className="text-2xl font-black text-slate-905 dark:text-white mt-3 heading-font tracking-tight">
            Register for Learniverse
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Create an academic student or course creator profile.
          </p>
        </div>

        {errorMsg && (
          <StatusMessage type="error" message={errorMsg} />
        )}

        {/* Inputs forms */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <Input
            label="Your Full Real Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-xl border-slate-200 text-xs"
          />

          <Input
            label="Academic Email Address"
            type="email"
            placeholder="johndoe@academia.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-slate-200 text-xs"
          />

          <Input
            label="Secure Password (Min 6 Characters)"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl border-slate-200 text-xs"
          />

          {/* Role selector dropdown field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Academy Role Class
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'student' | 'admin')}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-medium focus:border-indigo-501"
            >
              <option value="student">Student Learner (Standard Access)</option>
              <option value="admin">Educator / Curriculum Creator (Admin Admin)</option>
            </select>
          </div>

          <Button type="submit" isLoading={loading} className="w-full justify-center rounded-xl p-3 text-xs font-bold leading-none mt-2">
            Complete Registration
          </Button>

        </form>

        {/* Direct login */}
        <div className="text-center border-t border-slate-105 dark:border-slate-800 pt-5 text-xs font-semibold select-text">
          <span className="text-slate-500 dark:text-slate-400">Already registered on the platform? </span>
          <button
            onClick={() => onNavigate('/login')}
            className="text-blue-500 font-extrabold hover:underline"
          >
            Sign-In Here
          </button>
        </div>

      </Card>
    </div>
  );
}
