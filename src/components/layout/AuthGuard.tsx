import React from 'react';
import { isAuthenticated } from '../../lib/auth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ShieldAlert } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  onRedirect: (path: string) => void;
}

export default function AuthGuard({ children, onRedirect }: AuthGuardProps) {
  const logged = isAuthenticated();

  if (!logged) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center select-none">
        <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <span className="p-3 bg-rose-500/10 rounded-full text-rose-550 mx-auto block w-fit border border-rose-500/15">
            <ShieldAlert className="h-6 w-6 text-rose-550" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white heading-font">
              AUTHENTICATION REQUIRED
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
              Please log in to your Learniverse AI student or educator account to browse dynamic simulations and trigger diagnostic quizzes of your syllabus.
            </p>
          </div>
          <Button size="md" className="w-full justify-center" onClick={() => onRedirect('/login')}>
            Go to Login Desk
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
