interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-950">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
