interface TabItem {
  label: string;
  value: string;
}

interface TabsProps {
  value: string;
  items: TabItem[];
  onChange: (value: string) => void;
}

export function Tabs({ value, items, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[2rem] border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`rounded-[1.5rem] px-4 py-2 text-sm font-semibold transition ${
            item.value === value ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
