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
    rounded-2xl transition-all duration-300 overflow-hidden
    bg-white dark:bg-slate-900 
    text-slate-900 dark:text-slate-50
    ${bordered ? 'border border-slate-200 dark:border-slate-800' : ''}
    ${onClick || hoverable ? 'hover:shadow-md cursor-pointer hover:border-slate-300 dark:hover:border-slate-700/80 active:scale-[0.99]' : ''}
    ${className}
  `;

  return (
    <div id={id} className={baseCardStyles} onClick={onClick}>
      {children}
    </div>
  );
}
