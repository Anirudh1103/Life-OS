import React, { useState, useEffect, useMemo } from 'react';
import { dbService, type FitnessWorkoutSession, type FitnessWorkoutSet } from '../../services/supabase';
import { 
  Loader2, Dumbbell, Calendar, Clock, ChevronDown, ChevronUp, BarChart3, FileText, RefreshCw
} from 'lucide-react';

interface StrengthTrainingTabProps {
  userId: string;
}

type SubTab = 'history' | 'analytics';

export const StrengthTrainingTab: React.FC<StrengthTrainingTabProps> = ({
  userId
}) => {
  const [subTab, setSubTab] = useState<SubTab>('history');
  const [sessions, setSessions] = useState<FitnessWorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());

  // Analytics states
  const [selectedExercise, setSelectedExercise] = useState('Bench Press');
  const [exerciseHistory, setExerciseHistory] = useState<FitnessWorkoutSet[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getFitnessWorkoutSessions(userId);
      setSessions(data);
      
      // Auto expand the first session if available
      if (data.length > 0) {
        setExpandedSessionIds(new Set([data[0].id]));
      }
    } catch (err) {
      console.error('Failed to load workout sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [userId]);

  // Load selected exercise history for analytics
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedExercise) return;
      setIsLoadingHistory(true);
      try {
        const history = await dbService.getFitnessExerciseHistory(userId, selectedExercise);
        setExerciseHistory(history);
      } catch (err) {
        console.error('Failed to load exercise progression history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (subTab === 'analytics') {
      loadHistory();
    }
  }, [selectedExercise, subTab, userId]);

  // Get a unique list of exercises from sessions sets
  const uniqueExercises = useMemo(() => {
    const exerciseSet = new Set<string>();
    
    // Default common exercises to populate if empty
    const defaults = ['Bench Press', 'Squats', 'Deadlift', 'Overhead Press', 'Pull-ups', 'Barbell Row', 'Dumbbell Press'];
    defaults.forEach(d => exerciseSet.add(d));

    sessions.forEach(s => {
      s.sets?.forEach(set => {
        if (set.exercise_name) {
          // Capitalize nicely
          const name = set.exercise_name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          exerciseSet.add(name);
        }
      });
    });

    return Array.from(exerciseSet).sort();
  }, [sessions]);

  const toggleSessionExpand = (id: string) => {
    setExpandedSessionIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diffMs / 60000);
  };

  // Group sets inside session by exercise
  const getGroupedExercises = (session: FitnessWorkoutSession) => {
    const groups: Record<string, FitnessWorkoutSet[]> = {};
    session.sets?.forEach(set => {
      if (!groups[set.exercise_name]) {
        groups[set.exercise_name] = [];
      }
      groups[set.exercise_name].push(set);
    });
    return Object.entries(groups);
  };

  // Analytics Chart calculations
  const chartCoordinates = useMemo(() => {
    if (exerciseHistory.length < 2) return [];

    const width = 600;
    const height = 180;
    const padding = 20;

    const xRange = width - padding * 2;
    const yRange = height - padding * 2;

    const values = exerciseHistory.map(h => h.weight || 0);
    const minVal = Math.max(Math.min(...values) - 5, 0);
    const maxVal = Math.max(...values) + 5;
    const vDelta = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    return exerciseHistory.map((h, idx) => {
      const x = padding + (idx / (exerciseHistory.length - 1)) * xRange;
      const y = height - padding - (( (h.weight || 0) - minVal) / vDelta) * yRange;
      
      const dateLabel = (h as any).completed_at 
        ? new Date((h as any).completed_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
        : 'Session';

      return { x, y, value: h.weight, reps: h.actual_reps, date: dateLabel };
    });
  }, [exerciseHistory]);

  const analyticsStats = useMemo(() => {
    if (exerciseHistory.length === 0) return { peakWeight: 0, totalSets: 0, avgReps: 0 };
    const weights = exerciseHistory.map(h => h.weight || 0);
    const reps = exerciseHistory.map(h => h.actual_reps || 0);
    
    return {
      peakWeight: Math.max(...weights),
      totalSets: exerciseHistory.length,
      avgReps: Math.round(reps.reduce((sum, curr) => sum + curr, 0) / reps.length)
    };
  }, [exerciseHistory]);

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* Tab Switcher Navigation */}
      <div className="flex justify-between items-center border-b border-border/10 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-[9px] transition-all outline-none ${subTab === 'history' ? 'bg-accent/10 text-accent border border-accent/25' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Workout Logs History</span>
          </button>
          <button
            onClick={() => setSubTab('analytics')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-[9px] transition-all outline-none ${subTab === 'analytics' ? 'bg-accent/10 text-accent border border-accent/25' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Exercise Progression</span>
          </button>
        </div>

        {subTab === 'history' && (
          <span className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest">
            {sessions.length} sessions logged
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-secondary gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Syncing Sessions History</span>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* HISTORY LOGS SUBTAB */}
          {subTab === 'history' && (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="py-20 text-center bg-surface/10 border border-dashed border-border/20 rounded-2xl space-y-2">
                  <Dumbbell className="h-8 w-8 text-text-secondary/20 mx-auto" />
                  <p className="text-xs font-bold text-text-primary">No Workout Logs Found</p>
                  <p className="text-[10px] text-text-secondary/60 max-w-xs mx-auto">Start today's routine workout directly from the dashboard command center to log your training.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map(session => {
                    const isExpanded = expandedSessionIds.has(session.id);
                    const duration = calculateDuration(session.started_at, session.completed_at);
                    const dateFormatted = new Date(session.completed_at).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    const timeFormatted = new Date(session.completed_at).toLocaleTimeString('en-IN', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });

                    return (
                      <div 
                        key={session.id} 
                        className="glass-panel rounded-3xl border border-border/10 overflow-hidden hover:border-border/15 transition-all shadow-sm"
                      >
                        {/* Header Banner click trigger */}
                        <div 
                          onClick={() => toggleSessionExpand(session.id)}
                          className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-surface-hover/10 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <span className="text-[9px] uppercase font-black tracking-widest text-accent">
                              {session.day_workout_type || 'Strength Session'}
                            </span>
                            <h3 className="text-sm font-black text-text-primary mt-1 flex items-center gap-1.5 truncate">
                              {session.routine_name || 'Strength Workout'}
                            </h3>
                            <p className="text-[9px] font-bold text-text-secondary/50 flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              <span>{dateFormatted} · {timeFormatted}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 font-bold select-none text-[9px] uppercase text-text-secondary/60">
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3.5 w-3.5 text-text-secondary/40" />
                              <span className="text-text-primary font-black text-xs">{duration}</span> min
                            </span>
                            
                            {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                          </div>
                        </div>

                        {/* Collapsible Session Details Table */}
                        {isExpanded && (
                          <div className="border-t border-border/10 bg-surface/10 p-5 space-y-4 animate-slide-down">
                            
                            {session.notes && (
                              <div className="p-3 bg-surface-hover/20 border border-border/5 rounded-xl text-[10px] text-text-secondary flex items-start gap-2 italic">
                                <FileText className="h-3.5 w-3.5 text-accent mt-0.5 flex-shrink-0" />
                                <span>"{session.notes}"</span>
                              </div>
                            )}

                            <div className="space-y-4">
                              {getGroupedExercises(session).map(([exeName, sets]) => (
                                <div key={exeName} className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px] font-black text-text-primary uppercase tracking-wider">
                                    <span>{exeName}</span>
                                    <span className="text-[9px] font-bold text-text-secondary/50">
                                      {sets.length} sets completed
                                    </span>
                                  </div>

                                  <div className="bg-surface/30 border border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
                                    <div className="grid grid-cols-4 px-4 py-2 bg-surface-hover/20 text-center text-[8px] font-extrabold uppercase text-text-secondary/70 tracking-widest">
                                      <span>Set</span>
                                      <span>Target reps</span>
                                      <span>Actual weight</span>
                                      <span>Notes</span>
                                    </div>

                                    {sets.map(set => (
                                      <div key={set.id} className="grid grid-cols-4 px-4 py-2 text-center items-center text-xs font-semibold text-text-primary">
                                        <span className="text-text-secondary font-bold text-[10px]">#{set.set_number}</span>
                                        <span>
                                          {set.actual_reps} <span className="text-[9px] font-medium text-text-secondary/60">/ {set.planned_reps}</span>
                                        </span>
                                        <span className="font-extrabold text-accent">
                                          {set.weight ? `${set.weight} kg` : 'Bodyweight'}
                                        </span>
                                        <span className="text-[10px] text-text-secondary/60 truncate italic">{set.notes || '—'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PROGRESSION ANALYTICS SUBTAB */}
          {subTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="glass-panel p-6 rounded-3xl border border-border/10 space-y-6">
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Exercise Progression Chart</h3>
                    <p className="text-[9px] text-text-secondary/50 font-semibold uppercase">Review weights progression curves over logs history</p>
                  </div>

                  <select
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="bg-surface-hover/30 border border-border/20 rounded-xl px-3.5 py-2 text-xs font-bold text-text-primary outline-none focus:border-accent"
                  >
                    {uniqueExercises.map(exeName => (
                      <option key={exeName} value={exeName}>{exeName}</option>
                    ))}
                  </select>
                </div>

                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20 text-text-secondary gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-accent" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Retrieving sets data points</span>
                  </div>
                ) : exerciseHistory.length === 0 ? (
                  <div className="py-16 text-center bg-surface/10 rounded-2xl border border-dashed border-border/20 space-y-2">
                    <Dumbbell className="h-7 w-7 text-text-secondary/20 mx-auto animate-pulse" />
                    <p className="text-xs font-bold text-text-primary">No Data Points For This Exercise</p>
                    <p className="text-[9px] text-text-secondary/50 max-w-xs mx-auto">Log this exercise inside workout sessions to start generating progression curve graphs.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* SVG Progression Chart */}
                    <div className="w-full overflow-x-auto pb-2">
                      <div className="min-w-[620px] h-[190px] relative">
                        <svg className="w-full h-full" viewBox="0 0 600 180">
                          <defs>
                            <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid lines */}
                          <line x1="20" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="20" y1="90" x2="580" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="20" y1="160" x2="580" y2="160" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                          {/* Gradient Area fill */}
                          {chartCoordinates.length >= 2 && (
                            <path 
                              d={`
                                M ${chartCoordinates[0].x} 160 
                                L ${chartCoordinates.map(c => `${c.x} ${c.y}`).join(' L ')} 
                                L ${chartCoordinates[chartCoordinates.length - 1].x} 160 Z
                              `}
                              fill="url(#analyticsGrad)"
                            />
                          )}

                          {/* Main Plot line */}
                          {chartCoordinates.length >= 2 && (
                            <path 
                              d={chartCoordinates.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')}
                              fill="none"
                              stroke="rgb(168, 85, 247)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Data points dots */}
                          {chartCoordinates.map((c, i) => (
                            <g key={i} className="group/dot cursor-pointer">
                              <circle 
                                cx={c.x} 
                                cy={c.y} 
                                r="4" 
                                className="fill-purple-500 stroke-background stroke-2 transition-all hover:r-6"
                              />
                              
                              {/* Inline weight/reps details */}
                              <text 
                                x={c.x} 
                                y={c.y - 10} 
                                textAnchor="middle" 
                                className="text-[8px] font-black fill-text-primary bg-background select-none pointer-events-none opacity-60 hover:opacity-100 transition-opacity"
                              >
                                {c.value}kg
                              </text>

                              {/* X Axis Label */}
                              <text
                                x={c.x}
                                y="175"
                                textAnchor="middle"
                                className="text-[7px] font-bold fill-text-secondary/40 select-none pointer-events-none"
                              >
                                {c.date}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>

                    {/* Stats metrics highlights */}
                    <div className="grid grid-cols-3 gap-4 border-t border-border/10 pt-5 text-center">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-text-secondary/50 tracking-wider">Peak Weight</p>
                        <p className="text-sm font-black text-text-primary mt-1">
                          {analyticsStats.peakWeight} <span className="text-[10px] font-semibold text-text-secondary/60">kg</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-text-secondary/50 tracking-wider">Average Reps</p>
                        <p className="text-sm font-black text-text-primary mt-1">
                          {analyticsStats.avgReps} <span className="text-[10px] font-semibold text-text-secondary/60">reps</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-text-secondary/50 tracking-wider">Total sets tracked</p>
                        <p className="text-sm font-black text-text-primary mt-1">
                          {analyticsStats.totalSets} <span className="text-[10px] font-semibold text-text-secondary/60">sets</span>
                        </p>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
