import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  bordered?: boolean;
  id?: string;
  key?: React.Key | null | undefined;
}

export default function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  bordered = true,
  id,
}: CardProps) {
  const baseCardStyles = `
    rounded-[24px] transition-all duration-300 overflow-hidden
    bg-[var(--glass-bg)] backdrop-blur-[20px]
    text-[var(--text-primary)]
    ${bordered ? 'border border-[var(--glass-border)]' : ''}
    ${onClick || hoverable ? 'hover:-translate-y-1 hover:shadow-[0_8px_30px_var(--glass-bg)] cursor-pointer hover:border-[#ffffff33] active:scale-[0.98]' : ''}
    ${className}
  `;

  return (
    <div id={id} className={baseCardStyles} onClick={onClick}>
      {children}
    </div>
  );
}
