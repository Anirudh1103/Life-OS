import { cn } from '@/utils/classNames';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft transition dark:border-slate-800 dark:bg-slate-900', className)} {...props}>
      {children}
    </div>
  );
}
