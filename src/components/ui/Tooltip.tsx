import type { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="pointer-events-none absolute -bottom-9 left-1/2 z-10 hidden -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-950 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
        {content}
      </div>
    </div>
  );
}
