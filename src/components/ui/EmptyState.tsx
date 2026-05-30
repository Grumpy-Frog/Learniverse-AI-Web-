import React from 'react';
import { Database, Plus } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  title?: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = 'No records found',
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/30 transition-all duration-300">
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 dark:text-slate-600 mb-4 shrink-0">
        {icon || <Database className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-normal">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="inline-flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
