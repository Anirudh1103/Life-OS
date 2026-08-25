import React, { useMemo } from 'react';
import { type FitnessActivity } from '../../services/supabase';
import { Flame, Dumbbell, Activity, Waves, Timer, Footprints, Sparkles, Trophy, Calendar as CalendarIcon, ArrowRight, Clock, ChevronRight } from 'lucide-react';

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
  onActivitySelect
}) => {
  
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

    const caloriesBurned = weekActivities.reduce((sum, act) => sum + (act.calories || 0), 0);

    return {
      count: weekActivities.length,
      calories: caloriesBurned,
      activitiesList: weekActivities,
      monday,
      sunday
    };
  }, [activities]);

  // 2. Calculate active month totals
  const currentMonthStats = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthActivities = activities.filter(act => {
      const d = new Date(act.started_at);
      return d >= firstDay && d <= lastDay;
    });

    return {
      count: monthActivities.length
    };
  }, [activities]);

  // 3. Activity Overview Grouping (Total workouts & durations per type)
  const overviewStats = useMemo(() => {
    const stats: Record<string, { count: number; duration: number; icon: any; colorClass: string; bgClass: string; slug: string }> = {
      'Strength Training': { count: 0, duration: 0, icon: Dumbbell, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10 border-purple-500/15', slug: 'strength_training' },
      'Badminton': { count: 0, duration: 0, icon: Activity, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/15', slug: 'badminton' },
      'Swimming': { count: 0, duration: 0, icon: Waves, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10 border-blue-500/15', slug: 'swimming' },
      'Running': { count: 0, duration: 0, icon: Timer, colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10 border-orange-500/15', slug: 'running' },
      'Walking': { count: 0, duration: 0, icon: Footprints, colorClass: 'text-teal-400', bgClass: 'bg-teal-500/10 border-teal-500/15', slug: 'walking' },
      'Yoga': { count: 0, duration: 0, icon: Sparkles, colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/15', slug: 'yoga' }
    };

    activities.forEach(act => {
      const typeName = act.activity_type?.name || 'Unknown';
      if (stats[typeName]) {
        stats[typeName].count++;
        stats[typeName].duration += act.duration_minutes;
      }
    });

    return Object.entries(stats).map(([name, val]) => ({
      name,
      ...val
    }));
  }, [activities]);

  // 4. Weekly Calorie Bars calculations (Mon-Sun)
  const calorieWeeklyData = useMemo(() => {
    const data = Array(7).fill(0); // Mon=0, Tue=1 ... Sun=6
    // const monday = new Date(currentWeekStats.monday);
    
    currentWeekStats.activitiesList.forEach(act => {
      const d = new Date(act.started_at);
      let dayIdx = d.getDay() - 1; // getDay() is 0=Sun, 1=Mon...
      if (dayIdx === -1) dayIdx = 6; // Sunday index correction to 6
      data[dayIdx] += (act.calories || 0);
    });

    const maxCal = Math.max(...data, 500); // Normalize scale

    return data.map((cal, idx) => {
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      return {
        label: days[idx],
        value: cal,
        percentage: (cal / maxCal) * 100
      };
    });
  }, [currentWeekStats]);

  // 5. Mon-Sun active status highlights
  const weeklyTracker = useMemo(() => {
    const tracker = Array(7).fill(null).map((_, idx) => ({
      dayNum: idx + 1, // Mon=1 ... Sun=7(represented by 0 in getDay())
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx],
      activities: [] as FitnessActivity[],
      isPast: false
    }));

    const today = new Date();
    // const todayDayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const currentWeekMonday = new Date(currentWeekStats.monday);

    tracker.forEach((t, idx) => {
      const targetDate = new Date(currentWeekMonday);
      targetDate.setDate(currentWeekMonday.getDate() + idx);
      targetDate.setHours(0, 0, 0, 0);

      // Check if it is past or today
      t.isPast = targetDate <= today;

      // Filter activities for this day
      t.activities = currentWeekStats.activitiesList.filter(act => {
        const ad = new Date(act.started_at);
        ad.setHours(0, 0, 0, 0);
        return ad.getTime() === targetDate.getTime();
      });
    });

    return tracker;
  }, [currentWeekStats]);

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

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* 1. TOP CARDS STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Fitness Streak */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 select-none border border-border/10 shadow-sm shadow-accent/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider">Fitness Streak</p>
              <h3 className="text-2xl font-black text-text-primary mt-1.5 flex items-baseline gap-1">
                <span>{streak.current}</span>
                <span className="text-xs font-semibold text-text-secondary">days</span>
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/15 flex items-center justify-center shadow-inner shadow-orange-500/5 animate-pulse">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-4">
            <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/15 rounded px-1.5 py-0.5">
              Best: {streak.best} days
            </span>
            {/* Sparkline curve */}
            <svg className="w-18 h-7 text-orange-500/80 shrink-0" viewBox="0 0 100 30" fill="none">
              <path
                d="M 0,25 C 20,28 35,10 50,20 C 65,30 80,5 100,2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 0,25 C 20,28 35,10 50,20 C 65,30 80,5 100,2 L 100,30 L 0,30 Z"
                fill="url(#streakGradient)"
                opacity="0.1"
              />
              <defs>
                <linearGradient id="streakGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(249, 115, 22)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Workouts This Week */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 border border-border/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider">This Week</p>
              <h3 className="text-2xl font-black text-text-primary mt-1.5 flex items-baseline gap-1">
                <span>{currentWeekStats.count}</span>
                <span className="text-xs font-semibold text-text-secondary">workouts</span>
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/15 flex items-center justify-center">
              <Trophy className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-text-secondary/80">
              <span>Goal: 5</span>
              <span>{Math.round((currentWeekStats.count / 5) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-hover/30 border border-border/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((currentWeekStats.count / 5) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Workouts This Month */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 border border-border/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider">This Month</p>
              <h3 className="text-2xl font-black text-text-primary mt-1.5 flex items-baseline gap-1">
                <span>{currentMonthStats.count}</span>
                <span className="text-xs font-semibold text-text-secondary">workouts</span>
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center justify-center">
              <CalendarIcon className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-text-secondary/80">
              <span>Goal: 20</span>
              <span>{Math.round((currentMonthStats.count / 20) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-hover/30 border border-border/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((currentMonthStats.count / 20) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Calories Burned */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-32 border border-border/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider">Calories</p>
              <h3 className="text-2xl font-black text-text-primary mt-1.5 flex items-baseline gap-1">
                <span>{currentWeekStats.calories.toLocaleString()}</span>
                <span className="text-xs font-semibold text-text-secondary">burned</span>
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center justify-center">
              <Flame className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Mini Bar Chart */}
          <div className="flex items-end justify-between gap-1 h-8 px-1">
            {calorieWeeklyData.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full bg-surface-hover/40 border border-border/5 rounded-sm h-7 flex items-end">
                  <div 
                    className="w-full bg-emerald-500 rounded-sm min-h-[2px] transition-all duration-500" 
                    style={{ height: `${day.percentage}%` }}
                  />
                </div>
                <span className="text-[8px] font-bold text-text-secondary/50 group-hover:text-text-primary transition-colors">{day.label}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-surface border border-border/20 px-2 py-0.5 rounded text-[8px] font-bold text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">
                  {day.value} kcal
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 2. MIDDLE PANELS: ACTIVITY OVERVIEW & WEEKLY CALENDAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Activity Overview Grid (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4 border border-border/10">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Activity Overview</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {overviewStats.map(stat => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={stat.name} 
                    className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/10 flex items-center gap-3.5 hover:border-border/20 transition-all select-none"
                  >
                    <div className={`h-10 w-10 rounded-xl ${stat.bgClass} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${stat.colorClass}`} />
                    </div>
                    
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] font-extrabold text-text-primary truncate">{stat.name}</p>
                      <p className="text-[9px] font-bold text-text-secondary/70">
                        {stat.count} {stat.count === 1 ? 'workout' : 'workouts'}
                      </p>
                      <p className="text-[8px] font-bold text-text-secondary/40 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>
                          {Math.floor(stat.duration / 60)}h {stat.duration % 60}m
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Active Calendar tracker */}
        <div className="glass-panel p-5 rounded-2xl border border-border/10 flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Weekly Activity</h3>
          
          <div className="grid grid-cols-7 gap-1 text-center py-2">
            {weeklyTracker.map(day => {
              const isActive = day.activities.length > 0;
              const isWeekend = day.dayNum === 6 || day.dayNum === 7;
              
              // Get dominant activity color
              let color = 'bg-surface-hover/20 text-text-secondary/30 border border-border/5';
              let label = 'Rest';
              
              if (isActive) {
                const dominantSlug = day.activities[0].activity_type?.slug;
                label = day.activities[0].activity_type?.name.split(' ')[0] || 'Active';
                if (dominantSlug === 'strength_training') color = 'bg-purple-500/25 border border-purple-500/40 text-purple-300';
                else if (dominantSlug === 'badminton') color = 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300';
                else if (dominantSlug === 'swimming') color = 'bg-blue-500/25 border border-blue-500/40 text-blue-300';
                else if (dominantSlug === 'running') color = 'bg-orange-500/25 border border-orange-500/40 text-orange-300';
                else if (dominantSlug === 'walking') color = 'bg-teal-500/25 border border-teal-500/40 text-teal-300';
                else if (dominantSlug === 'yoga') color = 'bg-indigo-500/25 border border-indigo-500/40 text-indigo-300';
              } else if (day.isPast && !isWeekend) {
                // Missed weekday
                color = 'bg-red-500/10 border border-red-500/20 text-red-400';
                label = 'Missed';
              } else if (isWeekend) {
                color = 'bg-surface-hover/10 text-text-secondary/20 border border-border/5';
                label = 'Rest';
              }

              return (
                <div key={day.dayNum} className="flex flex-col items-center gap-2 relative group">
                  <span className="text-[9px] font-bold text-text-secondary/50 uppercase">{day.label}</span>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${color}`}>
                    {isActive ? '●' : '○'}
                  </div>
                  
                  {/* Tooltip for day */}
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-surface border border-border/20 px-2 py-0.5 rounded text-[8px] font-bold text-text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center text-[8px] font-bold text-text-secondary/50 border-t border-border/10 pt-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-surface-hover/20 border border-border/10" /> Optional
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500/20 border border-red-500/30" /> Missed Weekday
            </span>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM PANEL: RECENT WORKOUTS SECTION */}
      <div className="glass-panel p-5 rounded-2xl border border-border/10 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Recent Workouts</h3>
          <button
            onClick={onViewAllClick}
            className="text-[10px] font-bold text-accent hover:text-accent-hover uppercase tracking-wider flex items-center gap-1 transition-colors outline-none"
          >
            <span>View All Workouts</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="border border-dashed border-border/20 rounded-xl p-8 text-center text-text-secondary/50 font-bold select-none">
            <p>No activity records logged yet.</p>
            <button
              onClick={onLogActivityClick}
              className="mt-3 text-[10px] font-bold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg transition-all"
            >
              + Log First Activity
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {activities.slice(0, 4).map(act => {
              const isToday = new Date(act.started_at).toDateString() === new Date().toDateString();
              const isYesterday = new Date(act.started_at).toDateString() === new Date(Date.now() - 86400000).toDateString();
              
              let dateLabel = new Date(act.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              if (isToday) dateLabel = 'Today';
              if (isYesterday) dateLabel = 'Yesterday';

              const timeStr = new Date(act.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

              const style = getAccentStyles(act.activity_type?.slug);

              return (
                <div 
                  key={act.id} 
                  onClick={() => onActivitySelect(act.id)}
                  className="flex items-center justify-between py-3 hover:bg-surface-hover/20 px-2 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`h-9 w-9 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center shrink-0`}>
                      {act.activity_type?.slug === 'strength_training' && <Dumbbell className={`h-4.5 w-4.5 ${style.text}`} />}
                      {act.activity_type?.slug === 'badminton' && <Activity className={`h-4.5 w-4.5 ${style.text}`} />}
                      {act.activity_type?.slug === 'swimming' && <Waves className={`h-4.5 w-4.5 ${style.text}`} />}
                      {act.activity_type?.slug === 'running' && <Timer className={`h-4.5 w-4.5 ${style.text}`} />}
                      {act.activity_type?.slug === 'walking' && <Footprints className={`h-4.5 w-4.5 ${style.text}`} />}
                      {act.activity_type?.slug === 'yoga' && <Sparkles className={`h-4.5 w-4.5 ${style.text}`} />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-text-primary">{act.notes ? act.notes.split('\n')[0] : act.activity_type?.name}</p>
                      <p className="text-[9px] font-bold text-text-secondary/50 mt-0.5">
                        {act.activity_type?.name} · {dateLabel} · {timeStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-black text-text-primary">{act.duration_minutes} min</p>
                      <p className="text-[9px] font-bold text-text-secondary/50 mt-0.5">
                        {act.calories ? `${act.calories} kcal` : '—'}
                      </p>
                    </div>
                    <ChevronRight className="h-4.5 w-4.5 text-text-secondary/30 group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
