interface ErrorStateProps {
  title: string;
  description: string;
}

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
      <p className="text-sm uppercase tracking-[0.3em]">{title}</p>
      <p className="mt-4 text-sm leading-7">{description}</p>
    </div>
  );
}
