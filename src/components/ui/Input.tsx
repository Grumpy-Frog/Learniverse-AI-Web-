import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: any;
  onChange?: (e: any) => void;
  disabled?: boolean;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  type = 'text',
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm transition-all duration-200 outline-hidden
          bg-[var(--bg-surface)] backdrop-blur-sm
          text-[var(--text-primary)]
          border-[var(--glass-border)]
          placeholder:text-[var(--text-secondary)]
          focus:border-[var(--accent-primary)]
          focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20
          ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] font-medium' : ''}
          ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-0.5">
          {error}
        </span>
      ) : helperText ? (
        <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
