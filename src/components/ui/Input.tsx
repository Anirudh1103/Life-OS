import type { ElementType, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ElementType;
}

export function Input({ label, error, icon: Icon, className, ...props }: InputProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <div className="relative rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner transition focus-within:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
        {Icon ? <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /> : null}
        <input
          className={cn(
            'w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100',
            Icon ? 'pl-10' : 'pl-4',
          )}
          {...props}
        />
      </div>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}
