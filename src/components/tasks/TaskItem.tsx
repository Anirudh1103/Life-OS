import React from 'react';
import { dbService, type Task } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Circle, CheckCircle2, Star, Calendar, 
  Paperclip, ListChecks, GitCommit, AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onTaskUpdated: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  isSelected, 
  onSelect, 
  onTaskUpdated 
}) => {
  const { user } = useAuth();

  const handleToggleCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const targetState = !task.is_completed;
    
    try {
      await dbService.updateTask(user.id, task.id, { is_completed: targetState });
      
      // Confetti burst if completed!
      if (targetState) {
        confetti({ particleCount: 50, spread: 40, origin: { y: 0.8 } });
      }

      onTaskUpdated();
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleToggleImportant = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await dbService.updateTask(user.id, task.id, { is_important: !task.is_important });
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to toggle importance:', err);
    }
  };

  // Due date rendering calculations
  const renderDueDate = () => {
    if (!task.due_at) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_at);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0 && !task.is_completed) {
      // Overdue
      const formatted = new Date(task.due_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
      return (
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-danger bg-danger/10 border border-danger/25 px-2 py-0.5 rounded-lg select-none uppercase">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>Overdue · {formatted}</span>
        </span>
      );
    }

    let text = '';
    if (diffDays === 0) text = 'Today';
    else if (diffDays === 1) text = 'Tomorrow';
    else {
      text = new Date(task.due_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary/70 bg-surface border border-border/10 px-2 py-0.5 rounded-lg select-none">
        <Calendar className="h-3 w-3 shrink-0 text-text-secondary/50" />
        <span>{text}</span>
      </span>
    );
  };

  const renderPriorityBadge = () => {
    if (task.priority === 'none') return null;
    
    let colorClass = '';
    switch (task.priority) {
      case 'high': 
        colorClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'; 
        break;
      case 'medium': 
        colorClass = 'text-warning bg-warning/10 border-warning/20'; 
        break;
      case 'low': 
        colorClass = 'text-success bg-success/10 border-success/20'; 
        break;
    }

    return (
      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border select-none tracking-wider ${colorClass}`}>
        {task.priority}
      </span>
    );
  };

  // Flow details calculation
  const hasFlow = !!task.flow;
  const flowProgress = task.flow && task.flow.stages
    ? Math.round((task.flow.stages.filter(s => s.is_completed).length / task.flow.stages.length) * 100)
    : 0;
  
  const currentStage = task.flow?.stages?.find(s => s.id === task.flow?.current_stage_id);

  return (
    <div
      onClick={onSelect}
      className={`py-3 px-2 flex items-start justify-between gap-4 cursor-pointer select-none transition-all duration-200 border-b border-border/10 hover:bg-surface/20 ${
        isSelected 
          ? 'bg-surface/20 border-l-2 border-accent pl-3' 
          : ''
      } ${task.is_completed ? 'opacity-50' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggleCompleted}
        className="mt-1 focus:outline-none text-text-secondary hover:text-text-primary transition-all duration-200"
      >
        {task.is_completed ? (
          <CheckCircle2 className="h-4.5 w-4.5 text-success" />
        ) : (
          <Circle className="h-4.5 w-4.5 text-text-secondary/40 hover:text-accent" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="space-y-0.5">
          <h4 className={`text-xs font-bold text-text-primary truncate ${task.is_completed ? 'line-through text-text-secondary/55' : ''}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[10px] text-text-secondary/60 font-semibold truncate">
              {task.description}
            </p>
          )}
        </div>

        {/* Tags, workspace, priority row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${task.workspace === 'work' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'}`}>
            {task.workspace === 'work' ? '💼 Work' : '🏠 Personal'}
          </span>
          
          {renderPriorityBadge()}
          {renderDueDate()}

          {/* Subtasks step count pill */}
          {task.steps_count !== undefined && task.steps_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary/70 bg-surface border border-border/10 px-2 py-0.5 rounded-lg">
              <ListChecks className="h-3.5 w-3.5 text-text-secondary/45" />
              <span>{task.completed_steps_count} / {task.steps_count} steps</span>
            </span>
          )}

          {/* Files count pill */}
          {task.files_count !== undefined && task.files_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary/70 bg-surface border border-border/10 px-2 py-0.5 rounded-lg">
              <Paperclip className="h-3 w-3 text-text-secondary/45" />
              <span>{task.files_count} file{task.files_count > 1 ? 's' : ''}</span>
            </span>
          )}

          {/* Dynamic Flow stage indicator */}
          {hasFlow && currentStage && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-lg animate-fade-in">
              <GitCommit className="h-3.5 w-3.5 text-accent/80 shrink-0" />
              <span>Flow: {currentStage.name} ({flowProgress}%)</span>
            </span>
          )}

          {/* Custom text tags rendering */}
          {task.tags && task.tags.map(tag => (
            <span key={tag} className="text-[9px] font-bold text-text-secondary/50 hover:text-text-secondary select-none transition-colors">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right controls: Assignee & Star */}
      <div className="flex items-center gap-3 shrink-0 select-none">
        <div className="h-5.5 w-5.5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[9px] font-black shadow-sm uppercase">
          {user?.email?.charAt(0) || 'A'}
        </div>

        <button
          onClick={handleToggleImportant}
          className="focus:outline-none"
        >
          <Star 
            className={`h-4.5 w-4.5 transition-colors ${
              task.is_important 
                ? 'text-warning fill-warning' 
                : 'text-text-secondary/30 hover:text-warning'
            }`} 
          />
        </button>
      </div>
    </div>
  );
};
