import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export default function LoadingState({
  message = 'Loading content...',
  size = 'md',
  fullPage = false,
}: LoadingStateProps) {
  const getLoaderSize = () => {
    switch (size) {
      case 'sm':
        return 'h-5 w-5';
      case 'lg':
        return 'h-10 w-10';
      default:
        return 'h-8 w-8';
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3.5 text-center p-8">
      <Loader2 className={`${getLoaderSize()} text-blue-600 dark:text-blue-400 animate-spin shrink-0`} />
      {message && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-50/80 dark:bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-50 transition-colors duration-300">
        {content}
      </div>
    );
  }

  return content;
}
