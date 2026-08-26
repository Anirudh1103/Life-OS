import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type Task, type FitnessRoutineDay } from '../services/supabase';
import { 
  Plus, ChevronRight, X, Check, AlertCircle,
  Clock, Flame, CheckSquare,
  Briefcase, ShoppingBag, Phone, PlayCircle, PauseCircle, Loader2, TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { JarvisArcReactor } from '../components/jarvis/JarvisArcReactor';

interface PlanItem {
// ... existing interface ...
  id: string;
  title: string;
  workspace: 'personal' | 'work';
  workspaceLabel: string;
  priority: 'none' | 'low' | 'medium' | 'high';
  time: string;
  isPlaceholder: boolean;
  taskObject?: Task;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Time & Clock states (Kolkata timezone)
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Tasks States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  
  // Add Task Form Fields
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskWorkspace, setNewTaskWorkspace] = useState<'personal' | 'work'>('personal');
  const [newTaskPriority, setNewTaskPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');

  // Fitness Routine States
  const [todayWorkout, setTodayWorkout] = useState<FitnessRoutineDay | null>(null);

  // Workout Live Execution states
  const [isExecutingWorkout, setIsExecutingWorkout] = useState(false);
  const [execStartedAt, setExecStartedAt] = useState<string | null>(null);
  const [execSetsData, setExecSetsData] = useState<Record<string, { reps: string; weight: string; completed: boolean; notes: string }[]>>({});
  const [execNotes, setExecNotes] = useState('');

  // Pomodoro Focus Session states
  const [isFocusing, setIsFocusing] = useState(false);
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60); // 25 mins
  const [focusActive, setFocusActive] = useState(false);

  // Streaks & Finance States
  const [learningStreak, setLearningStreak] = useState({ current: 0, best: 0 });

  // Global loading state
  const [isLoading, setIsLoading] = useState(true);

  // Client-side dynamic clock setup (Asia/Kolkata timezone)
  useEffect(() => {
    const updateISTTime = () => {
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const now = new Date();
      
      const dateParts = dateFormatter.formatToParts(now);
      const weekday = dateParts.find(p => p.type === 'weekday')?.value || '';
      const day = dateParts.find(p => p.type === 'day')?.value || '';
      const month = dateParts.find(p => p.type === 'month')?.value || '';
      const year = dateParts.find(p => p.type === 'year')?.value || '';
      setCurrentDate(`${weekday}, ${day} ${month} ${year}`);

      // Time formatting: 08:45 PM IST
      setCurrentTime(`${timeFormatter.format(now).toUpperCase()} IST`);
    };

    updateISTTime();
    const interval = setInterval(updateISTTime, 1000); // update every second for live clock
    return () => clearInterval(interval);
  }, []);

  // Pomodoro Timer hook
  useEffect(() => {
    let timer: any;
    if (focusActive && focusTimeLeft > 0) {
      timer = setInterval(() => {
        setFocusTimeLeft(t => t - 1);
      }, 1000);
    } else if (focusTimeLeft === 0 && focusActive) {
      setFocusActive(false);
      confetti({ particleCount: 40, spread: 50 });
      alert("Focus Session Complete! Congratulations, Sir.");
      setIsFocusing(false);
      setFocusTimeLeft(25 * 60);
    }
    return () => clearInterval(timer);
  }, [focusActive, focusTimeLeft]);

  // Load user data on mount
  const loadDashboardData = async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoading(true);

    try {
      // 1. Fetch Learning Streak & Finance Monthly Saved
      const [streaks, _fitStreak, routines, _workoutSessions, _finAccounts, _finTransactions] = await Promise.all([
        dbService.getStreaks(user.id),
        dbService.getFitnessStreak(user.id),
        dbService.getFitnessRoutines(user.id),
        dbService.getFitnessWorkoutSessions(user.id),
        dbService.getFinanceAccounts(user.id),
        dbService.getFinanceTransactions(user.id)
      ]);

      setLearningStreak(streaks);

      // 2. Fetch Tasks (Work & Personal)
      const [personalTasks, workTasks] = await Promise.all([
        dbService.getTasks(user.id, 'personal'),
        dbService.getTasks(user.id, 'work')
      ]);

      const allTasks = [...personalTasks, ...workTasks];
      setTasks(allTasks);

      // 3. Process Active Fitness Routine & Today's Workout
      const active = routines.find(r => r.status === 'active') || null;

      if (active) {
        const kolkataOptions = { timeZone: 'Asia/Kolkata' };
        const localDOW = new Date(new Date().toLocaleString('en-US', kolkataOptions)).getDay();
        
        const days = await dbService.getFitnessRoutineDays(active.id);
        const dayPlan = days.find(d => d.day_of_week === localDOW) || null;
        setTodayWorkout(dayPlan);
      } else {
        setTodayWorkout(null);
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleUpdate = () => {
      loadDashboardData(true); // Silent dashboard re-fetch
    };
    window.addEventListener('life_os_data_update', handleUpdate);
    return () => window.removeEventListener('life_os_data_update', handleUpdate);
  }, [user]);

  // Today's Tasks
  const todayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
      if (t.is_completed) return false;
      const isDueToday = t.due_at && t.due_at.split('T')[0] === todayStr;
      return t.is_in_today || isDueToday;
    });
  }, [tasks]);

  const completedTodayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
      if (!t.is_completed) return false;
      const isCompletedToday = t.completed_at && t.completed_at.split('T')[0] === todayStr;
      return isCompletedToday;
    });
  }, [tasks]);

  // Fallback / Placeholder plan items to match mockup exactly
  const displayPlanItems = useMemo<PlanItem[]>(() => {
    if (todayTasks.length > 0) {
      return todayTasks.map((t, idx) => ({
        id: t.id,
        title: t.title,
        workspace: t.workspace === 'work' ? 'work' : 'personal',
        workspaceLabel: t.workspace === 'work' ? 'Skill Development' : 'Personal Growth',
        priority: t.priority as any,
        time: t.due_at 
          ? new Date(t.due_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) 
          : idx === 0 ? '09:00 AM' : idx === 1 ? '11:30 AM' : idx === 2 ? '06:30 PM' : '08:45 PM',
        isPlaceholder: false,
        taskObject: t
      }));
    }
    
    // Exact placeholder items from the screenshot
    return [
      {
        id: 'mock-1',
        title: 'Read 20 pages of a book',
        workspace: 'personal',
        workspaceLabel: 'Personal Growth',
        priority: 'none',
        time: '09:00 AM',
        isPlaceholder: true
      },
      {
        id: 'mock-2',
        title: 'DSA - Arrays Practice',
        workspace: 'work',
        workspaceLabel: 'Skill Development',
        priority: 'medium',
        time: '11:30 AM',
        isPlaceholder: true
      },
      {
        id: 'mock-3',
        title: 'Workout for 45 minutes',
        workspace: 'personal',
        workspaceLabel: 'Health',
        priority: 'high',
        time: '06:30 PM',
        isPlaceholder: true
      },
      {
        id: 'mock-4',
        title: 'Revise Kotlin - Extension Functions',
        workspace: 'work',
        workspaceLabel: 'Learning',
        priority: 'low',
        time: '08:45 PM',
        isPlaceholder: true
      }
    ];
  }, [todayTasks]);

  // Toggle tasks completion handler
  const handleToggleTaskComplete = async (itemId: string, isPlaceholder: boolean, taskObj?: Task) => {
    if (isPlaceholder) {
      // If it is the workout placeholder, trigger workout execution live mode
      if (itemId === 'mock-3') {
        handleStartWorkout();
        return;
      }
      confetti({ particleCount: 20, spread: 30 });
      alert(`Mock task completed! Setup your actual tasks in the Tasks page to unlock fully synchronized database logs.`);
      return;
    }
    
    if (!taskObj || !user) return;
    try {
      await dbService.updateTask(user.id, taskObj.id, {
        is_completed: true,
        completed_at: new Date().toISOString()
      });
      confetti({ particleCount: 20, spread: 25 });
      loadDashboardData(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    try {
      const today = new Date();
      let dueAtStr = today.toISOString().split('T')[0];
      if (newTaskDueTime) {
        dueAtStr = `${dueAtStr}T${newTaskDueTime}:00`;
      } else {
        dueAtStr = `${dueAtStr}T23:59:59`;
      }

      const created = await dbService.createTask({
        user_id: user.id,
        title: newTaskTitle.trim(),
        workspace: newTaskWorkspace,
        priority: newTaskPriority,
        due_at: dueAtStr,
        description: null,
        reminder_at: null,
        recurrence_rule: null
      });

      // Update to set in today's checklist
      await dbService.updateTask(user.id, created.id, {
        is_in_today: true
      });

      setNewTaskTitle('');
      setNewTaskDueTime('');
      setIsAddTaskOpen(false);
      loadDashboardData(true);
      confetti({ particleCount: 25, spread: 35 });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Live Workout Session Handlers
  const handleStartWorkout = () => {
    if (!todayWorkout) {
      alert("No routine workout is planned for today. Set an active routine or draft workout scheduling slots inside the Fitness Console planner tab.");
      navigate('/fitness');
      return;
    }
    
    // Prep exercise inputs
    const prefilledData: Record<string, any[]> = {};
    todayWorkout.exercises?.forEach(exe => {
      const rows = [];
      for (let s = 0; s < exe.sets; s++) {
        rows.push({
          reps: exe.reps_min.toString(),
          weight: exe.weight ? exe.weight.toString() : '0',
          completed: false,
          notes: ''
        });
      }
      prefilledData[exe.id] = rows;
    });

    setExecSetsData(prefilledData);
    setExecStartedAt(new Date().toISOString());
    setExecNotes('');
    setIsExecutingWorkout(true);
  };

  const handleSetRowChange = (exerciseId: string, setIndex: number, field: string, value: any) => {
    setExecSetsData(prev => {
      const list = [...(prev[exerciseId] || [])];
      list[setIndex] = {
        ...list[setIndex],
        [field]: value
      };
      return { ...prev, [exerciseId]: list };
    });
  };

  const handleFinishWorkout = async () => {
    if (!user || !todayWorkout || !execStartedAt) return;

    try {
      const workoutSetsPayload: any[] = [];
      
      todayWorkout.exercises?.forEach(exe => {
        const setsInput = execSetsData[exe.id] || [];
        setsInput.forEach((s, sIdx) => {
          workoutSetsPayload.push({
            exercise_id: exe.id,
            exercise_name: exe.exercise_name,
            set_number: sIdx + 1,
            target_reps: exe.reps_min,
            target_weight: exe.weight || 0,
            actual_reps: parseInt(s.reps) || 0,
            weight: parseFloat(s.weight) || 0,
            completed: s.completed,
            notes: s.notes || null
          });
        });
      });

      await dbService.createFitnessWorkoutSession(user.id, {
        user_id: user.id,
        routine_id: todayWorkout.routine_id,
        routine_day_id: todayWorkout.id,
        started_at: execStartedAt,
        completed_at: new Date().toISOString(),
        status: 'completed',
        notes: execNotes.trim() || null
      }, workoutSetsPayload);

      setIsExecutingWorkout(false);
      loadDashboardData(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error('Failed to log workout session:', err);
      alert('Failed to save completed workout details.');
    }
  };

  // Get dynamic greeting label based on hour
  const greetingText = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime]);

  const progressWeeksLabel = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in select-none px-4 md:px-8 pt-8 pb-20 text-xs font-semibold text-text-secondary">

      {/* 2. WELCOME BANNER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 select-none">
        <div className="text-left space-y-1">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            {greetingText}, {user?.display_name?.split(' ')[0] || 'Anirudh'} 👋
          </h1>
          <div className="text-[10px] uppercase font-black text-text-secondary/45 tracking-widest flex items-center gap-1.5 pt-0.5">
            <span>{currentDate || 'Sunday, 25 May 2025'}</span>
            <span className="opacity-30">•</span>
            <span className="text-accent">{currentTime || '08:45 PM IST'}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 animate-pulse">Syncing Control Center</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/MAIN DASHBOARD PANELS */}
          <div className="lg:col-span-2 space-y-8 text-left">
            
            {/* CARD: TODAY'S PLAN */}
            <div className="glass-panel p-6 rounded-3xl border border-border/10 space-y-5 bg-surface/10">
              
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">Today's Plan</span>
                  <span className="bg-accent/15 text-accent text-[9px] font-black px-1.5 py-0.5 rounded-md">
                    {todayTasks.length || 4}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate('/tasks')} 
                    className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary/50 hover:text-text-primary transition-colors flex items-center gap-0.5"
                  >
                    <span>View all tasks</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  
                  <button 
                    onClick={() => setIsAddTaskOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5">
                {displayPlanItems.map((item) => {
                  const isHigh = item.priority === 'high';
                  const isMed = item.priority === 'medium';
                  const isLow = item.priority === 'low';
                  
                  const priorityTagStyles = 
                    isHigh ? 'text-red-400 bg-red-500/10 border-red-500/10' :
                    isMed ? 'text-amber-400 bg-amber-500/10 border-amber-500/10' :
                    isLow ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' : '';

                  const workspaceColors =
                    item.workspace === 'work' ? 'border-indigo-400/30 text-indigo-400' : 'border-emerald-400/30 text-emerald-400';

                  return (
                    <div 
                      key={item.id} 
                      className="flex items-start justify-between p-4.5 bg-surface/30 border border-border/10 rounded-2xl group hover:border-border/20 transition-all cursor-pointer"
                      onClick={() => handleToggleTaskComplete(item.id, item.isPlaceholder, item.taskObject)}
                    >
                      <div className="flex items-start gap-4.5">
                        <button
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-0.5 ${workspaceColors} group-hover:bg-white/5`}
                        >
                          <Check className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-extrabold text-text-primary group-hover:text-white transition-colors leading-tight">
                            {item.title}
                          </p>
                          <p className="text-[8px] font-bold text-text-secondary/40 uppercase tracking-widest flex items-center gap-1.5">
                            {item.workspace === 'work' ? '💼' : '🏠'} {item.workspaceLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        {item.priority !== 'none' && (
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${priorityTagStyles}`}>
                            {item.priority}
                          </span>
                        )}
                        
                        <div className="w-16 text-right">
                          <span className="text-[10px] font-bold text-text-secondary/40">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* CARD: FOCUS MODE BANNER */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-accent to-[#7C3AED] p-8 border border-white/5 flex items-center justify-between min-h-[160px] group shadow-lg">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
              
              <div className="space-y-4 max-w-[60%] relative z-10">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Core Command</span>
                  <h3 className="text-2xl font-black text-white tracking-tight">FOCUS MODE</h3>
                  <p className="text-[10.5px] font-medium text-white/80 leading-normal">
                    Get in the zone. Eliminate distractions and accomplish more.
                  </p>
                </div>
                
                <button 
                  onClick={() => {
                    setIsFocusing(true);
                    setFocusActive(true);
                  }}
                  className="px-6 py-2.5 bg-white text-accent hover:bg-slate-100 hover:scale-105 active:scale-98 rounded-xl font-black uppercase text-[9.5px] tracking-wider transition-all shadow-md"
                >
                  Start Focus Session 🚀
                </button>
              </div>

              {/* Holographic Glowing Focus Radar Ring */}
              <div className="relative shrink-0 w-28 h-28 hidden md:flex items-center justify-center select-none">
                {/* Ambient Outer Aura Glow */}
                <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
                
                {/* Fine Dotted Outer Radar Orbit */}
                <div className="absolute w-24 h-24 rounded-full border border-dashed border-white/10 animate-[spin_40s_linear_infinite]" />
                
                {/* Middle Orbit with Glowing Sweeper Ring */}
                <div className="absolute w-18 h-18 rounded-full border border-white/10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-400/40 animate-[spin_6s_linear_infinite]" />
                </div>
                
                {/* Inner Frosted Glass Plate with Dotted Core & Pulsing Target Node */}
                <div className="w-13 h-13 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center relative z-10">
                  <div className="absolute inset-1.5 rounded-full border border-dashed border-purple-400/20 animate-[spin_12s_linear_infinite]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 shadow-[0_0_12px_#00f2fe] animate-pulse" />
                </div>

                {/* Subtle Cybernetic Crosshair Axes */}
                <div className="absolute top-1 bottom-1 w-[1px] bg-white/5 pointer-events-none" />
                <div className="absolute left-1 right-1 h-[1px] bg-white/5 pointer-events-none" />
              </div>
            </div>

            {/* SECTION: TODAY AT A GLANCE */}
            <div className="space-y-4 select-none">
              <h2 className="text-[10px] font-black text-text-secondary/40 uppercase tracking-widest pl-1">
                Today at a Glance
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* 1. Focus Time */}
                <div className="glass-panel p-4.5 rounded-2xl border border-border/10 space-y-3 bg-surface/10 hover:border-accent/25 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="text-[8px] font-bold text-text-secondary/50 uppercase tracking-wider">Focus Time</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-text-primary tracking-tight">3h 24m</h4>
                    <p className="text-[9px] font-bold text-text-secondary/35 uppercase tracking-widest mt-0.5">Deep Work</p>
                  </div>
                </div>

                {/* 2. Tasks Done */}
                <div className="glass-panel p-4.5 rounded-2xl border border-border/10 space-y-3 bg-surface/10 hover:border-emerald-500/25 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <span className="text-[8px] font-bold text-text-secondary/50 uppercase tracking-wider">Tasks Done</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-text-primary tracking-tight">
                      {completedTodayTasks.length || 8} <span className="text-[10px] font-bold text-text-secondary/40">of {tasks.length || 12}</span>
                    </h4>
                    <p className="text-[9px] font-bold text-text-secondary/35 uppercase tracking-widest mt-0.5">Daily checklist</p>
                  </div>
                </div>

                {/* 3. Productivity */}
                <div className="glass-panel p-4.5 rounded-2xl border border-border/10 space-y-3 bg-surface/10 hover:border-amber-500/25 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <span className="text-[8px] font-bold text-text-secondary/50 uppercase tracking-wider">Productivity</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-text-primary tracking-tight">78%</h4>
                    <p className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px] mt-0.5 inline-block">Excellent</p>
                  </div>
                </div>

                {/* 4. Streak */}
                <div className="glass-panel p-4.5 rounded-2xl border border-border/10 space-y-3 bg-surface/10 hover:border-red-500/25 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 animate-pulse">
                      <Flame className="h-4 w-4" />
                    </div>
                    <span className="text-[8px] font-bold text-text-secondary/50 uppercase tracking-wider">Active Streak</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-text-primary tracking-tight">
                      {learningStreak.current || 24} <span className="text-[10px] font-bold text-text-secondary/40">days</span>
                    </h4>
                    <p className="text-[9px] font-bold text-text-secondary/35 uppercase tracking-widest mt-0.5">Keep going!</p>
                  </div>
                </div>

              </div>
            </div>

            {/* CARD: FOCUS TIME TODAY (Line Chart) */}
            <div className="glass-panel p-5 rounded-3xl border border-border/10 space-y-4 bg-surface/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-text-secondary/50 uppercase tracking-widest">Focus Time Today</span>
                </div>
                
                <select className="bg-surface border border-border/20 rounded-xl px-2.5 py-1 text-[9px] font-bold text-text-secondary outline-none">
                  <option>By time</option>
                  <option>By category</option>
                </select>
              </div>

              {/* Line chart plotting focus hours */}
              <div className="relative bg-surface-hover/5 rounded-2xl p-4 border border-border/5 h-40">
                <svg className="w-full h-full text-accent" viewBox="0 0 500 150">
                  {/* Grid Lines */}
                  <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" />
                  <line x1="20" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.03)" />
                  <line x1="20" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.03)" />

                  {/* SMOOTH CURVE PATH */}
                  <path
                    d="M 20,130 Q 75,90 130,110 T 250,60 T 370,80 T 480,120"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Gradient shading */}
                  <path
                    d="M 20,130 Q 75,90 130,110 T 250,60 T 370,80 T 480,120 L 480,130 L 20,130 Z"
                    fill="url(#focusAreaGradient)"
                    opacity="0.1"
                  />

                  {/* Glow markers */}
                  <circle cx="250" cy="60" r="4.5" className="fill-surface stroke-accent" strokeWidth="2.5" />
                  <circle cx="370" cy="80" r="4.5" className="fill-surface stroke-accent" strokeWidth="2.5" />

                  <defs>
                    <linearGradient id="focusAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(99, 102, 241)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Date Labels */}
                <div className="absolute bottom-2 left-6 right-6 flex justify-between text-[8px] font-bold text-text-secondary/40">
                  <span>12 AM</span>
                  <span>4 AM</span>
                  <span>8 AM</span>
                  <span>12 PM</span>
                  <span>4 PM</span>
                  <span>8 PM</span>
                  <span>12 AM</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8 text-left">
            
            {/* CARD: UP NEXT */}
            <div className="glass-panel p-6 rounded-3xl border border-border/10 space-y-4.5 bg-surface/10">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-black text-text-secondary/50 uppercase tracking-widest">Up Next</span>
                <button onClick={() => navigate('/tasks')} className="text-[9px] font-extrabold uppercase tracking-wider text-accent hover:underline">
                  View all
                </button>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    title: 'Project Presentation',
                    time: 'Tomorrow, 10:00 AM',
                    icon: Briefcase,
                    color: 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                  },
                  {
                    title: 'Grocery Shopping',
                    time: 'Tomorrow, 05:00 PM',
                    icon: ShoppingBag,
                    color: 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                  },
                  {
                    title: 'Call with Mentor',
                    time: 'Tue, 27 May, 07:00 PM',
                    icon: Phone,
                    color: 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3.5 p-1 group cursor-pointer">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors leading-tight">
                          {item.title}
                        </p>
                        <p className="text-[9px] font-semibold text-text-secondary/40 mt-0.5">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD: WEEKLY PROGRESS */}
            <div className="glass-panel p-6 rounded-3xl border border-border/10 space-y-5 bg-surface/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-text-secondary/50 uppercase tracking-widest">Weekly Progress</span>
                <button onClick={() => navigate('/learning')} className="text-[9px] font-extrabold uppercase tracking-wider text-accent hover:underline">
                  View full report
                </button>
              </div>
              <p className="text-[9px] font-extrabold text-text-secondary/40 uppercase tracking-wider -mt-2">
                Week 21 · {progressWeeksLabel}
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Tasks Completed', value: '14 / 20', pct: 70, color: 'bg-accent shadow-sm shadow-accent/20' },
                  { label: 'Study Time', value: '18.5 / 25 h', pct: 74, color: 'bg-emerald-500' },
                  { label: 'Habits Score', value: '82%', pct: 82, color: 'bg-amber-500' },
                  { label: 'Focus Sessions', value: '6 / 8', pct: 75, color: 'bg-sky-500' }
                ].map((bar, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-baseline text-[10px] font-bold">
                      <span className="text-text-primary/75">{bar.label}</span>
                      <span className="font-extrabold text-text-primary">{bar.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-hover/30 rounded-full overflow-hidden">
                      <div className={`h-full ${bar.color} rounded-full transition-all duration-300`} style={{ width: `${bar.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD: DAILY MOTIVATION */}
            <div className="glass-panel p-6 rounded-3xl border border-border/10 bg-gradient-to-br from-indigo-950/20 to-purple-950/20 relative overflow-hidden flex flex-col justify-between min-h-[150px] group shadow-inner">
              <div className="absolute -top-6 -left-6 h-12 w-12 bg-accent/20 rounded-full blur-xl pointer-events-none" />
              
              <div className="space-y-3 relative z-10">
                <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-black uppercase text-[8px] tracking-widest inline-block">
                  Daily Motivation
                </span>
                
                <h4 className="text-base font-black text-white leading-snug tracking-tight">
                  "Great consistency wins more than motivation."
                </h4>
                <p className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest">
                  Keep showing up.
                </p>
              </div>

              <div className="absolute right-4 bottom-4 text-accent/25 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3a9 9 0 1 0 9 9 9.005 9.005 0 0 0-9-9zm0 16a7 7 0 1 1 7-7 7.008 7.008 0 0 1-7 7z"/>
                  <path d="M12 1a11 11 0 1 0 11 11 A11.013 11.013 0 0 0 12 1zm0 20a9 9 0 1 1 9-9 9.01 9.01 0 0 1-9 9z" opacity="0.3"/>
                </svg>
              </div>
            </div>

            {/* CARD: JARVIS INSIGHT (Re-designed Stark style) */}
            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/10 bg-[#080b11]/60 relative overflow-hidden group shadow-2xl">
              <div className="absolute -top-12 -right-12 h-32 w-32 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="flex items-center gap-3 mb-4">
                <JarvisArcReactor state="idle" size={32} />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Jarvis Insight</span>
              </div>

              <p className="text-[11px] font-bold text-slate-100 leading-relaxed mb-4">
                "Good morning, Sir. Your productivity is up <span className="text-cyan-400">12%</span> this week. I recommend tackling the PR review first while your focus levels are peak."
              </p>

              <button
                onClick={() => alert("Please use the Jarvis core at the bottom right of your screen to sync directives.")}
                className="flex items-center gap-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:gap-3 transition-all"
              >
                Sync with Jarvis <ChevronRight className="h-3 w-3" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          MODAL: ADD TASK (Premium & Clean Inline Dialog)
          ======================================================== */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in px-4 select-none">
          <div className="glass-panel p-6 rounded-3xl max-w-sm w-full border border-border/30 space-y-5 animate-scale-in text-xs text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">Quick Add Task</h3>
              <button 
                onClick={() => setIsAddTaskOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Task Title</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Review PR, Read Atomic Habits..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-hover/30 border border-border/20 text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Workspace</label>
                  <select 
                    value={newTaskWorkspace}
                    onChange={(e) => setNewTaskWorkspace(e.target.value as 'personal' | 'work')}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-hover/30 border border-border/20 text-xs text-text-primary outline-none focus:border-accent font-bold"
                  >
                    <option value="personal">🏠 Personal</option>
                    <option value="work">💼 Work</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Priority</label>
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-hover/30 border border-border/20 text-xs text-text-primary outline-none focus:border-accent font-bold"
                  >
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Due Time (Optional)</label>
                <input 
                  type="time" 
                  value={newTaskDueTime}
                  onChange={(e) => setNewTaskDueTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-hover/30 border border-border/20 text-xs text-text-primary outline-none focus:border-accent font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="flex-1 py-2.5 border border-border/30 hover:bg-surface-hover/20 text-text-secondary font-bold uppercase text-[9px] tracking-wider rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white font-black uppercase text-[9px] tracking-wider rounded-xl transition-all shadow-md"
                >
                  Create Task
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FULL SCREEN MODAL: WORKOUT LIVE EXECUTION */}
      {isExecutingWorkout && todayWorkout && (
        <div className="fixed inset-0 z-50 bg-[#070913] overflow-y-auto px-4 py-8 select-none flex justify-center items-start text-xs text-left">
          <div className="w-full max-w-2xl bg-surface border border-border/20 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl animate-scale-in">
            
            <div className="flex justify-between items-start border-b border-border/10 pb-4">
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-accent bg-accent/15 px-2 py-0.5 rounded">
                  Live Workout session
                </span>
                <h2 className="text-xl font-black text-text-primary tracking-tight mt-1">
                  {todayWorkout.body_part || 'Full Body'} Routine
                </h2>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel today's workout? No progress will be saved.")) {
                    setIsExecutingWorkout(false);
                  }
                }}
                className="p-1.5 rounded-full hover:bg-surface-hover border border-border/30 text-text-secondary hover:text-text-primary transition-all outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Checklist guidelines */}
            <div className="p-4 bg-accent/[0.02] border border-accent/10 rounded-2xl text-[11px] text-text-secondary flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="space-y-1 leading-normal">
                <p className="font-bold text-text-primary">Focused Execution Guidelines</p>
                <p>Complete exercises in order. Fill in actual reps performed and weights used. Mark sets as complete. Leave field notes to track progressions.</p>
              </div>
            </div>

            {/* Warm-up Check-list */}
            {todayWorkout.warmup_type !== 'none' && (
              <div className="p-4 bg-surface-hover/20 border border-border/10 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Warm-up checklist</h4>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  {todayWorkout.warmup_notes ? `${todayWorkout.warmup_notes}` : 'Do 5–10 minutes of arm circles, shoulder rotations, jumping jacks, and active stretches to prepare joints and target muscles.'}
                </p>
              </div>
            )}

            {/* Exercises Live Table */}
            <div className="space-y-5">
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Workout Exercises</h4>
              
              {todayWorkout.exercises?.map((exe, eIdx) => {
                const sets = execSetsData[exe.id] || [];
                return (
                  <div key={exe.id} className="p-4 bg-surface-hover/10 border border-border/10 rounded-3xl space-y-3">
                    <div className="flex justify-between items-center border-b border-border/10 pb-2">
                      <span className="text-xs font-black text-text-primary">
                        {eIdx + 1}. {exe.exercise_name}
                      </span>
                      <span className="text-[10px] font-extrabold text-accent">
                        Target: {exe.sets} × {exe.reps_min}{exe.reps_max !== exe.reps_min ? `–${exe.reps_max}` : ''} {exe.weight ? `· ${exe.weight} kg` : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-5 text-center text-[8px] font-extrabold uppercase text-text-secondary/70 tracking-wider">
                        <span>Set</span>
                        <span>Reps</span>
                        <span>Weight (kg)</span>
                        <span>Note</span>
                        <span>Done</span>
                      </div>

                      {sets.map((set, sIdx) => (
                        <div key={sIdx} className="grid grid-cols-5 items-center gap-2 text-center text-xs">
                          <span className="font-bold text-text-secondary/70">#{sIdx + 1}</span>
                          
                          <input 
                            type="number"
                            value={set.reps}
                            onChange={(e) => handleSetRowChange(exe.id, sIdx, 'reps', e.target.value)}
                            className="w-full text-center px-1 py-1 rounded bg-surface/50 border border-border/40 text-text-primary font-bold text-xs"
                          />

                          <input 
                            type="number"
                            value={set.weight}
                            onChange={(e) => handleSetRowChange(exe.id, sIdx, 'weight', e.target.value)}
                            disabled={exe.weight === null}
                            className={`w-full text-center px-1 py-1 rounded bg-surface/50 border border-border/40 text-text-primary font-bold text-xs ${exe.weight === null ? 'opacity-30 cursor-not-allowed' : ''}`}
                          />

                          <input 
                            type="text"
                            value={set.notes}
                            placeholder="notes"
                            onChange={(e) => handleSetRowChange(exe.id, sIdx, 'notes', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-surface/50 border border-border/40 text-text-primary text-[10px]"
                          />

                          <button 
                            type="button"
                            onClick={() => handleSetRowChange(exe.id, sIdx, 'completed', !set.completed)}
                            className={`mx-auto h-5 w-5 rounded-md flex items-center justify-center border transition-all ${set.completed ? 'bg-success/20 border-success text-success' : 'border-border/60 text-text-secondary/30 hover:border-accent'}`}
                          >
                            {set.completed && <Check className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stretching Check-list */}
            {todayWorkout.stretching_type !== 'none' && (
              <div className="p-4 bg-surface-hover/20 border border-border/10 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Stretching checklist</h4>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  {todayWorkout.stretching_notes ? `${todayWorkout.stretching_notes}` : 'Cool down for 5–10 minutes. Perform chest stretch, doorway shoulder stretches, and holding triceps stretch to maintain muscle fibers elasticity.'}
                </p>
              </div>
            )}

            {/* Session Notes */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Session Overall Notes</label>
              <textarea 
                value={execNotes}
                onChange={(e) => setExecNotes(e.target.value)}
                placeholder="Felt strong today. Dumbbell presses felt very stable."
                className="w-full px-3 py-2 rounded-2xl bg-surface/40 border border-border/30 text-xs text-text-primary outline-none"
                rows={2}
              />
            </div>

            {/* Submit block */}
            <div className="flex gap-4 pt-4 border-t border-border/10">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel today's workout? No progress will be saved.")) {
                    setIsExecutingWorkout(false);
                  }
                }}
                className="flex-1 py-3 border border-border/30 hover:bg-surface-hover/30 text-text-secondary font-bold uppercase text-[9px] tracking-wider rounded-xl transition-all"
              >
                Cancel Session
              </button>
              <button
                type="button"
                onClick={handleFinishWorkout}
                className="flex-1 py-3 bg-success hover:bg-success-hover text-white font-black uppercase text-[9px] tracking-wider rounded-xl transition-all shadow-lg shadow-success/15"
              >
                Complete Workout
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: FOCUS MODE TIMER COUNTDOWN */}
      {isFocusing && (
        <div className="fixed inset-0 z-[110] bg-[#070913]/95 flex items-center justify-center px-4 select-none animate-fade-in text-left">
          <div className="glass-panel p-8 rounded-[2.5rem] border border-accent/20 w-full max-w-sm text-center space-y-6 shadow-2xl relative">
            
            <button 
              onClick={() => {
                if (window.confirm("Terminate current focus session?")) {
                  setFocusActive(false);
                  setIsFocusing(false);
                  setFocusTimeLeft(25 * 60);
                }
              }}
              className="absolute top-5 right-5 p-1 rounded-lg border border-border/30 text-text-secondary hover:text-text-primary transition-all outline-none"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-black uppercase text-[8px] tracking-widest inline-block animate-pulse">
                Session Active
              </span>
              <h3 className="text-lg font-black text-text-primary uppercase tracking-wider">Focus Mode</h3>
              <p className="text-[10px] text-text-secondary/50 font-medium">Deep focus on your daily priorities.</p>
            </div>

            {/* Timer circle representation */}
            <div className="relative h-44 w-44 rounded-full border-4 border-accent/10 flex items-center justify-center mx-auto shadow-2xl">
              {focusActive && <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-10" />}
              
              <div className="text-center space-y-0.5">
                <span className="text-4xl font-black text-text-primary tracking-tight">
                  {Math.floor(focusTimeLeft / 60).toString().padStart(2, '0')}:
                  {(focusTimeLeft % 60).toString().padStart(2, '0')}
                </span>
                <p className="text-[8px] uppercase tracking-widest font-black text-text-secondary/45">Remaining</p>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex justify-center items-center gap-4 pt-2">
              <button 
                onClick={() => setFocusActive(!focusActive)}
                className={`flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-wider transition-all shadow-md ${
                  focusActive 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                    : 'bg-accent hover:bg-accent-hover text-white'
                }`}
              >
                {focusActive ? <PauseCircle className="h-4.5 w-4.5" /> : <PlayCircle className="h-4.5 w-4.5" />}
                <span>{focusActive ? 'Pause Session' : 'Resume Session'}</span>
              </button>
            </div>

            <p className="text-[9px] text-text-secondary/40 font-bold italic">
              "Discipline today, freedom tomorrow."
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
