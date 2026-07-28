interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="space-y-2 pb-6">
      <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{title}</p>
      <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">{description}</h1>
    </div>
  );
}
