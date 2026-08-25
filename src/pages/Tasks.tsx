import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type Task } from '../services/supabase';
import { TaskItem } from '../components/tasks/TaskItem';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { Calendar } from '../components/dashboard/Calendar';
import { Search } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Workspace selection from query parameter
  const workspace = (searchParams.get('space') as 'personal' | 'work') || 'personal';

  // Sub-tabs navigation
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'kanban' | 'calendar'>('overview');
  
  // Data lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form states
  const [quickTitle, setQuickTitle] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [user, workspace]);

  const loadTasks = async () => {
    if (!user) return;
    try {
      const data = await dbService.getTasks(user.id, workspace);
      setTasks(data);
      if (selectedTask) {
        const updated = data.find(t => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
        else setSelectedTask(null);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newTask = await dbService.createTask({
        user_id: user.id,
        workspace,
        title: quickTitle.trim(),
        description: null,
        priority: selectedPriority !== 'all' ? (selectedPriority as any) : 'none',
        due_at: null,
        reminder_at: null,
        recurrence_rule: null
      });
      
      setTasks(prev => [newTask, ...prev]);
      setQuickTitle('');
      setShowQuickAdd(false);
      await loadTasks();
      confetti({ particleCount: 30, spread: 30, origin: { y: 0.8 } });
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveKanbanStatus = async (task: Task, targetStatus: 'todo' | 'inprogress' | 'completed') => {
    if (!user) return;
    let updates: Partial<Task> = {};
    if (targetStatus === 'completed') {
      updates.is_completed = true;
    } else {
      updates.is_completed = false;
      updates.priority = targetStatus === 'inprogress' ? 'high' : 'low';
    }
    await dbService.updateTask(user.id, task.id, updates);
    await loadTasks();
  };

  // Filters logic
  const filteredTasks = tasks.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) || false;
      const matchTags = t.tags?.some(tag => tag.toLowerCase().includes(q)) || false;
      if (!matchTitle && !matchDesc && matchTags === false) return false;
    }
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
      return false;
    }
    if (selectedTag && !t.tags?.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  // Grouping active tasks by timeline buckets
  const getGroupedTimelineTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

    const todayList: Task[] = [];
    const weekList: Task[] = [];
    const laterList: Task[] = [];

    filteredTasks.filter(t => !t.is_completed).forEach(t => {
      if (!t.due_at) {
        laterList.push(t);
        return;
      }
      const due = new Date(t.due_at);
      due.setHours(0, 0, 0, 0);

      if (due.getTime() === today.getTime()) {
        todayList.push(t);
      } else if (due.getTime() > today.getTime() && due.getTime() <= endOfWeek.getTime()) {
        weekList.push(t);
      } else {
        laterList.push(t);
      }
    });

    return { todayList, weekList, laterList };
  };

  const grouped = getGroupedTimelineTasks();

  // Stats calculation
  const totalCount = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => t.is_completed).length;
  const pendingCount = filteredTasks.filter(t => !t.is_completed).length;
  
  const overdueCount = filteredTasks.filter(t => {
    if (t.is_completed || !t.due_at) return false;
    return new Date(t.due_at).getTime() < new Date().getTime();
  }).length;

  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const priorityStats = {
    high: filteredTasks.filter(t => t.priority === 'high').length,
    medium: filteredTasks.filter(t => t.priority === 'medium').length,
    low: filteredTasks.filter(t => t.priority === 'low').length,
  };

  const allWorkspaceTags = Array.from(new Set(tasks.flatMap(t => t.tags || [])));

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-left select-none max-w-6xl mx-auto">
      
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-text-primary uppercase tracking-wider">
            {workspace === 'work' ? '💼 Work Space' : '🏠 Personal Space'}
          </h1>
          <p className="text-[10px] text-text-secondary/70 font-medium">
            Manage your daily tasks and project milestones
          </p>
        </div>

        {/* capsule active sub-tab view switcher */}
        <div className="bg-surface/20 border border-border/10 rounded-xl p-1 flex gap-1 self-start sm:self-auto">
          {(['overview', 'kanban', 'calendar'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all outline-none ${
                activeSubTab === tab 
                  ? 'bg-accent/15 border border-accent/20 text-accent font-extrabold shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MINIMAL STATUS CAPSULE DOCK */}
      <div className="flex items-center gap-6 px-5 py-3 bg-surface/10 border border-border/15 rounded-2xl text-[9px] font-bold text-text-secondary/80 overflow-x-auto scrollbar-none shadow-sm">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span>{totalCount} Total</span>
        </div>
        <div className="h-3.5 w-px bg-border/20" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span>{completedCount} Completed</span>
        </div>
        <div className="h-3.5 w-px bg-border/20" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          <span>{pendingCount} Pending</span>
        </div>
        <div className="h-3.5 w-px bg-border/20" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
          <span className="text-danger/80">{overdueCount} Overdue</span>
        </div>
      </div>

      {/* 3. SUB-VIEW SWITCHER CONTENT */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* SEARCH & FILTERS DOCK */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-surface/5 p-2 rounded-xl border border-border/10">
            {/* Search Box */}
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-text-secondary/40" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7.5 pr-4 py-1.5 bg-transparent rounded-lg text-[10px] text-text-primary placeholder:text-text-secondary/45 border-none focus:outline-none focus:ring-1 focus:ring-accent/15"
              />
            </div>

            {/* Quick selectors dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold text-text-secondary">
              <select 
                value={selectedPriority} 
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-2 py-1 bg-surface/30 border border-border/10 rounded-lg text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="all">Priority: All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select 
                value={selectedTag || ''} 
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="px-2 py-1 bg-surface/30 border border-border/10 rounded-lg text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="">Tags: All</option>
                {allWorkspaceTags.map(t => (
                  <option key={t} value={t}>#{t}</option>
                ))}
              </select>
              <button 
                onClick={() => setShowQuickAdd(!showQuickAdd)} 
                className="px-2.5 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/25 rounded-lg text-accent font-black transition-colors"
              >
                + New Task
              </button>
            </div>
          </div>

          {/* QUICK ADD MODAL BOX */}
          {showQuickAdd && (
            <form onSubmit={handleQuickAddSubmit} className="glass-panel p-4 rounded-xl border border-accent/25 space-y-2 animate-scale-in">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Create task (e.g. Design assets)..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  required
                  className="flex-1 bg-surface/20 border border-border/20 rounded-xl px-4 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent/40"
                />
                <button
                  type="submit"
                  disabled={!quickTitle.trim() || isSubmitting}
                  className="py-2 px-5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* TWO COLUMN ASYMMETRIC GRID WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT COLUMN: MINIMAL TIMELINE TASKS LIST (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Today */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-extrabold text-text-secondary/70 uppercase tracking-widest">Today</h3>
                  <span className="text-[9px] font-bold text-text-secondary/50">{grouped.todayList.length}</span>
                </div>
                <div className="space-y-1.5">
                  {grouped.todayList.length === 0 ? (
                    <p className="text-[9px] text-text-secondary/30 font-medium py-3 text-center">Clear</p>
                  ) : (
                    grouped.todayList.map(t => (
                      <TaskItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} onSelect={() => setSelectedTask(t)} onTaskUpdated={loadTasks} />
                    ))
                  )}
                </div>
              </div>

              {/* This Week */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-extrabold text-text-secondary/70 uppercase tracking-widest">This Week</h3>
                  <span className="text-[9px] font-bold text-text-secondary/50">{grouped.weekList.length}</span>
                </div>
                <div className="space-y-1.5">
                  {grouped.weekList.length === 0 ? (
                    <p className="text-[9px] text-text-secondary/30 font-medium py-3 text-center">Clear</p>
                  ) : (
                    grouped.weekList.map(t => (
                      <TaskItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} onSelect={() => setSelectedTask(t)} onTaskUpdated={loadTasks} />
                    ))
                  )}
                </div>
              </div>

              {/* Later */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-extrabold text-text-secondary/70 uppercase tracking-widest">Later</h3>
                  <span className="text-[9px] font-bold text-text-secondary/50">{grouped.laterList.length}</span>
                </div>
                <div className="space-y-1.5">
                  {grouped.laterList.length === 0 ? (
                    <p className="text-[9px] text-text-secondary/30 font-medium py-3 text-center">Clear</p>
                  ) : (
                    grouped.laterList.map(t => (
                      <TaskItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} onSelect={() => setSelectedTask(t)} onTaskUpdated={loadTasks} />
                    ))
                  )}
                </div>
              </div>

              {/* Collapsed completed list view */}
              {completedCount > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/10">
                  <button 
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="text-[9px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary flex items-center gap-1.5 outline-none"
                  >
                    <span>{showCompleted ? '▼' : '▶'} Completed ({completedCount})</span>
                  </button>
                  {showCompleted && (
                    <div className="space-y-1.5">
                      {filteredTasks.filter(t => t.is_completed).map(t => (
                        <TaskItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} onSelect={() => setSelectedTask(t)} onTaskUpdated={loadTasks} />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: ANALYTICS & CALENDAR SIDEBAR (1/3 width) */}
            <div className="space-y-6">
              
              {/* Sleek unified Analytics panel card */}
              <div className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/5 space-y-4">
                <div className="flex items-center justify-between select-none">
                  <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Analytics</h4>
                  <span className="text-[10px] font-black text-accent">{completionPercentage}%</span>
                </div>

                {/* Progress bar metrics */}
                <div className="space-y-3.5 text-[9px] font-bold">
                  {/* High priority */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary">High Priority</span>
                      <span className="text-text-secondary font-mono">{priorityStats.high}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${totalCount > 0 ? (priorityStats.high / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Medium priority */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary">Medium Priority</span>
                      <span className="text-text-secondary font-mono">{priorityStats.medium}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-warning rounded-full"
                        style={{ width: `${totalCount > 0 ? (priorityStats.medium / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Low priority */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary">Low Priority</span>
                      <span className="text-text-secondary font-mono">{priorityStats.low}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success rounded-full"
                        style={{ width: `${totalCount > 0 ? (priorityStats.low / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar card */}
              <Calendar />

            </div>

          </div>

        </div>
      )}

      {/* 4. KANBAN COLUMN LAYOUT */}
      {activeSubTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start mt-4 select-none">
          {/* TO DO */}
          <div className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/5 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">To Do</h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredTasks.filter(t => !t.is_completed && (t.priority === 'low' || t.priority === 'none')).length === 0 ? (
                <p className="text-[9px] text-text-secondary/40 font-bold py-6 text-center">Empty Column</p>
              ) : (
                filteredTasks.filter(t => !t.is_completed && (t.priority === 'low' || t.priority === 'none')).map(t => (
                  <div 
                    key={t.id} 
                    className="p-3 bg-surface/30 border border-border/5 rounded-xl flex justify-between items-center hover:bg-surface-hover/20 cursor-pointer"
                    onClick={() => setSelectedTask(t)}
                  >
                    <div>
                      <p className="text-[10px] font-bold text-text-primary truncate max-w-[130px]">{t.title}</p>
                      <span className="text-[8px] text-text-secondary font-semibold">Priority: {t.priority}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveKanbanStatus(t, 'inprogress'); }}
                      className="px-1.5 py-0.5 bg-accent/15 border border-accent/25 text-accent text-[8px] font-bold rounded"
                    >
                      Start →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* IN PROGRESS */}
          <div className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/5 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">In Progress</h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredTasks.filter(t => !t.is_completed && (t.priority === 'medium' || t.priority === 'high')).length === 0 ? (
                <p className="text-[9px] text-text-secondary/40 font-bold py-6 text-center">Empty Column</p>
              ) : (
                filteredTasks.filter(t => !t.is_completed && (t.priority === 'medium' || t.priority === 'high')).map(t => (
                  <div 
                    key={t.id} 
                    className="p-3 bg-surface/30 border border-border/5 rounded-xl flex justify-between items-center hover:bg-surface-hover/20 cursor-pointer"
                    onClick={() => setSelectedTask(t)}
                  >
                    <div>
                      <p className="text-[10px] font-bold text-text-primary truncate max-w-[130px]">{t.title}</p>
                      <span className="text-[8px] text-text-secondary font-semibold">Priority: {t.priority}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveKanbanStatus(t, 'todo'); }}
                        className="px-1.5 py-0.5 bg-surface/50 border border-border/15 text-[8px] font-bold rounded"
                      >
                        ← Back
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMoveKanbanStatus(t, 'completed'); }}
                        className="px-1.5 py-0.5 bg-success/10 border border-success/20 text-success text-[8px] font-bold rounded"
                      >
                        Finish ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COMPLETED */}
          <div className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/5 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Completed</h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredTasks.filter(t => t.is_completed).length === 0 ? (
                <p className="text-[9px] text-text-secondary/40 font-bold py-6 text-center">Empty Column</p>
              ) : (
                filteredTasks.filter(t => t.is_completed).map(t => (
                  <div 
                    key={t.id} 
                    className="p-3 bg-surface/30 border border-border/5 rounded-xl flex justify-between items-center hover:bg-surface-hover/20 cursor-pointer opacity-75"
                    onClick={() => setSelectedTask(t)}
                  >
                    <div>
                      <p className="text-[10px] font-bold text-text-primary truncate line-through max-w-[130px]">{t.title}</p>
                      <span className="text-[8px] text-success font-semibold">Completed ✓</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveKanbanStatus(t, 'inprogress'); }}
                      className="px-1.5 py-0.5 bg-surface/50 border border-border/15 text-[8px] font-bold rounded"
                    >
                      Reopen
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. CALENDAR VIEW */}
      {activeSubTab === 'calendar' && (
        <div className="glass-panel p-6 rounded-2xl border border-border/10 bg-surface/10 max-w-2xl mx-auto">
          <Calendar />
        </div>
      )}

      {/* DETAIL SIDE PANEL DRAWER */}
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
