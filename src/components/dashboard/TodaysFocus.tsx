import React, { useState } from 'react';
import { CheckCircle2, Circle, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface FocusTopic {
  id: string;
  title: string;
  is_completed: boolean;
  category_name?: string;
}

interface TodaysFocusProps {
  topics: FocusTopic[];
  onToggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const TodaysFocus: React.FC<TodaysFocusProps> = ({
  topics,
  onToggleComplete,
  isLoading = false,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (topic: FocusTopic) => {
    setTogglingId(topic.id);
    const newStatus = !topic.is_completed;
    
    try {
      await onToggleComplete(topic.id, topic.is_completed);
      if (newStatus) {
        // Run confetti on complete!
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#6366F1', '#8B5CF6', '#10B981'],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-5 rounded-2xl animate-pulse">
        <div className="h-4 w-32 bg-surface-hover rounded mb-5" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 py-1">
              <div className="h-4 w-4 bg-surface-hover rounded-full" />
              <div className="h-3 w-40 bg-surface-hover rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl select-none">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
        Today's Focus
      </h3>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-text-secondary/60">
          <GraduationCap className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-xs font-medium">All caught up!</p>
          <p className="text-[10px] opacity-70 mt-0.5">Add or activate topics in Learning to focus on today.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {topics.map(topic => {
            const isToggling = togglingId === topic.id;
            return (
              <div
                key={topic.id}
                onClick={() => !isToggling && handleToggle(topic)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-border/20 hover:bg-surface-hover/30 transition-all duration-200 cursor-pointer ${
                  topic.is_completed ? 'opacity-50' : ''
                }`}
              >
                <div className="shrink-0 text-text-secondary hover:text-accent transition-colors">
                  {topic.is_completed ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-success animate-fade-in" />
                  ) : (
                    <Circle className={`h-4.5 w-4.5 ${isToggling ? 'animate-pulse text-accent' : ''}`} />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold tracking-wide truncate ${
                    topic.is_completed ? 'line-through text-text-secondary' : 'text-text-primary'
                  }`}>
                    {topic.title}
                  </p>
                  {topic.category_name && (
                    <span className="text-[9px] uppercase font-bold tracking-wider text-accent/80 block mt-0.5">
                      {topic.category_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
