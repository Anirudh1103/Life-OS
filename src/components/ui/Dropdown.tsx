interface DropdownProps {
  label: string;
  items: { label: string; action: () => void }[];
}

export function Dropdown({ label, items }: DropdownProps) {
  return (
    <div className="group relative inline-block">
      <button type="button" className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
        {label}
      </button>
      <div className="invisible absolute right-0 z-10 mt-2 w-56 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg opacity-0 transition group-hover:visible group-hover:opacity-100 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
