import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService, type Task } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckSquare, Circle, CheckCircle2, GitCommit, 
  ChevronRight, Loader2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardTasksWidgetProps {
  personalTasks: Task[];
  workTasks: Task[];
  personalCount: number;
  workCount: number;
  isLoading: boolean;
  onTaskChange: () => void;
}

export const DashboardTasksWidget: React.FC<DashboardTasksWidgetProps> = ({
  personalTasks,
  workTasks,
  personalCount,
  workCount,
  isLoading,
  onTaskChange
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleToggleComplete = async (task: Task) => {
    if (!user) return;
    const targetState = !task.is_completed;
    
    try {
      await dbService.updateTask(user.id, task.id, { is_completed: targetState });
      if (targetState) {
        confetti({ particleCount: 40, spread: 30, origin: { y: 0.8 } });
      }
      onTaskChange();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const renderTaskRow = (task: Task) => {
    const hasFlow = !!task.flow;
    const flowProgress = task.flow && task.flow.stages
      ? Math.round((task.flow.stages.filter(s => s.is_completed).length / task.flow.stages.length) * 100)
      : 0;
    const currentStage = task.flow?.stages?.find(s => s.id === task.flow?.current_stage_id);

    return (
      <div 
        key={task.id}
        className="flex items-start gap-2.5 py-2 px-2.5 rounded-xl hover:bg-surface-hover/20 transition-all group"
      >
        <button
          onClick={() => handleToggleComplete(task)}
          className="mt-0.5 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
        >
          {task.is_completed ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Circle className="h-4 w-4 text-text-secondary/40 hover:text-accent" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold text-text-primary truncate ${task.is_completed ? 'line-through text-text-secondary/50' : ''}`}>
            {task.title}
          </p>
          
          {/* Flow Indicator */}
          {hasFlow && currentStage && !task.is_completed && (
            <div className="mt-1 space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-accent">
                <span className="flex items-center gap-0.5">
                  <GitCommit className="h-2.5 w-2.5" />
                  <span>{currentStage.name}</span>
                </span>
                <span>{flowProgress}%</span>
              </div>
              <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${flowProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4 select-none animate-scale-in">
      
      {/* Title block */}
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <CheckSquare className="h-4 w-4 text-accent" />
          <span>Today's Tasks</span>
        </h3>
        
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-0.5 text-[10px] text-accent hover:text-accent-hover font-bold uppercase transition-all"
        >
          <span>View Tasks</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-text-secondary gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Syncing lists</span>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Stats Split Overview */}
          <div className="grid grid-cols-2 gap-3 py-2 px-3 bg-surface/20 border border-border/10 rounded-xl text-center text-[10px] font-extrabold uppercase">
            <div className="border-r border-border/15">
              <span className="text-text-secondary">🏠 Personal:</span>
              <span className="text-warning ml-1">{personalCount} open</span>
            </div>
            <div>
              <span className="text-text-secondary">💼 Work:</span>
              <span className="text-indigo-400 ml-1">{workCount} open</span>
            </div>
          </div>

          {/* PERSONAL PREVIEW */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-warning uppercase tracking-wider flex items-center gap-1.5 border-b border-warning/10 pb-1">
              <span>Personal Tasks</span>
            </h4>
            
            {personalTasks.length === 0 ? (
              <p className="text-[10px] text-text-secondary/30 py-1 px-2.5 font-medium italic">No personal tasks for today</p>
            ) : (
              <div className="space-y-1">
                {personalTasks.map(renderTaskRow)}
              </div>
            )}
          </div>

          {/* WORK PREVIEW */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-500/10 pb-1">
              <span>Work Tasks</span>
            </h4>
            
            {workTasks.length === 0 ? (
              <p className="text-[10px] text-text-secondary/30 py-1 px-2.5 font-medium italic">No work tasks for today</p>
            ) : (
              <div className="space-y-1">
                {workTasks.map(renderTaskRow)}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
