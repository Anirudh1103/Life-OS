interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={`animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800 ${className ?? ''}`} {...props} />;
}
