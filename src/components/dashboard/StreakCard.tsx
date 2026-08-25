import React from 'react';

interface StreakCardProps {
  icon: string;
  title: string;
  current: number;
  best: number;
  unit?: string;
  isLoading?: boolean;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  icon,
  title,
  current,
  best,
  unit = 'days',
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-5 rounded-2xl animate-pulse">
        <div className="h-6 w-6 rounded-lg bg-surface-hover mb-3" />
        <div className="h-4 w-28 bg-surface-hover rounded mb-4" />
        <div className="h-8 w-16 bg-surface-hover rounded mb-2" />
        <div className="h-3 w-20 bg-surface-hover rounded" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl select-none">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
        {title}
      </h3>
      
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-text-primary">
          {current}
        </span>
        <span className="text-xs text-text-secondary font-medium">
          {unit}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-border/10 flex justify-between items-center text-[10px] font-semibold text-text-secondary/70">
        <span>Personal Best</span>
        <span className="text-text-primary">{best} {unit}</span>
      </div>
    </div>
  );
};
