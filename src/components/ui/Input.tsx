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
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all duration-200 outline-hidden
          bg-white dark:bg-slate-900 
          text-slate-900 dark:text-slate-50
          border-slate-200 dark:border-slate-800
          placeholder:text-slate-400 dark:placeholder:text-slate-600
          focus:border-blue-500/60 dark:focus:border-blue-400/60
          focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-400/5
          ${error ? 'border-rose-500 dark:border-rose-500/40 focus:border-rose-500 font-medium' : ''}
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
