import { cn } from '@/utils/classNames';

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

export function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <select className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}
