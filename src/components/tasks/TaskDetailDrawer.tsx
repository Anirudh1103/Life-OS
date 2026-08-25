import React, { useState, useEffect } from 'react';
import { dbService, type Task } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StepsWidget } from './StepsWidget';
import { FilesWidget } from './FilesWidget';
import { FlowTrackerWidget } from './FlowTrackerWidget';
import { 
  X, Calendar, Bell, RefreshCw, Star, Info, Sun,
  CheckCircle2, Circle, AlertCircle, Trash2, Tag, FileText
} from 'lucide-react';

interface TaskDetailDrawerProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({ 
  task, 
  onClose, 
  onTaskUpdated, 
  onTaskDeleted 
}) => {
  const { user } = useAuth();
  
  // Local editable fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [dueAt, setDueAt] = useState(task.due_at || '');
  const [reminderAt, setReminderAt] = useState(task.reminder_at || '');
  const [recurrence, setRecurrence] = useState(task.recurrence_rule || '');
  const [isInToday, setIsInToday] = useState(task.is_in_today);
  const [isImportant, setIsImportant] = useState(task.is_important);
  const [isCompleted, setIsCompleted] = useState(task.is_completed);
  
  // Tag input states
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [newTag, setNewTag] = useState('');

  // Update local states when selected task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setDueAt(task.due_at ? task.due_at.split('T')[0] : '');
    setReminderAt(task.reminder_at ? new Date(task.reminder_at).toISOString().slice(0, 16) : '');
    setRecurrence(task.recurrence_rule || '');
    setIsInToday(task.is_in_today);
    setIsImportant(task.is_important);
    setIsCompleted(task.is_completed);
    setTags(task.tags || []);
  }, [task]);

  const handleFieldBlur = async (fieldName: keyof Task, val: any) => {
    if (!user) return;
    try {
      await dbService.updateTask(user.id, task.id, { [fieldName]: val });
      onTaskUpdated();
    } catch (err) {
      console.error(`Failed to update ${String(fieldName)}:`, err);
    }
  };

  const handleToggleCompletion = async () => {
    if (!user) return;
    const nextState = !isCompleted;
    setIsCompleted(nextState); // Optimistic
    try {
      await dbService.updateTask(user.id, task.id, { is_completed: nextState });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      setIsCompleted(!nextState); // Revert
    }
  };

  const handleToggleImportance = async () => {
    if (!user) return;
    const nextState = !isImportant;
    setIsImportant(nextState); // Optimistic
    try {
      await dbService.updateTask(user.id, task.id, { is_important: nextState });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      setIsImportant(!nextState); // Revert
    }
  };

  const handleToggleToday = async () => {
    if (!user) return;
    const nextState = !isInToday;
    setIsInToday(nextState); // Optimistic
    try {
      await dbService.updateTask(user.id, task.id, { is_in_today: nextState });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      setIsInToday(!nextState); // Revert
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTag.trim()) return;
    const cleaned = newTag.trim().toLowerCase();
    if (tags.includes(cleaned)) {
      setNewTag('');
      return;
    }
    const updatedTags = [...tags, cleaned];
    setTags(updatedTags);
    setNewTag('');
    try {
      await dbService.updateTask(user.id, task.id, { tags: updatedTags });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!user) return;
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);
    try {
      await dbService.updateTask(user.id, task.id, { tags: updatedTags });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    if (!user) return;
    try {
      await dbService.deleteTask(user.id, task.id);
      onTaskDeleted();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper date presets
  const setDueDatePreset = (preset: 'today' | 'tomorrow' | 'weekend' | 'nextWeek' | 'clear') => {
    let dateStr = '';
    const today = new Date();
    if (preset === 'today') {
      dateStr = today.toISOString().split('T')[0];
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      dateStr = tomorrow.toISOString().split('T')[0];
    } else if (preset === 'weekend') {
      const weekend = new Date(today);
      weekend.setDate(today.getDate() + (6 - today.getDay())); // Upcoming Saturday
      dateStr = weekend.toISOString().split('T')[0];
    } else if (preset === 'nextWeek') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      dateStr = nextWeek.toISOString().split('T')[0];
    }
    setDueAt(dateStr);
    handleFieldBlur('due_at', dateStr || null);
  };

  // Overdue check
  const isOverdue = dueAt && new Date(dueAt) < new Date(new Date().setHours(0, 0, 0, 0)) && !isCompleted;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] xl:w-[450px] bg-slate-950/80 backdrop-blur-xl border-l border-border/30 shadow-2xl flex flex-col animate-slide-in select-none">
      
      {/* Header bar */}
      <div className="p-4 border-b border-border/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.workspace === 'work' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            {task.workspace}
          </span>
          {isOverdue && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded uppercase">
              <AlertCircle className="h-3 w-3" />
              <span>Overdue</span>
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-all focus:outline-none"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Drawer Body Scroll */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Main Task Title row */}
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggleCompletion}
            className="mt-1 focus:outline-none text-text-secondary hover:text-text-primary transition-colors"
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5.5 w-5.5 text-success" />
            ) : (
              <Circle className="h-5.5 w-5.5 text-text-secondary/50 hover:text-accent" />
            )}
          </button>
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleFieldBlur('title', title.trim())}
            placeholder="Task title"
            className={`flex-1 bg-transparent border-0 text-base font-extrabold tracking-tight text-text-primary placeholder:text-text-secondary/30 focus:ring-0 focus:outline-none ${isCompleted ? 'line-through text-text-secondary/60' : ''}`}
          />

          <button
            onClick={handleToggleImportance}
            className="mt-1 focus:outline-none"
          >
            <Star className={`h-4.5 w-4.5 transition-colors ${isImportant ? 'text-warning fill-warning' : 'text-text-secondary/40 hover:text-warning'}`} />
          </button>
        </div>

        {/* Notes (Description) Field */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
            <FileText className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">Description & Notes</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleFieldBlur('description', description.trim() || null)}
            placeholder="Add detailed task notes..."
            rows={4}
            className="w-full bg-surface/20 hover:bg-surface/30 focus:bg-surface/40 border border-border/20 rounded-xl p-3 text-xs font-semibold text-text-primary placeholder:text-text-secondary/30 focus:border-accent/40 focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Task Settings Parameters grid */}
        <div className="space-y-4 bg-surface/5 p-4 rounded-2xl border border-border/10">
          
          {/* Add to Today switcher */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-border/10">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-warning" />
              <span className="font-bold text-text-primary">Add to Today's Tasks</span>
            </div>
            <button
              onClick={handleToggleToday}
              className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                isInToday 
                  ? 'bg-warning/10 border-warning/30 text-warning' 
                  : 'bg-surface/50 border-border/30 text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              {isInToday ? 'In Today' : 'Add to Today'}
            </button>
          </div>

          {/* Due date picker */}
          <div className="space-y-2 pb-3 border-b border-border/10">
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
              <Calendar className="h-4 w-4" />
              <span className="uppercase tracking-wider">Due Date</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                type="button"
                onClick={() => setDueDatePreset('today')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${dueAt === new Date().toISOString().split('T')[0] ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface/30 border-border/15 hover:bg-surface-hover/30 text-text-secondary hover:text-text-primary'}`}
              >
                Today
              </button>
              <button 
                type="button"
                onClick={() => setDueDatePreset('tomorrow')}
                className="py-1.5 px-2 rounded-lg text-[10px] font-bold bg-surface/30 border border-border/15 hover:bg-surface-hover/30 text-text-secondary hover:text-text-primary transition-all"
              >
                Tomorrow
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="date"
                value={dueAt}
                onChange={(e) => {
                  setDueAt(e.target.value);
                  handleFieldBlur('due_at', e.target.value || null);
                }}
                className="flex-1 bg-surface/30 border border-border/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent/40 transition-all"
              />
              {dueAt && (
                <button
                  onClick={() => setDueDatePreset('clear')}
                  className="text-[10px] font-bold text-danger hover:underline px-1 focus:outline-none"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Reminders section */}
          <div className="space-y-2 pb-3 border-b border-border/10">
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
              <Bell className="h-4 w-4" />
              <span className="uppercase tracking-wider">Reminder Time</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => {
                  setReminderAt(e.target.value);
                  handleFieldBlur('reminder_at', e.target.value ? new Date(e.target.value).toISOString() : null);
                }}
                className="flex-1 bg-surface/30 border border-border/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent/40 transition-all"
              />
              {reminderAt && (
                <button
                  onClick={() => {
                    setReminderAt('');
                    handleFieldBlur('reminder_at', null);
                  }}
                  className="text-[10px] font-bold text-danger hover:underline px-1 focus:outline-none"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Priority dropdown */}
          <div className="flex justify-between items-center text-xs pb-3 border-b border-border/10">
            <div className="flex items-center gap-2 font-bold text-text-secondary">
              <Info className="h-4 w-4" />
              <span className="uppercase tracking-wider">Priority</span>
            </div>
            <select
              value={priority}
              onChange={(e) => {
                const val = e.target.value as any;
                setPriority(val);
                handleFieldBlur('priority', val);
              }}
              className="bg-surface border border-border/20 rounded-lg px-2 py-1 text-xs font-bold text-text-primary focus:outline-none"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Recurrence setting */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 font-bold text-text-secondary">
              <RefreshCw className="h-4 w-4" />
              <span className="uppercase tracking-wider">Repeat</span>
            </div>
            <select
              value={recurrence}
              onChange={(e) => {
                const val = e.target.value;
                setRecurrence(val);
                handleFieldBlur('recurrence_rule', val || null);
              }}
              className="bg-surface border border-border/20 rounded-lg px-2 py-1 text-xs font-bold text-text-primary focus:outline-none"
            >
              <option value="">Never</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Tags input/pills */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
            <Tag className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">Tags</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span 
                key={t}
                className="flex items-center gap-1 text-[10px] font-bold bg-surface border border-border/20 text-text-secondary rounded-lg px-2 py-1 select-none"
              >
                <span>#{t}</span>
                <button 
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-danger text-text-secondary/40 font-bold focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag (e.g. #urgent)..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              className="flex-1 bg-surface/20 border border-border/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:border-accent/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newTag.trim()}
              className="py-1.5 px-3 bg-surface hover:bg-surface-hover/80 text-text-primary border border-border/20 text-xs font-bold rounded-lg transition-all"
            >
              Add
            </button>
          </form>
        </div>

        {/* Separator line */}
        <div className="border-t border-border/10" />

        {/* Checklist steps */}
        <StepsWidget taskId={task.id} onStepsChange={onTaskUpdated} />

        {/* Separator line */}
        <div className="border-t border-border/10" />

        {/* File Attachments */}
        <FilesWidget taskId={task.id} onFilesChange={onTaskUpdated} />

        {/* Separator line */}
        <div className="border-t border-border/10" />

        {/* Workflow Tracker custom widget */}
        <FlowTrackerWidget taskId={task.id} taskTitle={task.title} onFlowChange={onTaskUpdated} />

      </div>

      {/* Bottom control panel */}
      <div className="p-4 border-t border-border/10 bg-surface/5 flex items-center justify-between text-xs">
        <span className="text-[10px] font-semibold text-text-secondary/60">
          Created: {new Date(task.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={handleDeleteTask}
          className="flex items-center gap-1 py-1.5 px-3 bg-danger/10 hover:bg-danger/25 text-danger border border-danger/20 hover:border-danger/30 rounded-xl font-bold transition-all outline-none"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Task</span>
        </button>
      </div>

    </div>
  );
};
