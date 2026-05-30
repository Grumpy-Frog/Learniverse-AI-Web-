import React from 'react';
import { getProfile, isAuthenticated } from '../../lib/auth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Key } from 'lucide-react';

interface AdminGateProps {
  children: React.ReactNode;
  onRedirect: (path: string) => void;
}

export default function AdminGate({ children, onRedirect }: AdminGateProps) {
  const logged = isAuthenticated();
  const profile = getProfile();
  const isAdmin = logged && profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center select-none">
        <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <span className="p-3 bg-indigo-500/10 rounded-full text-indigo-500 mx-auto block w-fit border border-indigo-500/15">
            <Key className="h-6 w-6 text-indigo-505" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800 dark:text-white heading-font">
              EDUCATOR PERMISSION GRANTED ONLY
            </h3>
            <p className="text-xs text-slate-505 dark:text-slate-450 leading-relaxed font-semibold">
              The requested directory contains administrative curriculum builders and chunk vector embedders restricted to teachers and administrators.
            </p>
          </div>
          <Button size="md" className="w-full justify-center" onClick={() => onRedirect('/dashboard')}>
            Return to Student Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
