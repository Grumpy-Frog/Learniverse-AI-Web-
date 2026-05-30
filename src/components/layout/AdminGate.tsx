import React, { useEffect, useState } from 'react';
import { getProfile, isAuthenticated, getCurrentUser } from '../../lib/auth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingState from '../ui/LoadingState';
import { Key } from 'lucide-react';

interface AdminGateProps {
  children: React.ReactNode;
  onRedirect: (path: string) => void;
}

export default function AdminGate({ children, onRedirect }: AdminGateProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    if (!isAuthenticated()) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    // First fast path UI
    let profile = getProfile();
    if (profile?.role === 'admin') {
      setIsAdmin(true);
    }
    
    try {
      const user = await getCurrentUser();
      if (user) {
        setIsAdmin(user.role === 'admin');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Verifying permissions..." />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center select-none">
        <Card className="p-8 border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-4">
          <span className="p-3 bg-[var(--glass-bg)] rounded-full text-[var(--accent-primary)] mx-auto block w-fit border border-[var(--glass-border)]">
            <Key className="h-6 w-6 text-[var(--danger)]" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[var(--text-primary)] heading-font">
              EDUCATOR PERMISSION ONLY
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
              The requested directory contains administrative controls restricted to teachers and administrators.
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
