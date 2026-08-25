import React from 'react';

interface ProgressItem {
  name: string;
  progress: number; // 0 to 100
  isImplemented: boolean;
  details?: string;
}

interface ProgressCardProps {
  items: ProgressItem[];
  isLoading?: boolean;
}

const getProgressBarColor = (name: string) => {
  switch (name.toLowerCase()) {
    case 'learning':
      return 'from-orange-500 to-amber-500';
    case 'fitness':
      return 'from-emerald-500 to-teal-500';
    case 'tasks':
      return 'from-sky-500 to-indigo-500';
    case 'journal':
      return 'from-pink-500 to-rose-500';
    case 'finance':
      return 'from-indigo-500 to-violet-600';
    default:
      return 'from-indigo-500 to-violet-600';
  }
};

export const ProgressCard: React.FC<ProgressCardProps> = ({ items, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-5 rounded-2xl animate-pulse">
        <div className="h-4 w-36 bg-surface-hover rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-surface-hover rounded" />
                <div className="h-3 w-8 bg-surface-hover rounded" />
              </div>
              <div className="h-2 w-full bg-surface-hover rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl select-none">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-5">
        Today's Progress
      </h3>
      
      <div className="space-y-4.5">
        {items.map(item => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-text-primary">{item.name}</span>
              <span className="text-[10px] font-bold text-text-secondary">
                {item.isImplemented ? `${Math.round(item.progress)}%` : 'Coming soon'}
              </span>
            </div>
            
            {item.isImplemented ? (
              <div className="w-full h-2 bg-surface/50 border border-border/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getProgressBarColor(item.name)} rounded-full transition-all duration-500`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            ) : (
              <div className="w-full h-2 bg-surface-hover/10 border border-border/5 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
              </div>
            )}
            
            {item.details && item.isImplemented && (
              <p className="text-[10px] text-text-secondary/70 font-medium">
                {item.details}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
