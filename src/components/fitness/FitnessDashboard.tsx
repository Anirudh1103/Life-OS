import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { type FitnessActivity } from '../../services/supabase';
import { JarvisArcReactor } from '../jarvis/JarvisArcReactor';
import { FitnessPlanner } from './FitnessPlanner';
import { WeightChart } from './WeightChart';
import { 
  Flame, Trophy, Dumbbell, Activity, Waves, Timer, 
  Footprints, Sparkles, ChevronRight
} from 'lucide-react';

interface FitnessDashboardProps {
  activities: FitnessActivity[];
  streak: { current: number; best: number };
  onLogActivityClick: () => void;
  onViewAllClick: () => void;
  onActivitySelect: (id: string) => void;
}

export const FitnessDashboard: React.FC<FitnessDashboardProps> = ({
  activities,
  streak,
  onLogActivityClick,
  onViewAllClick,
  onActivitySelect: _onActivitySelect
}) => {
  // Weight states for dynamic chart updates
  const [weightLogs, setWeightLogs] = useState<number[]>([75.8, 75.4, 75.6, 75.1, 75.3, 74.9, 75.4]);
  const [currentWeight, setCurrentWeight] = useState(75.4);

  const handleLogWeight = (newWeight: number) => {
    setCurrentWeight(newWeight);
    setWeightLogs(prev => [...prev.slice(1), newWeight]);
  };

  // 1. Calculate active week totals (Mon-Sun)
  const currentWeekStats = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekActivities = activities.filter(act => {
      const d = new Date(act.started_at);
      return d >= monday && d <= sunday;
    });

    const totalDuration = weekActivities.reduce((sum, act) => sum + (act.duration_minutes || 0), 0);

    return {
      count: weekActivities.length,
      duration: totalDuration,
      activitiesList: weekActivities,
      monday,
      sunday
    };
  }, [activities]);

  // 2. Monthly Target Workouts
  const monthlyGoal = 20;
  const currentMonthCount = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    return activities.filter(act => {
      const d = new Date(act.started_at);
      return d >= firstDay && d <= lastDay;
    }).length;
  }, [activities]);

  // Progress percentage for target ring
  const monthPercentage = Math.min(100, Math.round((currentMonthCount / monthlyGoal) * 100));

  // 3. Activity Overview stats (Strength, Badminton, Swimming, Running, Walking, Yoga)
  const overviewStats = useMemo(() => {
    const stats: Record<string, { count: number; duration: number; icon: any; colorClass: string; bgClass: string; hoverClass: string }> = {
      'Strength Training': { count: 0, duration: 0, icon: Dumbbell, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10 border-purple-500/15', hoverClass: 'hover:border-purple-500/35 hover:shadow-[0_0_15px_rgba(168,85,247,0.06)]' },
      'Badminton': { count: 0, duration: 0, icon: Activity, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/15', hoverClass: 'hover:border-emerald-500/35 hover:shadow-[0_0_15px_rgba(16,185,129,0.06)]' },
      'Swimming': { count: 0, duration: 0, icon: Waves, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10 border-blue-500/15', hoverClass: 'hover:border-blue-500/35 hover:shadow-[0_0_15px_rgba(59,130,246,0.06)]' },
      'Running': { count: 0, duration: 0, icon: Timer, colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10 border-orange-500/15', hoverClass: 'hover:border-orange-500/35 hover:shadow-[0_0_15px_rgba(249,115,22,0.06)]' },
      'Walking': { count: 0, duration: 0, icon: Footprints, colorClass: 'text-teal-400', bgClass: 'bg-teal-500/10 border-teal-500/15', hoverClass: 'hover:border-teal-500/35 hover:shadow-[0_0_15px_rgba(20,184,166,0.06)]' },
      'Yoga': { count: 0, duration: 0, icon: Sparkles, colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/15', hoverClass: 'hover:border-indigo-500/35 hover:shadow-[0_0_15px_rgba(99,102,241,0.06)]' }
    };

    activities.forEach(act => {
      const typeName = act.activity_type?.name || 'Unknown';
      if (stats[typeName]) {
        stats[typeName].count++;
        stats[typeName].duration += (act.duration_minutes || 0);
      }
    });

    return Object.entries(stats).map(([name, val]) => ({
      name,
      ...val
    }));
  }, [activities]);

  // 4. Calculate dynamic active days of the week (Mon=1, Tue=2 ... Sun=0)
  const weeklyDayActivityStatus = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    // Create dates array for this week
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + distanceToMonday + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const activeDOW = new Set<string>();
    currentWeekStats.activitiesList.forEach(act => {
      const dStr = new Date(act.started_at).toDateString();
      activeDOW.add(dStr);
    });

    const nowTime = new Date();
    nowTime.setHours(23, 59, 59, 999);

    return weekDates.map((date, idx) => {
      const dStr = date.toDateString();
      const isActive = activeDOW.has(dStr);
      const isPast = date.getTime() < nowTime.getTime();

      let status: 'active' | 'missed' | 'optional' = 'optional';
      if (isActive) status = 'active';
      else if (isPast) status = 'missed';

      const label = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][idx];
      return { label, status };
    });
  }, [currentWeekStats, activities]);

  // Container motion presets
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left select-none pb-20"
    >
      
      {/* LEFT/MAIN GRID COLUMN (width 2/3) */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Row 1: Routine Planner Capsule */}
        <motion.div variants={itemVariants}>
          <FitnessPlanner 
            onLogWeight={handleLogWeight}
            currentWeight={currentWeight}
          />
        </motion.div>

        {/* Row 2: Stats Indicator Cards Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card A: Fitness Streak */}
          <div className="glass-panel p-5.5 rounded-3xl border border-white/[0.08] bg-white/[0.01] flex flex-col justify-between hover:border-orange-500/35 hover:shadow-[0_0_25px_rgba(249,115,22,0.08)] transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-text-secondary/40 uppercase tracking-widest">Fitness Streak</span>
              <div className="h-7 w-7 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 animate-pulse">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
                {streak.current || 0} <span className="text-[10px] text-text-secondary/50 font-bold uppercase tracking-wider">days</span>
              </h3>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[8px] bg-orange-500/10 text-orange-400 font-black px-1.5 py-0.5 rounded border border-orange-500/10 uppercase tracking-wider">
                  Best: {streak.best || 20} days
                </span>
              </div>
            </div>
          </div>

          {/* Card B: This Week Workouts */}
          <div className="glass-panel p-5.5 rounded-3xl border border-white/[0.08] bg-white/[0.01] flex flex-col justify-between hover:border-purple-500/35 hover:shadow-[0_0_25px_rgba(168,85,247,0.08)] transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-text-secondary/40 uppercase tracking-widest">This Week Workouts</span>
              <div className="h-7 w-7 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
                {currentWeekStats.count || 0} <span className="text-[10px] text-text-secondary/50 font-bold uppercase tracking-wider">workouts</span>
              </h3>
              
              {/* Progress Goal bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-bold text-text-secondary/40">
                  <span>Goal: 5</span>
                  <span>{Math.round((currentWeekStats.count / 5) * 100)}%</span>
                </div>
                <div className="h-1 w-full bg-surface-hover/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (currentWeekStats.count / 5) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Monthly Goal Target Ring */}
          <div className="glass-panel p-5.5 rounded-3xl border border-accent/40 bg-white/[0.02] shadow-[0_0_25px_rgba(99,102,241,0.12)] flex flex-col justify-between relative overflow-hidden hover:border-accent/60 hover:shadow-[0_0_35px_rgba(99,102,241,0.2)] transition-all duration-300 group">
            
            <div className="flex items-center gap-3">
              {/* Circular Target Ring Indicator */}
              <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Outer rail */}
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                  {/* Animated path */}
                  <motion.circle 
                    cx="18" cy="18" r="16" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="3" 
                    strokeDasharray="100"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - monthPercentage }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-indigo-400">
                  {monthPercentage}%
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Monthly Goal: {monthlyGoal}</h4>
                <p className="text-[9px] text-text-secondary/50 font-bold mt-0.5">
                  {currentMonthCount} / {monthlyGoal} complete
                </p>
              </div>
            </div>

            {/* Action buttons trigger */}
            <button
              onClick={onLogActivityClick}
              className="w-full mt-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:scale-98 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-500/10"
            >
              Log Today's Workout
            </button>

          </div>

        </motion.div>

        {/* Row 3: Activity Overview grid */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-text-secondary/40 uppercase tracking-widest">Activity Overview</span>
            <button 
              onClick={onViewAllClick}
              className="text-[9.5px] font-black uppercase tracking-wider text-accent hover:underline flex items-center gap-0.5"
            >
              <span>View History</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {overviewStats.map((tile) => {
              const TileIcon = tile.icon;
              return (
                <div 
                  key={tile.name}
                  onClick={() => alert(`Showing history reports for ${tile.name}.`)}
                  className={`glass-panel p-4 rounded-2xl border border-white/[0.08] bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer flex items-center gap-3 transition-all duration-300 ${tile.hoverClass} group`}
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${tile.bgClass}`}>
                    <TileIcon className={`h-4 w-4 ${tile.colorClass} group-hover:scale-110 transition-transform`} />
                  </div>
                  
                  <div className="space-y-0.5 text-left">
                    <p className="text-[10px] font-bold text-white leading-tight">{tile.name}</p>
                    <p className="text-[8px] text-text-secondary/40 font-black uppercase tracking-widest mt-0.5">
                      {tile.count} {tile.count === 1 ? 'session' : 'sessions'} &middot; {Math.round(tile.duration / 60)}h
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>

      {/* RIGHT GRID COLUMN (width 1/3) */}
      <div className="space-y-8">
        
        {/* Row 1: Area weight chart */}
        <motion.div variants={itemVariants}>
          <WeightChart weights={weightLogs} />
        </motion.div>

        {/* Row 2: Weekly Activity tracker */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl border border-white/[0.08] bg-white/[0.01] hover:border-accent/35 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] transition-all duration-300 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Weekly Activity</span>
          </div>

          {/* DOW circle status markers row */}
          <div className="flex justify-between items-center py-2">
            {weeklyDayActivityStatus.map((day, idx) => {
              const isActive = day.status === 'active';
              const isMissed = day.status === 'missed';
              
              const statusColor = 
                isActive ? 'bg-success/20 border-success text-success' :
                isMissed ? 'bg-rose-500/10 border-rose-500/20 text-rose-400/50' :
                'bg-surface-hover/20 border-border/10 text-text-secondary/20';

              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-[8px] font-black text-text-secondary/40 tracking-wider">
                    {day.label}
                  </span>
                  
                  <div 
                    className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${statusColor}`}
                    title={day.status}
                  >
                    {isActive ? '✓' : isMissed ? '✕' : '○'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend switchers */}
          <div className="flex gap-4 justify-center text-[8px] font-black uppercase tracking-wider text-text-secondary/40 border-t border-border/10 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-hover border border-border/20" />
              <span>Optional</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Missed</span>
            </div>
          </div>
        </motion.div>

        {/* Row 3: Siri Jarvis Orb animated Sphere */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl border border-white/[0.08] bg-white/[0.01] hover:border-accent/35 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle details */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[8px] font-black text-text-secondary/40 uppercase tracking-widest">Neural assistant console</span>
          </div>

          <JarvisArcReactor size={80} />

          <p className="text-[10px] text-text-secondary/50 font-bold leading-relaxed max-w-[85%] mt-2">
            Your assistant JARVIS can plan, log, and remind you. Click on the orb to activate voice commands.
          </p>
        </motion.div>

      </div>

    </motion.div>
  );
};
