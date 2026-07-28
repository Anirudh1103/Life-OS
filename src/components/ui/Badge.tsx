import { cn } from '@/utils/classNames';

import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'secondary';
  children: ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const styles = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
    secondary: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', styles[variant])}>{children}</span>;
}
