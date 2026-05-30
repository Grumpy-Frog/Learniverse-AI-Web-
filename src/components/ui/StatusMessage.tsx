import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface StatusMessageProps {
  type?: StatusType;
  title?: string;
  message: string | React.ReactNode;
  onRetry?: () => void;
  className?: string;
  id?: string;
}

export default function StatusMessage({
  type = 'info',
  title,
  message,
  onRetry,
  className = '',
  id,
}: StatusMessageProps) {
  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/25',
          border: 'border-emerald-200 dark:border-emerald-900/30',
          text: 'text-emerald-800 dark:text-emerald-400',
          icon: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/25',
          border: 'border-rose-200 dark:border-rose-900/30',
          text: 'text-rose-800 dark:text-rose-400',
          icon: <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/25',
          border: 'border-amber-200 dark:border-amber-900/30',
          text: 'text-amber-800 dark:text-amber-400',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
        };
      case 'loading':
        return {
          bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
          border: 'border-indigo-100 dark:border-indigo-900/10',
          text: 'text-indigo-800 dark:text-indigo-400',
          icon: <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 animate-spin" />,
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/25',
          border: 'border-blue-200 dark:border-blue-900/30',
          text: 'text-blue-800 dark:text-blue-400',
          icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />,
        };
    }
  };

  const style = getColors();

  return (
    <div
      id={id}
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm transition-all duration-300 ${style.bg} ${style.border} ${style.text} ${className}`}
    >
      <div className="mt-0.5">{style.icon}</div>
      <div className="flex-1 flex flex-col gap-0.5">
        {title && <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{title}</span>}
        <div className="leading-relaxed font-normal">{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80 flex items-center gap-1 cursor-pointer w-fit"
          >
            <RefreshCw className="h-3 w-3" /> Retry Action
          </button>
        )}
      </div>
    </div>
  );
}
