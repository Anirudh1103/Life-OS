import { cn } from '@/utils/classNames';

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Reusable Switch/Toggle component styled in a premium iOS-like design.
 * Fully keyboard and reader accessible using ARIA roles.
 */
export function Toggle({ checked, onCheckedChange, label, disabled = false }: ToggleProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-200',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950',
          checked ? 'bg-slate-950 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-800'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out dark:bg-slate-950',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}

