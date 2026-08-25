import React, { useState, useEffect } from 'react';
import { dbService, type TaskStep } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface StepsWidgetProps {
  taskId: string;
  onStepsChange: () => void;
}

export const StepsWidget: React.FC<StepsWidgetProps> = ({ taskId, onStepsChange }) => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSteps();
  }, [taskId]);

  const loadSteps = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await dbService.getTaskSteps(user.id, taskId);
      setSteps(data);
    } catch (err) {
      console.error('Failed to load steps:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newStep = await dbService.createTaskStep({
        task_id: taskId,
        user_id: user.id,
        title: newTitle.trim(),
        sort_order: steps.length
      });
      setSteps(prev => [...prev, newStep]);
      setNewTitle('');
      onStepsChange();
    } catch (err) {
      console.error('Failed to create step:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStep = async (step: TaskStep) => {
    if (!user) return;
    const targetState = !step.is_completed;
    
    // Optimistic Update
    setSteps(prev => prev.map(s => s.id === step.id ? { ...s, is_completed: targetState } : s));

    try {
      await dbService.updateTaskStep(user.id, step.id, { is_completed: targetState });
      onStepsChange();
    } catch (err) {
      console.error('Failed to update step:', err);
      // Revert on error
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, is_completed: !targetState } : s));
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!user) return;
    
    // Optimistic Update
    setSteps(prev => prev.filter(s => s.id !== stepId));

    try {
      await dbService.deleteTaskStep(user.id, stepId);
      onStepsChange();
    } catch (err) {
      console.error('Failed to delete step:', err);
      loadSteps(); // Reload on error
    }
  };

  const completedCount = steps.filter(s => s.is_completed).length;
  const totalCount = steps.length;

  return (
    <div className="space-y-3.5 select-none">
      <div className="flex justify-between items-center text-xs font-bold text-text-secondary">
        <span className="uppercase tracking-wider">Subtasks / Steps</span>
        <span>{completedCount} / {totalCount} Completed</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-text-secondary justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span>Loading steps...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map(step => (
            <div 
              key={step.id} 
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/10 bg-surface/10 hover:bg-surface-hover/30 transition-all group"
            >
              <button
                onClick={() => handleToggleStep(step)}
                className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
              >
                {step.is_completed ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-success" />
                ) : (
                  <Circle className="h-4.5 w-4.5 text-text-secondary/50 hover:text-accent" />
                )}
              </button>

              <span className={`text-xs font-semibold text-left flex-1 truncate ${step.is_completed ? 'line-through text-text-secondary/50' : 'text-text-primary'}`}>
                {step.title}
              </span>

              <button
                onClick={() => handleDeleteStep(step.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-danger rounded hover:bg-surface transition-all focus:outline-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add Step Input */}
          <form onSubmit={handleAddStep} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Add a step..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-surface/20 hover:bg-surface/30 focus:bg-surface/40 border border-border/20 rounded-xl px-3.5 py-2 text-xs font-semibold text-text-primary placeholder:text-text-secondary/40 focus:border-accent/40 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || isSubmitting}
              className="p-2 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-white active:scale-95 transition-all outline-none"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
