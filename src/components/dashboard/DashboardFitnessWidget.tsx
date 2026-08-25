import React from 'react';
import { type FitnessActivity, type RoutineItem } from '../../services/supabase';
import { Flame, Dumbbell, Activity, Waves, Timer, Footprints, Sparkles, CheckCircle2, Circle, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardFitnessWidgetProps {
  todayActivity: FitnessActivity | null;
  todayPlanned: RoutineItem | null;
  isLoading: boolean;
}

export const DashboardFitnessWidget: React.FC<DashboardFitnessWidgetProps> = ({
  todayActivity,
  todayPlanned,
  isLoading
}) => {
  const navigate = useNavigate();

  const getAccentStyles = (slug?: string) => {
    switch (slug) {
      case 'strength_training':
        return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/15' };
      case 'badminton':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' };
      case 'swimming':
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/15' };
      case 'running':
        return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/15' };
      case 'walking':
        return { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/15' };
      case 'yoga':
        return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/15' };
      default:
        return { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/15' };
    }
  };

  const getIcon = (slug?: string) => {
    switch (slug) {
      case 'strength_training': return Dumbbell;
      case 'badminton': return Activity;
      case 'swimming': return Waves;
      case 'running': return Timer;
      case 'walking': return Footprints;
      case 'yoga': return Sparkles;
      default: return Activity;
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-5 rounded-2xl border border-border/10 space-y-3 animate-pulse text-xs select-none">
        <div className="h-4 bg-surface-hover/50 rounded w-1/3" />
        <div className="h-10 bg-surface-hover/30 rounded-xl" />
      </div>
    );
  }

  const isCompleted = todayActivity !== null;
  const targetItem = todayActivity || todayPlanned;
  const style = targetItem ? getAccentStyles(targetItem.activity_type?.slug) : null;
  const Icon = targetItem ? getIcon(targetItem.activity_type?.slug) : null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-border/10 space-y-4 text-xs select-none shadow-sm shadow-accent/5">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] uppercase font-black text-text-secondary/70 tracking-widest">Today's Fitness</h3>
        <button
          onClick={() => navigate('/fitness')}
          className="text-[9px] font-black text-accent uppercase tracking-wider hover:underline outline-none"
        >
          Open Planner
        </button>
      </div>

      {targetItem ? (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${style?.bg} ${style?.border}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0`}>
              {Icon && <Icon className={`h-5 w-5 ${style?.text}`} />}
            </div>
            
            <div className="min-w-0">
              <p className="text-xs font-black text-text-primary truncate">
                {isCompleted 
                  ? (todayActivity.notes ? todayActivity.notes.split('\n')[0] : todayActivity.activity_type?.name)
                  : (todayPlanned?.title || todayPlanned?.activity_type?.name)}
              </p>
              
              <div className="flex items-center gap-2 text-[9px] font-bold text-text-secondary/50 mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {isCompleted ? todayActivity.duration_minutes : todayPlanned?.duration_minutes} min
                </span>
                {isCompleted && todayActivity.calories && (
                  <span className="flex items-center gap-0.5">
                    <Flame className="h-3 w-3" />
                    {todayActivity.calories} kcal
                  </span>
                )}
                {!isCompleted && <span className="text-orange-400">Planned Workout</span>}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <div className="flex items-center gap-1 text-emerald-400 font-extrabold uppercase text-[9px] tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Done</span>
              </div>
            ) : (
              <button
                onClick={() => navigate('/fitness')}
                className="flex items-center gap-1 text-accent font-extrabold uppercase text-[9px] tracking-wider bg-accent/15 border border-accent/25 px-2 py-1 rounded-lg hover:bg-accent hover:text-white transition-all outline-none"
              >
                <Circle className="h-3.5 w-3.5" />
                <span>Log Session</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border/20 rounded-xl p-4.5 text-center text-text-secondary/50 font-bold flex flex-col items-center justify-center gap-2">
          <span>No fitness plans scheduled for today.</span>
          <button
            onClick={() => navigate('/fitness')}
            className="flex items-center gap-1 text-[9px] font-black bg-accent hover:bg-accent-hover text-white px-2.5 py-1 rounded-lg transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Activity</span>
          </button>
        </div>
      )}
    </div>
  );
};
