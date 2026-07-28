import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/classNames';
import type { ElementType } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'danger';
  size?: 'xs' | 'sm' | 'md';
  icon?: ElementType;
  loading?: boolean;
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  icon: Icon,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:pointer-events-none disabled:opacity-60';
  const variants: Record<string, string> = {
    default: 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
  };
  const sizes: Record<string, string> = {
    xs: 'px-3 py-2 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
