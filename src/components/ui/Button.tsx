import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: (e: any) => void;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  id,
  type = 'button',
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    if (disabled || isLoading) {
      return 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)] opacity-40 cursor-not-allowed';
    }

    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-transparent hover:-translate-y-0.5';
      case 'secondary':
        return 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] backdrop-blur-[20px] shadow-sm hover:-translate-y-0.5';
      case 'danger':
        return 'bg-gradient-to-r from-[var(--danger)] to-[#e11d48] text-white shadow-[0_8px_30px_rgba(225,29,72,0.15)] border border-transparent hover:-translate-y-0.5';
      case 'success':
        return 'bg-gradient-to-r from-[var(--success)] to-[#059669] text-white shadow-[0_8px_30px_rgba(5,150,105,0.15)] border border-transparent hover:-translate-y-0.5';
      case 'ghost':
        return 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] border border-transparent hover:text-[var(--text-primary)]';
      default:
        return 'bg-[var(--glass-bg)] text-[var(--text-primary)] border border-transparent hover:bg-[var(--bg-surface)]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] min-h-[36px] rounded-xl';
      case 'lg':
        return 'px-8 py-4 text-[16px] font-black min-h-[60px] rounded-2xl';
      default:
        return 'px-6 py-3 text-[12px] font-black uppercase tracking-wider min-h-[48px] rounded-2xl';
    }
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-500 select-none active:scale-95 border focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-hidden ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
