import React, { useEffect, useState } from 'react';
import { getCurrentUser, getProfile, logoutUser } from '../../lib/auth';
import { User } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingState from '../ui/LoadingState';

interface UserProfileProps {
  onNavigate: (path: string) => void;
}

export default function UserProfile({ onNavigate }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      let cached = getProfile();
      if (cached && cached.email) {
        setUser(cached);
      }
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to load user profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    logoutUser();
    onNavigate('/login');
  };

  if (loading) {
    return <LoadingState message="Loading Profile..." />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-[var(--text-secondary)]">Please login to view your profile.</p>
        <Button onClick={() => onNavigate('/login')}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black heading-font text-[var(--text-primary)]">Student Profile</h1>
        <p className="text-[var(--text-secondary)] text-sm">Manage your personal information and preferences.</p>
      </div>

      <Card className="p-8 space-y-8">
        <div className="flex items-center gap-6 pb-8 border-b border-[var(--glass-border)]">
          <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg shadow-[var(--accent-primary)]/20">
            {(user.fullname || user.name || user.email || '?')[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {user.fullname || user.name || 'User'}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-[var(--glass-border)]">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">Role</label>
            <p className="text-[var(--text-primary)] font-medium mt-1 uppercase text-sm">{user.role}</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-[var(--text-secondary)]">Language</label>
            <p className="text-[var(--text-primary)] font-medium mt-1 uppercase text-sm">
              {user.language === 'bn' ? 'Bengali' : 'English'}
            </p>
          </div>
        </div>

        <div className="flex justify-start">
          <Button variant="danger" onClick={handleLogout}>Log Out</Button>
        </div>
      </Card>
    </div>
  );
}
