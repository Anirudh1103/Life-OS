import { cn } from '@/utils/classNames';

interface ToggleProps {
  checked: boolean;
  onCheckedChange: () => void;
  label: string;
}

export function Toggle({ checked, onCheckedChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onCheckedChange}
      className={cn(
        'inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-800',
        checked ? 'border-slate-400 bg-slate-200 dark:bg-slate-700' : '',
      )}
    >
      <span className="h-5 w-5 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs">{checked ? '🌙' : '☀️'}</span>
      <span>{label}</span>
    </button>
  );
}
