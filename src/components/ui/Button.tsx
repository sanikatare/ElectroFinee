import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses = {
    primary: 'bg-[#009150] text-white hover:bg-[#007540] hover:shadow-subtle focus:ring-[#009150]',
    secondary: 'bg-juris-bgMuted text-[#009150] hover:bg-juris-border/60 border border-juris-border focus:ring-[#009150]',
    outline: 'bg-transparent text-juris-textPrimary border border-juris-border hover:bg-juris-bgMuted hover:border-[#009150] focus:ring-[#009150]',
    ghost: 'bg-transparent text-juris-textMuted hover:text-[#009150] hover:bg-juris-bgMuted focus:ring-[#009150]',
    dark: 'bg-[#007540] text-white hover:bg-[#005C32] border border-white/20 focus:ring-white',
    danger: 'bg-juris-riskHigh text-white hover:bg-red-700 focus:ring-red-600',
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
