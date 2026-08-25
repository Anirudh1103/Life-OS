import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type Task } from '../services/supabase';
import { TaskItem } from '../components/tasks/TaskItem';
import { TaskDetailDrawer } from '../components/tasks/TaskDetailDrawer';
import { Calendar } from '../components/dashboard/Calendar';
import { 
  Plus, 
  Search, 
  ListTodo,
  MoreHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Workspace selection from query parameter (defaults to personal)
  const workspace = (searchParams.get('space') as 'personal' | 'work') || 'personal';

  // Sub-tabs navigation
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'mytasks' | 'kanban' | 'calendar' | 'timeline'>('overview');
  
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

  // Time-based dynamic greeting
  const [greeting, setGreeting] = useState('Good afternoon');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      let hour = now.getHours();
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          hour = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(now), 10);
        }
      } catch (e) {}

      if (hour >= 5 && hour < 12) setGreeting('Good morning');
      else if (hour >= 12 && hour < 16) setGreeting('Good afternoon');
      else if (hour >= 16 && hour < 22) setGreeting('Good evening');
      else setGreeting('Good night');

      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      };
      setDateString(now.toLocaleDateString('en-US', options));
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

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

  // Drag and drop/click move simulation for Kanban status toggle
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
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
      return false;
    }
    if (selectedTag && !t.tags?.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  // Timeline separation for Overview
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

  // Statistics calculation for overview panels
  const totalCount = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => t.is_completed).length;
  const pendingCount = filteredTasks.filter(t => !t.is_completed).length;
  
  // Calculate Overdue
  const overdueCount = filteredTasks.filter(t => {
    if (t.is_completed || !t.due_at) return false;
    return new Date(t.due_at).getTime() < new Date().getTime();
  }).length;

  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Priority count aggregation for charts
  const priorityStats = {
    high: filteredTasks.filter(t => t.priority === 'high').length,
    medium: filteredTasks.filter(t => t.priority === 'medium').length,
    low: filteredTasks.filter(t => t.priority === 'low').length,
  };

  const allWorkspaceTags = Array.from(new Set(tasks.flatMap(t => t.tags || [])));

  return (
    <div className="space-y-6 pb-16 animate-fade-in relative text-left select-none">
      
      {/* 1. HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-text-primary tracking-tight md:text-2xl">
            {greeting}, Anirudh 👋
          </h1>
          <p className="text-[10px] text-text-secondary font-medium mt-0.5 uppercase tracking-wider">
            {dateString}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add Purple Trigger */}
          <button
            onClick={() => {
              setSelectedPriority('all');
              setQuickTitle('');
              setShowQuickAdd(prev => !prev);
            }}
            className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all outline-none"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
            <span className="text-[8px] opacity-75">▼</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TABS NAVIGATION BAR */}
      <div className="border-b border-border/10 flex gap-4 text-xs font-bold select-none whitespace-nowrap overflow-x-auto pb-1 scrollbar-none">
        {(['overview', 'mytasks', 'kanban', 'calendar', 'timeline'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`pb-2 border-b-2 capitalize text-[10px] font-extrabold uppercase tracking-widest transition-all outline-none ${
              activeSubTab === tab 
                ? 'border-accent text-accent' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'mytasks' ? 'My Tasks' : tab}
          </button>
        ))}
      </div>

      {/* 3. OVERVIEW WORKSPACE SCREENS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* STATS OVERVIEW CARDS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tasks Card */}
            <div className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/20 flex flex-col justify-between min-h-[90px]">
              <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Total Tasks</span>
              <div className="mt-2.5">
                <h3 className="text-lg font-black text-text-primary leading-none tracking-wide">{totalCount}</h3>
                <span className="text-[9px] font-bold text-accent mt-1 inline-block">+2 from yesterday</span>
              </div>
            </div>

            {/* Completed Tasks Card */}
            <div className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/20 flex flex-col justify-between min-h-[90px]">
              <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Completed</span>
              <div className="mt-2.5">
                <h3 className="text-lg font-black text-success leading-none tracking-wide">{completedCount}</h3>
                <span className="text-[9px] font-bold text-success mt-1 inline-block">+1 from yesterday</span>
              </div>
            </div>

            {/* Pending Tasks Card */}
            <div className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/20 flex flex-col justify-between min-h-[90px]">
              <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Pending</span>
              <div className="mt-2.5">
                <h3 className="text-lg font-black text-warning leading-none tracking-wide">{pendingCount}</h3>
                <span className="text-[9px] font-bold text-warning mt-1 inline-block">-1 from yesterday</span>
              </div>
            </div>

            {/* Overdue Tasks Card */}
            <div className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/20 flex flex-col justify-between min-h-[90px]">
              <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Overdue</span>
              <div className="mt-2.5">
                <h3 className="text-lg font-black text-danger leading-none tracking-wide">{overdueCount}</h3>
                <span className="text-[9px] font-bold text-danger mt-1 inline-block">! Needs attention</span>
              </div>
            </div>
          </div>

          {/* HORIZONTAL FILTERS ROW */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-surface/10 p-3 rounded-2xl border border-border/10">
            {/* Search Box */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary/50" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-12 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-[10px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/40"
              />
              <span className="absolute right-2.5 top-2 text-[8px] bg-surface-hover/50 text-text-secondary/60 border border-border/20 px-1 rounded font-bold">⌘ K</span>
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto text-[10px] font-bold">
              <select className="px-2 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-text-primary focus:outline-none">
                <option>Due Date</option>
              </select>
              <select 
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-2 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-text-primary focus:outline-none"
              >
                <option value="all">Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select className="px-2 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-text-primary focus:outline-none">
                <option>Status</option>
              </select>
              <select 
                value={selectedTag || ''} 
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="px-2 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-text-primary focus:outline-none"
              >
                <option value="">Tags</option>
                {allWorkspaceTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
              <button className="px-2.5 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-text-secondary hover:text-text-primary">
                More Filters
              </button>
              <select className="px-2 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-text-primary focus:outline-none">
                <option>Sort: Due Soon</option>
              </select>
            </div>
          </div>

          {/* Quick Add Form modal block */}
          {showQuickAdd && (
            <form onSubmit={handleQuickAddSubmit} className="glass-panel p-4.5 rounded-2xl border border-accent/20 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Task title (e.g. Plan roadmap)..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  required
                  className="flex-1 bg-surface-hover/20 border border-border/20 rounded-xl px-4 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent/40"
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

          {/* TWO COLUMN CONTENT PANEL SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Timeline groupings (Today, This Week, Later) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TODAY */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <span>Today</span>
                    <span className="h-4.5 px-2 bg-surface/50 border border-border/5 rounded-full text-[9px] flex items-center justify-center font-bold text-text-secondary/70">
                      {grouped.todayList.length}
                    </span>
                  </h4>
                  <button className="text-text-secondary/50 hover:text-text-primary"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
                
                <div className="space-y-2.5">
                  {grouped.todayList.length === 0 ? (
                    <p className="text-[10px] text-text-secondary/40 font-bold text-center py-4 bg-surface/20 rounded-xl border border-dashed border-border/10">No tasks due today.</p>
                  ) : (
                    grouped.todayList.map(t => (
                      <TaskItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} onSelect={() => setSelectedTask(t)} onTaskUpdated={loadTasks} />
                    ))
                  )}
                </div>
              </div>

              {/* THIS WEEK */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <span>This Week</span>
                    <span className="h-4.5 px-2 bg-surface/50 border border-border/5 rounded-full text-[9px] flex items-center justify-center font-bold text-text-secondary/70">
                      {grouped.weekList.length}
                    </span>
                  </h4>
                  <button className="text-text-secondary/50 hover:text-text-primary"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
                
                <div className="space-y-2.5">
                  {grouped.weekList.length === 0 ? (
                    <p className="text-[10px] text-text-secondary/40 font-bold text-center py-4 bg-surface/20 rounded-xl border border-dashed border-border/10">No tasks due this week.</p>
                  ) : (
                    grouped.weekList.map(t => (
                      <TaskItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} onSelect={() => setSelectedTask(t)} onTaskUpdated={loadTasks} />
                    ))
                  )}
                </div>
              </div>

              {/* LATER */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <span>Later</span>
                    <span className="h-4.5 px-2 bg-surface/50 border border-border/5 rounded-full text-[9px] flex items-center justify-center font-bold text-text-secondary/70">
                      {grouped.laterList.length}
                    </span>
                  </h4>
                  <button className="text-text-secondary/50 hover:text-text-primary"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
                
                <div className="space-y-2.5">
                  {grouped.laterList.length === 0 ? (
                    <p className="text-[10px] text-text-secondary/40 font-bold text-center py-4 bg-surface/20 rounded-xl border border-dashed border-border/10">No tasks scheduled for later.</p>
                  ) : (
                    grouped.laterList.map(t => (
                      <TaskItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} onSelect={() => setSelectedTask(t)} onTaskUpdated={loadTasks} />
                    ))
                  )}
                </div>
              </div>

              {/* Collapsible Completed Section */}
              {completedCount > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/10">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 text-[10px] font-black text-text-secondary uppercase tracking-widest"
                  >
                    <span>{showCompleted ? '▼' : '▶'} Completed tasks ({completedCount})</span>
                  </button>

                  {showCompleted && (
                    <div className="space-y-2.5">
                      {filteredTasks.filter(t => t.is_completed).map(t => (
                        <TaskItem key={t.id} task={t} isSelected={selectedTask?.id === t.id} onSelect={() => setSelectedTask(t)} onTaskUpdated={loadTasks} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Quick-Add trigger line */}
              <div className="flex justify-center gap-6 pt-3 select-none text-[10px] font-black uppercase tracking-widest text-text-secondary">
                <button 
                  onClick={() => setShowQuickAdd(true)}
                  className="hover:text-text-primary flex items-center gap-1"
                >
                  <span>+ Add Task</span>
                </button>
                <button 
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="hover:text-text-primary flex items-center gap-1"
                >
                  <span>↓ Show Completed</span>
                </button>
              </div>

            </div>

            {/* Right side: Widgets (Calendar, Stats gauge, Priority Bars) */}
            <div className="space-y-6">
              
              {/* Calendar Widget */}
              <Calendar />

              {/* Task Stats circle donut gauge */}
              <div className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/15 flex items-center gap-6">
                {/* SVG Gauge */}
                <div className="relative h-18 w-18 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                    <circle 
                      cx="36" 
                      cy="36" 
                      r="30" 
                      fill="none" 
                      stroke="url(#completedGradient)" 
                      strokeWidth="6" 
                      strokeDasharray={2 * Math.PI * 30}
                      strokeDashoffset={2 * Math.PI * 30 * (1 - completionPercentage / 100)}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-black text-text-primary">{completionPercentage}%</span>
                    <span className="text-[7px] text-text-secondary/70 uppercase font-black tracking-tighter">Done</span>
                  </div>
                </div>

                {/* Legend list details */}
                <div className="flex-1 space-y-1.5 text-[9px] font-extrabold text-text-secondary">
                  <h4 className="text-[10px] font-black text-text-primary mb-1">Task Stats</h4>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      <span>Completed</span>
                    </div>
                    <span className="text-text-primary">{completedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                      <span>Pending</span>
                    </div>
                    <span className="text-text-primary">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                      <span>Overdue</span>
                    </div>
                    <span className="text-text-primary">{overdueCount}</span>
                  </div>
                  <div className="border-t border-border/5 pt-1.5 flex justify-between items-center">
                    <span>Total</span>
                    <span className="text-text-primary font-black">{totalCount}</span>
                  </div>
                </div>
              </div>

              {/* Priority Breakdown bars progress */}
              <div className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/15 space-y-4">
                <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Priority Breakdown</h4>
                
                <div className="space-y-3.5 text-[9px] font-bold">
                  {/* High */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary">High Priority</span>
                      <span className="text-text-secondary font-mono">{priorityStats.high}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${totalCount > 0 ? (priorityStats.high / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary">Medium Priority</span>
                      <span className="text-text-secondary font-mono">{priorityStats.medium}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-warning rounded-full transition-all duration-300"
                        style={{ width: `${totalCount > 0 ? (priorityStats.medium / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Low */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary">Low Priority</span>
                      <span className="text-text-secondary font-mono">{priorityStats.low}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success rounded-full transition-all duration-300"
                        style={{ width: `${totalCount > 0 ? (priorityStats.low / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. KANBAN BOARD SCREEN SUB-VIEW */}
      {activeSubTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start mt-4 select-none">
          {/* TO DO COLUMN */}
          <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 space-y-3">
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
                      <p className="text-[10px] font-bold text-text-primary truncate max-w-[150px]">{t.title}</p>
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

          {/* IN PROGRESS COLUMN */}
          <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 space-y-3">
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
                      <p className="text-[10px] font-bold text-text-primary truncate max-w-[150px]">{t.title}</p>
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

          {/* COMPLETED COLUMN */}
          <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 space-y-3">
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
                      <p className="text-[10px] font-bold text-text-primary truncate line-through max-w-[150px]">{t.title}</p>
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

      {/* 5. CALENDAR DIRECT VIEW */}
      {activeSubTab === 'calendar' && (
        <div className="glass-panel p-6 rounded-2xl border border-border/10 bg-surface/10 max-w-2xl mx-auto">
          <Calendar />
        </div>
      )}

      {/* 6. timeline placeholder */}
      {(activeSubTab === 'mytasks' || activeSubTab === 'timeline') && (
        <div className="glass-panel py-16 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto border-dashed">
          <ListTodo className="h-8 w-8 text-text-secondary/30 mb-1" />
          <h4 className="text-xs font-bold text-text-primary">Sub-view module coming soon</h4>
          <p className="text-[10px] text-text-secondary/60 mt-1 max-w-[220px]">
            Please review the Overview tab or Kanban view tab for active features.
          </p>
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
