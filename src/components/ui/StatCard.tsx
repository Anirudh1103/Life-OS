import type { ElementType } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: ElementType;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft transition dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="rounded-3xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{label}</p>
      </div>
      <p className="mt-6 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
