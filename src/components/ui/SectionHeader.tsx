interface SectionHeaderProps {
  title: string;
  description: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
