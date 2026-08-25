import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type Task } from '../services/supabase';
import { TaskItem } from '../components/tasks/TaskItem';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { Calendar } from '../components/dashboard/Calendar';
import { 
  CheckSquare, CheckCircle, Flame, Clock, Plus, Search, 
  ChevronDown, ChevronRight, Loader2, Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  
  // Workspace selection
  const [workspace, setWorkspace] = useState<'personal' | 'work'>('personal');
  
  // Data lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Quick task creation
  const [quickTitle, setQuickTitle] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [user, workspace]);

  const loadTasks = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await dbService.getTasks(user.id, workspace);
      setTasks(data);
      
      // Update selected task in real-time if drawer is open
      if (selectedTask) {
        const updated = data.find(t => t.id === selectedTask.id);
        if (updated) {
          setSelectedTask(updated);
        } else {
          setSelectedTask(null);
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newTask = await dbService.createTask({
        user_id: user.id,
        workspace,
        title: quickTitle.trim(),
        description: null,
        priority: 'none',
        due_at: null,
        reminder_at: null,
        recurrence_rule: null
      });
      
      setTasks(prev => [newTask, ...prev]);
      setQuickTitle('');
      setShowQuickAdd(false);
      
      // Seed details drawer if we want, or just trigger list reload
      await loadTasks();
      
      // Small sparkle confetti
      confetti({ particleCount: 30, spread: 30, origin: { y: 0.8 } });
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkspaceChange = (nextWorkspace: 'personal' | 'work') => {
    if (nextWorkspace === workspace) return;
    setWorkspace(nextWorkspace);
    setSelectedTask(null); // Close active detail drawer
    setSelectedTag(null); // Clear tag filters
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus Quick Add on "n" key if not typing in inputs
      if (e.key.toLowerCase() === 'n' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowQuickAdd(true);
        setTimeout(() => {
          document.getElementById('quick-add-input')?.focus();
        }, 50);
      }
      
      // Close drawer on "Escape"
      if (e.key === 'Escape') {
        setSelectedTask(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter & Search logic
  const filteredTasks = tasks.filter(t => {
    // 1. Search Query mapping (Matches Title, Description, Steps, Tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) || false;
      const matchTags = t.tags?.some(tag => tag.toLowerCase().includes(q)) || false;
      
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }

    // 2. Priority match
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
      return false;
    }

    // 3. Tag match
    if (selectedTag && !t.tags?.includes(selectedTag)) {
      return false;
    }

    return true;
  });

  // Separate active and completed lists
  const activeTasks = filteredTasks.filter(t => !t.is_completed);
  const completedTasks = filteredTasks.filter(t => t.is_completed);

  // Stats calculation
  const totalOpenTasks = tasks.filter(t => !t.is_completed).length;
  const totalCompleted = tasks.filter(t => t.is_completed).length;
  const totalTasksCount = tasks.length;
  const completionPercentage = totalTasksCount > 0 
    ? Math.round((totalCompleted / totalTasksCount) * 100) 
    : 0;

  // Aggregate all unique tags from current workspace tasks for deck filter list
  const allWorkspaceTags = Array.from(
    new Set(tasks.flatMap(t => t.tags || []))
  );

  return (
    <div className="space-y-6 pb-16 animate-fade-in relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Tasks</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Plan. Focus. Complete.
          </p>
        </div>

        {/* Global Task Search input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/50" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface/20 hover:bg-surface/30 focus:bg-surface/40 border border-border/25 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-text-primary placeholder:text-text-secondary/40 focus:border-accent/40 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary/50 hover:text-text-primary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* SEGMENTED SWITCHER CONTROL (Workspace Environment) */}
      <div className="grid grid-cols-2 p-1.5 bg-surface/15 border border-border/10 rounded-2xl max-w-lg mx-auto relative select-none">
        <button
          onClick={() => handleWorkspaceChange('personal')}
          className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 outline-none ${
            workspace === 'personal'
              ? 'bg-warning/10 border border-warning/20 text-warning shadow-md scale-[1.01]'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>🏠 Personal</span>
        </button>
        
        <button
          onClick={() => handleWorkspaceChange('work')}
          className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 outline-none ${
            workspace === 'work'
              ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 shadow-md scale-[1.01]'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>💼 Work</span>
        </button>
      </div>

      {/* GENERAL STATS PANEL OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
        <div className="glass-panel p-4.5 rounded-2xl flex items-center gap-4 select-none">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center text-accent shadow-sm">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black text-text-primary leading-none">{totalOpenTasks}</p>
            <p className="text-[10px] text-text-secondary/70 font-bold uppercase tracking-wider mt-1">Open Tasks</p>
          </div>
        </div>

        <div className="glass-panel p-4.5 rounded-2xl flex items-center gap-4 select-none">
          <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/15 flex items-center justify-center text-success shadow-sm">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black text-text-primary leading-none">{totalCompleted}</p>
            <p className="text-[10px] text-text-secondary/70 font-bold uppercase tracking-wider mt-1">Completed</p>
          </div>
        </div>

        <div className="glass-panel p-4.5 rounded-2xl flex items-center gap-4 select-none">
          <div className="h-10 w-10 rounded-xl bg-warning/10 border border-warning/15 flex items-center justify-center text-warning shadow-sm">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black text-text-primary leading-none">7-day</p>
            <p className="text-[10px] text-text-secondary/70 font-bold uppercase tracking-wider mt-1">Streak</p>
          </div>
        </div>

        <div className="glass-panel p-4.5 rounded-2xl flex items-center gap-4 select-none">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black text-text-primary leading-none">1h 45m</p>
            <p className="text-[10px] text-text-secondary/70 font-bold uppercase tracking-wider mt-1">Time Today</p>
          </div>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE TASKS LIST & QUICK ADD (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header row */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <span>Active Tasks</span>
              <span className="h-5 px-2 bg-surface/50 border border-border/10 rounded-full text-[10px] flex items-center justify-center text-text-secondary">
                {activeTasks.length}
              </span>
            </h3>
            
            <button
              onClick={() => setShowQuickAdd(prev => !prev)}
              className="flex items-center gap-1 py-1.5 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl active:scale-95 shadow-md shadow-accent/5 transition-all outline-none"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Quick Add block */}
          {showQuickAdd && (
            <form onSubmit={handleQuickAdd} className="glass-panel p-4 rounded-2xl border border-accent/20 animate-scale-in">
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  id="quick-add-input"
                  placeholder={workspace === 'personal' ? "Add a task to Personal (e.g. Workout)..." : "Add a task to Work (e.g. Review PR)..."}
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="flex-1 bg-surface/20 border border-border/20 rounded-xl px-4 py-2.5 text-xs font-semibold text-text-primary focus:border-accent/40 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!quickTitle.trim() || isSubmitting}
                  className="py-2.5 px-4 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-white rounded-xl text-xs font-bold active:scale-95 transition-all outline-none"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          )}

          {/* Active Tasks list */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-secondary gap-3 select-none">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500">Retrieving environment tasks</span>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-2xl border border-dashed border-border/20">
              <p className="text-xs font-bold text-text-primary">
                {workspace === 'personal' ? 'Your personal space is clear.' : 'No work tasks yet.'}
              </p>
              <p className="text-[10px] text-text-secondary/40 font-semibold mt-1">
                {workspace === 'personal' ? 'No tasks yet. Create one to begin!' : 'Ready when you are.'}
              </p>
              <button
                onClick={() => setShowQuickAdd(true)}
                className="mt-4 text-[10px] font-bold bg-surface border border-border/25 hover:border-border/40 text-text-primary px-3 py-1.5 rounded-lg transition-all"
              >
                + Add Task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(t => (
                <TaskItem
                  key={t.id}
                  task={t}
                  isSelected={selectedTask?.id === t.id}
                  onSelect={() => setSelectedTask(t)}
                  onTaskUpdated={loadTasks}
                />
              ))}
            </div>
          )}

          {/* COMPLETED TASKS COLLAPSIBLE BLOCK */}
          {!isLoading && completedTasks.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/10 select-none">
              <button
                onClick={() => setShowCompleted(prev => !prev)}
                className="flex items-center justify-between w-full text-xs font-bold text-text-secondary/70 hover:text-text-primary uppercase tracking-wider transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span>Completed Tasks</span>
                  <span className="h-4.5 px-2 bg-surface border border-border/5 rounded-full text-[9px] flex items-center justify-center font-bold text-text-secondary/50">
                    {completedTasks.length}
                  </span>
                </div>
              </button>

              {showCompleted && (
                <div className="space-y-3">
                  {completedTasks.map(t => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      isSelected={selectedTask?.id === t.id}
                      onSelect={() => setSelectedTask(t)}
                      onTaskUpdated={loadTasks}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: CALENDAR, TASK STATS CHART, PRIORITY AND TAG DECKS */}
        <div className="space-y-6">
          
          {/* Calendar Widget */}
          <Calendar />

          {/* Task Stats Pie/Pill Circle representation */}
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-6 select-none">
            {/* Circle chart */}
            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  className="stroke-surface-hover/20"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  className="stroke-accent"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={2 * Math.PI * 30 * (1 - completionPercentage / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-black text-text-primary">
                {completionPercentage}%
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <h4 className="text-xs font-bold text-text-primary">Task Stats</h4>
              <p className="text-[10px] font-bold text-text-secondary mt-1">
                <span className="text-text-primary">{totalCompleted} / {totalTasksCount}</span> Completed
              </p>
              <p className="text-[9px] font-semibold text-text-secondary/60">
                {totalOpenTasks} Pending tasks
              </p>
            </div>
          </div>

          {/* Priority filter Check list card */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 select-none">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              <span>Priority Filter</span>
            </h4>
            
            <div className="space-y-2">
              {['all', 'high', 'medium', 'low'].map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className="flex items-center gap-2.5 w-full text-left focus:outline-none"
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                    selectedPriority === p 
                      ? 'border-accent bg-accent/15 text-accent' 
                      : 'border-border/30 hover:border-border/60'
                  }`}>
                    {selectedPriority === p && <div className="h-2 w-2 bg-accent rounded-full" />}
                  </div>
                  <span className={`text-xs font-semibold capitalize ${selectedPriority === p ? 'text-text-primary font-bold' : 'text-text-secondary/70 hover:text-text-primary'}`}>
                    {p} Priority
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags cloud/deck */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 select-none">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Tags Cloud
            </h4>
            
            {allWorkspaceTags.length === 0 ? (
              <p className="text-[10px] text-text-secondary/35 font-medium text-center py-2">
                No tags mapped in this workspace yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2 py-1.5 rounded-lg text-[9px] font-extrabold uppercase border transition-all ${
                    selectedTag === null
                      ? 'bg-accent/10 border-accent/25 text-accent'
                      : 'bg-surface border-border/15 hover:bg-surface-hover text-text-secondary'
                  }`}
                >
                  All Tags
                </button>

                {allWorkspaceTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`px-2 py-1.5 rounded-lg text-[9px] font-extrabold uppercase border transition-all ${
                      selectedTag === tag
                        ? 'bg-accent/15 border-accent/35 text-accent'
                        : 'bg-surface border-border/15 hover:bg-surface-hover text-text-secondary'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* DETAIL SIDE PANEL DRAWER (Opens when a task is selected) */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={loadTasks}
          onTaskDeleted={() => {
            setSelectedTask(null);
            loadTasks();
            confetti({ particleCount: 40, spread: 30, colors: ['#EF4444', '#F87171'] });
          }}
        />
      )}

    </div>
  );
};
