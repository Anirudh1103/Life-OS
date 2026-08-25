import React from 'react';
import { History, CheckSquare, PlusCircle, CheckCircle2, Bookmark } from 'lucide-react';
import { type LearningActivity } from '../../services/supabase';

interface RecentActivityProps {
  activities: LearningActivity[];
  isLoading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  isLoading = false,
}) => {
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffMs < 0 || diffSec < 30) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${diffDay}d ago`;
    } catch (e) {
      return 'Some time ago';
    }
  };

  const getActivityDetails = (act: LearningActivity) => {
    switch (act.activity_type) {
      case 'topic_completed':
        return {
          text: `Completed "${act.topic_title || 'a topic'}"`,
          icon: CheckCircle2,
          color: 'text-success bg-success/10 border-success/20',
        };
      case 'topic_created':
        return {
          text: `Added topic "${act.topic_title || 'a topic'}"`,
          icon: PlusCircle,
          color: 'text-accent bg-accent/10 border-accent/20',
        };
      case 'flashcard_created':
        return {
          text: `Created flashcard in "${act.topic_title || 'topic'}"`,
          icon: Bookmark,
          color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        };
      default:
        return {
          text: `Updated training records`,
          icon: CheckSquare,
          color: 'text-text-secondary bg-surface-hover/50 border-border/40',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-5 rounded-2xl animate-pulse">
        <div className="h-4 w-32 bg-surface-hover rounded mb-5" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-surface-hover shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-40 bg-surface-hover rounded" />
                <div className="h-2 w-12 bg-surface-hover rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl select-none">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-text-secondary/60">
          <History className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-xs font-medium">No recent activity</p>
          <p className="text-[10px] opacity-70 mt-0.5">Start learning and completing topics to see logs here.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {activities.map(act => {
            const details = getActivityDetails(act);
            const Icon = details.icon;
            
            return (
              <div key={act.id} className="flex items-start gap-3.5 group">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center border shrink-0 ${details.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="text-xs font-semibold text-text-primary leading-tight tracking-wide group-hover:text-accent transition-colors">
                    {details.text}
                  </p>
                  {act.category_name && (
                    <span className="text-[9px] font-bold text-text-secondary/60 uppercase tracking-wider mr-1.5">
                      {act.category_name}
                    </span>
                  )}
                  <span className="text-[10px] text-text-secondary font-medium mt-0.5 inline-block">
                    {formatRelativeTime(act.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
