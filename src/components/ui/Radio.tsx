interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Radio({ label, className, ...props }: RadioProps) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 ${className ?? ''}`}>
      <input type="radio" className="h-4 w-4 accent-slate-900" {...props} />
      <span>{label}</span>
    </label>
  );
}
