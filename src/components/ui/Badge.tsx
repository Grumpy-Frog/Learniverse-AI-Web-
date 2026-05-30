import React from 'react';

export type BadgeVariant = 
  | 'completed' 
  | 'needs_practice' 
  | 'not_started' 
  | 'admin' 
  | 'student' 
  | 'rag_on' 
  | 'rag_off' 
  | 'published' 
  | 'draft' 
  | 'source_grounded' 
  | 'refusal' 
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  id?: string;
}

export default function Badge({ variant = 'default', children, id }: BadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case 'completed':
        return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40';
      case 'needs_practice':
        return 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40';
      case 'not_started':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:border-slate-700';
      case 'admin':
        return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 dark:border-indigo-800/40';
      case 'student':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:border-slate-700';
      case 'rag_on':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 dark:border-blue-800/40';
      case 'rag_off':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 dark:border-slate-700';
      case 'published':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 dark:border-emerald-800/40';
      case 'draft':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 dark:border-slate-700';
      case 'source_grounded':
        return 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 dark:border-teal-800/40';
      case 'refusal':
        return 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 dark:border-rose-800/40';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent transition-all duration-200 ${getStyles()}`}
    >
      {children}
    </span>
  );
}
