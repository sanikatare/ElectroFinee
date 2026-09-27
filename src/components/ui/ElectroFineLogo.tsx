import React from 'react';
import { clsx } from 'clsx';

export interface ElectroFineLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

/**
 * Classic 3-arrow folded-ribbon Möbius recycling logo on a soft sage-green badge,
 * matching the uploaded reference image.
 */
export const ElectroFineLogo: React.FC<ElectroFineLogoProps> = ({
  size = 'md',
  showText = true,
  textClassName = 'text-white'
}) => {
  const dimensions = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl'
  }[size];

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }[size];

  const RecycleArm = ({ rotation }: { rotation: number }) => (
    <g transform={`rotate(${rotation} 50 50)`}>
      <path
        d="M 23 35 L 34 16 C 36.5 11.5 40.5 9.5 43.5 10 L 49.5 20.5 L 43 28 L 35 42 Z"
        fill="#117A37"
      />
      <path
        d="M 46.5 10 C 50 10.5 53.5 13 56 17.5 L 61 26 L 67.5 22.2 L 61.5 41.5 L 42.5 36.8 L 49 33 L 44.5 25 Z"
        fill="#15883E"
      />
    </g>
  );

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className={`${dimensions} bg-[#B5D99C] border border-white/40 shadow-xs flex items-center justify-center shrink-0 overflow-hidden`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-[86%] h-[86%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="ElectroFine Recycling Logo"
        >
          <RecycleArm rotation={0} />
          <RecycleArm rotation={120} />
          <RecycleArm rotation={240} />
        </svg>
      </span>
      {showText && (
        <span className={`${textSizes} font-extrabold tracking-tight ${textClassName}`}>
          ElectroFine
        </span>
      )}
    </span>
  );
};

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
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses = {
    primary: 'bg-[#009150] text-white hover:bg-[#007540] hover:shadow-subtle focus:ring-[#009150]',
    secondary:
      'bg-juris-bgMuted text-[#009150] hover:bg-juris-border/60 border border-juris-border focus:ring-[#009150]',
    outline:
      'bg-transparent text-juris-textPrimary border border-juris-border hover:bg-juris-bgMuted hover:border-[#009150] focus:ring-[#009150]',
    ghost:
      'bg-transparent text-juris-textMuted hover:text-[#009150] hover:bg-juris-bgMuted focus:ring-[#009150]',
    dark: 'bg-[#007540] text-white hover:bg-[#005C32] border border-white/20 focus:ring-white',
    danger: 'bg-juris-riskHigh text-white hover:bg-red-700 focus:ring-red-600'
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
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

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-7'
  };

  return (
    <div
      className={clsx(
        'bg-white border border-juris-border rounded-lg text-juris-textPrimary transition-all duration-150',
        hover && 'hover:border-juris-borderDark hover:shadow-subtle cursor-pointer',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="w-full relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-juris-textSubtle pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-white text-juris-textPrimary placeholder:text-juris-textSubtle border border-juris-border rounded-md py-2 text-sm transition-all duration-150 focus:outline-none focus:border-[#009150] focus:ring-1 focus:ring-[#009150]',
            icon ? 'pl-9 pr-3' : 'px-3',
            error && 'border-juris-riskHigh focus:border-juris-riskHigh focus:ring-juris-riskHigh',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-juris-riskHigh">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
