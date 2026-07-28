import { cn } from '@/utils/classNames';

import type { ReactNode } from 'react';

interface TableRow {
  id: string;
  cells: Array<ReactNode>;
}

interface TableProps {
  columns: string[];
  rows: TableRow[];
  loading?: boolean;
}

export function Table({ columns, rows, loading }: TableProps) {
  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Loading data...</div>;
  }

  if (rows.length === 0) {
    return <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">No records found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-6 py-4 font-medium uppercase tracking-[0.15em]">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={cn('border-t border-slate-200 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900')}>
              {row.cells.map((cell, index) => (
                <td key={index} className="px-6 py-4 align-top text-slate-700 dark:text-slate-200">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
