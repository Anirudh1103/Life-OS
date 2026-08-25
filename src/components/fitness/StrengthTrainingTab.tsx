import React, { useState, useEffect, useMemo } from 'react';
import { dbService, type StrengthPlan, type StrengthSessionSet, type StrengthPlanExercise } from '../../services/supabase';
import { Loader2, BarChart3, Play, CheckCircle2, Plus, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StrengthTrainingTabProps {
  userId: string;
  onRefreshActivities: () => void;
}

export const StrengthTrainingTab: React.FC<StrengthTrainingTabProps> = ({
  userId,
  onRefreshActivities
}) => {
  const [plans, setPlans] = useState<StrengthPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<StrengthPlan | null>(null);
  
  // Live Workout Session Tracking state
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<string | null>(null);
  const [workoutSets, setWorkoutSets] = useState<Record<string, { reps: string; weight: string; rpe: string; notes: string }[]>>({});
  const [workoutSessionNotes, setWorkoutSessionNotes] = useState('');
  const [completingWorkout, setCompletingWorkout] = useState(false);

  // Exercise progression analytics
  const [selectedExerciseName, setSelectedExerciseName] = useState('Dumbbell Bench Press');
  const [exerciseHistory, setExerciseHistory] = useState<StrengthSessionSet[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Plan Creator/Editor states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StrengthPlan | null>(null); // Null means creating new plan
  const [planFormName, setPlanFormName] = useState('');
  const [planFormDesc, setPlanFormDesc] = useState('');
  const [planFormExercises, setPlanFormExercises] = useState<{ exercise_name: string; target_sets: number; target_reps: number; target_weight: number | null; notes: string | null }[]>([]);
  const [planSubmitting, setPlanSubmitting] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await dbService.getStrengthPlans(userId);
      setPlans(data);
      if (data.length > 0) {
        // Preserving selection if possible
        if (selectedPlan) {
          const matched = data.find(p => p.id === selectedPlan.id);
          setSelectedPlan(matched || data[0]);
        } else {
          setSelectedPlan(data[0]);
          if (data[0].exercises && data[0].exercises.length > 0) {
            setSelectedExerciseName(data[0].exercises[0].exercise_name);
          }
        }
      } else {
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error('Failed to load strength plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [userId]);

  // Fetch history when exercise selection changes
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedExerciseName) return;
      setLoadingHistory(true);
      try {
        const history = await dbService.getStrengthExerciseHistory(userId, selectedExerciseName);
        setExerciseHistory(history);
      } catch (err) {
        console.error('Failed to load exercise history', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [selectedExerciseName, userId]);

  // Initializing workout sets when session starts
  const startWorkout = () => {
    if (!selectedPlan || !selectedPlan.exercises) return;
    
    const initialSets: Record<string, { reps: string; weight: string; rpe: string; notes: string }[]> = {};
    selectedPlan.exercises.forEach(exe => {
      initialSets[exe.exercise_name] = Array(exe.target_sets).fill(null).map(() => ({
        reps: exe.target_reps.toString(),
        weight: exe.target_weight ? exe.target_weight.toString() : '0',
        rpe: '8',
        notes: ''
      }));
    });

    setWorkoutSets(initialSets);
    setWorkoutSessionNotes('');
    setWorkoutStartTime(new Date().toISOString());
    setIsWorkoutActive(true);
  };

  const cancelWorkout = () => {
    if (window.confirm('Cancel this active workout? All logged sets will be lost.')) {
      setIsWorkoutActive(false);
      setWorkoutStartTime(null);
    }
  };

  const completeWorkout = async () => {
    if (!selectedPlan || !workoutStartTime) return;
    setCompletingWorkout(true);
    try {
      const completedAt = new Date().toISOString();
      const payloadSets: Omit<StrengthSessionSet, 'id' | 'session_id' | 'completed_at'>[] = [];

      Object.entries(workoutSets).forEach(([exeName, sets]) => {
        sets.forEach((set, idx) => {
          payloadSets.push({
            exercise_name: exeName,
            set_number: idx + 1,
            reps: parseInt(set.reps) || 0,
            weight: parseFloat(set.weight) || 0,
            rpe: set.rpe ? parseInt(set.rpe) : null,
            notes: set.notes.trim() || null
          });
        });
      });

      await dbService.createStrengthSession(
        userId,
        selectedPlan.id,
        workoutStartTime,
        completedAt,
        workoutSessionNotes,
        payloadSets
      );

      // Trigger Confetti!
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.65 }
      });

      setIsWorkoutActive(false);
      setWorkoutStartTime(null);
      onRefreshActivities();
      // Reload history if the current selected exercise was in the workout
      if (workoutSets[selectedExerciseName]) {
        const history = await dbService.getStrengthExerciseHistory(userId, selectedExerciseName);
        setExerciseHistory(history);
      }
    } catch (err) {
      console.error('Failed to log strength session', err);
    } finally {
      setCompletingWorkout(false);
    }
  };

  const handleSetChange = (exeName: string, setIdx: number, field: string, value: string) => {
    setWorkoutSets(prev => {
      const copy = { ...prev };
      const sets = [...copy[exeName]];
      sets[setIdx] = {
        ...sets[setIdx],
        [field]: value
      };
      copy[exeName] = sets;
      return copy;
    });
  };

  // Plan CRUD Actions inside Component UI
  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanFormName('');
    setPlanFormDesc('');
    setPlanFormExercises([
      { exercise_name: 'Dumbbell Bench Press', target_sets: 4, target_reps: 10, target_weight: 20, notes: '' }
    ]);
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = () => {
    if (!selectedPlan) return;
    setEditingPlan(selectedPlan);
    setPlanFormName(selectedPlan.name);
    setPlanFormDesc(selectedPlan.description || '');
    setPlanFormExercises((selectedPlan.exercises || []).map(e => ({
      exercise_name: e.exercise_name,
      target_sets: e.target_sets,
      target_reps: e.target_reps,
      target_weight: e.target_weight,
      notes: e.notes || ''
    })));
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormName.trim()) return;
    setPlanSubmitting(true);

    const exercisePayload: Omit<StrengthPlanExercise, 'id' | 'plan_id' | 'created_at' | 'updated_at'>[] = 
      planFormExercises.map((exe, idx) => ({
        exercise_name: exe.exercise_name,
        target_sets: exe.target_sets,
        target_reps: exe.target_reps,
        target_weight: exe.target_weight,
        notes: exe.notes || null,
        sort_order: idx,
        muscle_group: null,
        rest_seconds: 90
      }));

    try {
      if (editingPlan) {
        // Editing existing plan
        const updated = await dbService.updateStrengthPlan(
          userId,
          editingPlan.id,
          planFormName.trim(),
          planFormDesc.trim(),
          exercisePayload
        );
        // Refresh plans list
        const data = await dbService.getStrengthPlans(userId);
        setPlans(data);
        const match = data.find(p => p.id === updated.id);
        if (match) setSelectedPlan(match);
      } else {
        // Creating new plan
        const created = await dbService.createStrengthPlan(
          userId,
          planFormName.trim(),
          planFormDesc.trim(),
          exercisePayload
        );
        const data = await dbService.getStrengthPlans(userId);
        setPlans(data);
        const match = data.find(p => p.id === created.id);
        if (match) {
          setSelectedPlan(match);
          if (match.exercises && match.exercises.length > 0) {
            setSelectedExerciseName(match.exercises[0].exercise_name);
          }
        }
      }
      setIsPlanModalOpen(false);
    } catch (err) {
      console.error('Failed to save plan', err);
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    if (!window.confirm(`Are you absolutely sure you want to delete the workout plan "${selectedPlan.name}"? This action cannot be undone.`)) return;
    
    try {
      await dbService.deleteStrengthPlan(userId, selectedPlan.id);
      const data = await dbService.getStrengthPlans(userId);
      setPlans(data);
      if (data.length > 0) {
        setSelectedPlan(data[0]);
        if (data[0].exercises && data[0].exercises.length > 0) {
          setSelectedExerciseName(data[0].exercises[0].exercise_name);
        }
      } else {
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error('Failed to delete plan', err);
    }
  };

  const handleAddFormExercise = () => {
    setPlanFormExercises(prev => [
      ...prev,
      { exercise_name: 'New Exercise', target_sets: 4, target_reps: 10, target_weight: 15, notes: '' }
    ]);
  };

  const handleRemoveFormExercise = (idx: number) => {
    setPlanFormExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFormExerciseChange = (idx: number, field: string, value: any) => {
    setPlanFormExercises(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: value
      };
      return copy;
    });
  };

  const handleMoveFormExercise = (idx: number, direction: 'up' | 'down') => {
    setPlanFormExercises(prev => {
      const copy = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Progression Chart calculations
  const exerciseStats = useMemo(() => {
    if (exerciseHistory.length === 0) {
      return {
        bestWeight: 0,
        estimated1RM: 0,
        totalWorkouts: 0,
        volume: 0,
        progressPoints: [] as { date: string; weight: number; reps: number; oneRepMax: number }[]
      };
    }

    // Group sets by session
    const sessionsMap: Record<string, { date: string; sets: StrengthSessionSet[] }> = {};
    exerciseHistory.forEach(s => {
      const dateLabel = new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!sessionsMap[s.session_id]) {
        sessionsMap[s.session_id] = { date: dateLabel, sets: [] };
      }
      sessionsMap[s.session_id].sets.push(s);
    });

    const progressPoints = Object.values(sessionsMap).map(session => {
      const maxWeight = Math.max(...session.sets.map(s => s.weight));
      const bestSet = session.sets.find(s => s.weight === maxWeight);
      const reps = bestSet ? bestSet.reps : 10;
      const oneRepMax = maxWeight * (1 + reps / 30);
      const sessionVol = session.sets.reduce((sum, s) => sum + (s.reps * s.weight), 0);

      return {
        date: session.date,
        weight: maxWeight,
        reps,
        oneRepMax: Math.round(oneRepMax * 10) / 10,
        volume: sessionVol
      };
    });

    const weightsList = exerciseHistory.map(h => h.weight);
    const bestWeight = Math.max(...weightsList);
    const best1RM = Math.max(...progressPoints.map(p => p.oneRepMax));
    const totalVolume = progressPoints.reduce((sum, p) => sum + p.volume, 0);

    return {
      bestWeight,
      estimated1RM: Math.round(best1RM * 10) / 10,
      totalWorkouts: progressPoints.length,
      volume: totalVolume,
      progressPoints
    };
  }, [exerciseHistory]);

  // Constructing custom SVG Line Chart Coordinates
  const chartCoordinates = useMemo(() => {
    const points = exerciseStats.progressPoints;
    if (points.length < 2) return [];

    const width = 500;
    const height = 150;
    const padding = 20;

    const xRange = width - padding * 2;
    const yRange = height - padding * 2;

    const weights = points.map(p => p.weight);
    const minWeight = Math.max(Math.min(...weights) - 2, 0);
    const maxWeight = Math.max(...weights) + 2;
    const wDelta = maxWeight - minWeight === 0 ? 1 : maxWeight - minWeight;

    return points.map((p, idx) => {
      const x = padding + (idx / (points.length - 1)) * xRange;
      const y = height - padding - ((p.weight - minWeight) / wDelta) * yRange;
      return { x, y, ...p };
    });
  }, [exerciseStats]);

  const activeExercisesList = selectedPlan?.exercises || [];

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* 1. PLANS CONTROL BAR */}
      {!isWorkoutActive && plans.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface/20 border border-border/10 p-4.5 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black text-text-secondary/70 tracking-wider">Active Plan:</span>
            <select
              value={selectedPlan?.id || ''}
              onChange={(e) => {
                const match = plans.find(p => p.id === e.target.value);
                if (match) {
                  setSelectedPlan(match);
                  if (match.exercises && match.exercises.length > 0) {
                    setSelectedExerciseName(match.exercises[0].exercise_name);
                  }
                }
              }}
              className="bg-surface/50 border border-border/15 rounded-xl px-3 py-1.5 font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreatePlanModal}
              className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all active:scale-95 outline-none"
            >
              + Create Plan
            </button>
            <button
              onClick={openEditPlanModal}
              className="px-3.5 py-2 border border-border/20 hover:bg-surface-hover/50 text-text-primary rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all active:scale-95 outline-none"
            >
              Edit Exercises
            </button>
            <button
              onClick={handleDeletePlan}
              className="px-3.5 py-2 border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all active:scale-95 outline-none"
            >
              Delete Plan
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-text-secondary gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 animate-pulse">Syncing Plans</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="border border-dashed border-border/20 rounded-2xl p-16 text-center text-text-secondary/50 font-bold space-y-4">
          <p>No workout plans created yet.</p>
          <button 
            onClick={openCreatePlanModal}
            className="text-[10px] font-bold bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl transition-all outline-none"
          >
            + Create Workout Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Exercises Plan List & Live Logger */}
          <div className="lg:col-span-2 space-y-6">
            
            {isWorkoutActive ? (
              <div className="glass-panel p-5 rounded-2xl border border-accent/30 space-y-5 animate-scale-in">
                
                {/* Timer Header */}
                <div className="flex items-center justify-between border-b border-border/10 pb-3">
                  <div>
                    <span className="text-[9px] font-bold text-accent uppercase tracking-widest bg-accent/15 border border-accent/25 px-2.5 py-0.5 rounded-full">
                      Live Workout Session
                    </span>
                    <h3 className="text-sm font-black text-text-primary mt-1.5">{selectedPlan?.name}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={cancelWorkout}
                      className="px-3 py-1.5 border border-border/20 hover:border-red-500/20 hover:bg-red-500/10 text-text-secondary hover:text-red-400 rounded-xl font-bold transition-all outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={completeWorkout}
                      disabled={completingWorkout}
                      className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
                    >
                      {completingWorkout ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
                      <span>Save Workout</span>
                    </button>
                  </div>
                </div>

                {/* Exercises Sets inputs list */}
                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
                  {activeExercisesList.map(exe => (
                    <div key={exe.id} className="space-y-3 bg-surface-hover/10 border border-border/10 p-4 rounded-xl">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-black text-text-primary">{exe.exercise_name}</span>
                        <span className="text-[9px] text-text-secondary/50 font-bold">Target: {exe.target_sets} × {exe.target_reps} ({exe.target_weight ? `${exe.target_weight}kg` : 'BW'})</span>
                      </div>

                      {/* Reps / weight set list fields */}
                      <div className="space-y-2">
                        {workoutSets[exe.exercise_name]?.map((set, setIdx) => (
                          <div key={setIdx} className="grid grid-cols-4 gap-3 items-center text-[10px]">
                            <span className="font-bold text-text-secondary/60">Set {setIdx + 1}</span>
                            
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={set.reps}
                                onChange={(e) => handleSetChange(exe.exercise_name, setIdx, 'reps', e.target.value)}
                                className="w-12 bg-surface/40 border border-border/15 rounded-lg px-2 py-1 text-center font-bold text-text-primary focus:outline-none"
                              />
                              <span className="text-[9px] text-text-secondary/50 font-semibold">reps</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={set.weight}
                                onChange={(e) => handleSetChange(exe.exercise_name, setIdx, 'weight', e.target.value)}
                                className="w-16 bg-surface/40 border border-border/15 rounded-lg px-2 py-1 text-center font-bold text-text-primary focus:outline-none"
                              />
                              <span className="text-[9px] text-text-secondary/50 font-semibold">kg</span>
                            </div>

                            <input
                              type="text"
                              placeholder="Notes (e.g. felt light)"
                              value={set.notes}
                              onChange={(e) => handleSetChange(exe.exercise_name, setIdx, 'notes', e.target.value)}
                              className="bg-surface/40 border border-border/15 rounded-lg px-2 py-1 text-[9px] text-text-primary focus:outline-none placeholder:text-text-secondary/35"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-border/10 pt-4">
                  <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider">Session Notes</label>
                  <textarea
                    rows={2}
                    placeholder="How was your energy? Did you achieve standard progression targets?"
                    value={workoutSessionNotes}
                    onChange={(e) => setWorkoutSessionNotes(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:outline-none resize-none"
                  />
                </div>

              </div>
            ) : (
              <div className="glass-panel p-5 rounded-2xl border border-border/10 space-y-4">
                
                {/* Header title */}
                <div className="flex justify-between items-center border-b border-border/10 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">{selectedPlan?.name}</h3>
                    <p className="text-[10px] text-text-secondary/60 mt-0.5 font-medium">{selectedPlan?.description}</p>
                  </div>
                  
                  <button
                    onClick={startWorkout}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Workout</span>
                  </button>
                </div>

                {/* Exercises Plan Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/10 text-[9px] uppercase text-text-secondary/60 font-bold tracking-wider">
                        <th className="py-2.5 pl-2">Exercise</th>
                        <th className="py-2.5">Sets</th>
                        <th className="py-2.5">Reps</th>
                        <th className="py-2.5">Weight (kg)</th>
                        <th className="py-2.5">Target Focus Notes</th>
                        <th className="py-2.5 text-right pr-2">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/5">
                      {activeExercisesList.map(exe => (
                        <tr 
                          key={exe.id} 
                          onClick={() => setSelectedExerciseName(exe.exercise_name)}
                          className={`hover:bg-surface-hover/20 cursor-pointer rounded-lg transition-all ${
                            selectedExerciseName.toLowerCase() === exe.exercise_name.toLowerCase() ? 'bg-surface-hover/30' : ''
                          }`}
                        >
                          <td className="py-3 pl-2 font-black text-text-primary">{exe.exercise_name}</td>
                          <td className="py-3 text-text-secondary font-bold">{exe.target_sets}</td>
                          <td className="py-3 text-text-secondary font-bold">{exe.target_reps}</td>
                          <td className="py-3 text-text-secondary font-bold">{exe.target_weight ? `${exe.target_weight} kg` : 'BW'}</td>
                          <td className="py-3 text-text-secondary/60 italic font-medium">{exe.notes || '—'}</td>
                          <td className="py-3 text-right pr-2">
                            <button className="p-1 rounded hover:bg-accent/15 text-accent transition-colors outline-none">
                              <BarChart3 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>

          {/* Right Column: Exercise Progression Sparkline Analytics */}
          <div className="space-y-6">
            
            <div className="glass-panel p-5 rounded-2xl border border-border/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black text-text-secondary/70 tracking-widest">Progress Tracking</span>
                <select
                  value={selectedExerciseName}
                  onChange={(e) => setSelectedExerciseName(e.target.value)}
                  className="bg-surface/30 border border-border/15 rounded-lg px-2 py-1 text-[10px] font-bold text-text-primary focus:outline-none cursor-pointer"
                >
                  {activeExercisesList.map(e => (
                    <option key={e.id} value={e.exercise_name}>{e.exercise_name}</option>
                  ))}
                </select>
              </div>

              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-secondary gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <span className="text-[8px] uppercase font-bold tracking-widest text-slate-500">Retrieving charts</span>
                </div>
              ) : exerciseHistory.length === 0 ? (
                <div className="border border-dashed border-border/20 rounded-xl p-8 text-center text-text-secondary/50 font-bold select-none text-[10px]">
                  No history logged yet. Complete a workout logging this exercise to unlock graphs!
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-surface-hover/10 border border-border/5 p-2.5 rounded-xl">
                      <p className="text-[8px] uppercase font-bold text-text-secondary/60">Current Best</p>
                      <p className="text-sm font-black text-text-primary mt-0.5">{exerciseStats.bestWeight} <span className="text-[10px] font-semibold text-text-secondary/80">kg</span></p>
                    </div>
                    <div className="bg-surface-hover/10 border border-border/5 p-2.5 rounded-xl">
                      <p className="text-[8px] uppercase font-bold text-text-secondary/60">Estimated 1RM</p>
                      <p className="text-sm font-black text-text-primary mt-0.5">{exerciseStats.estimated1RM} <span className="text-[10px] font-semibold text-text-secondary/80">kg</span></p>
                    </div>
                    <div className="bg-surface-hover/10 border border-border/5 p-2.5 rounded-xl">
                      <p className="text-[8px] uppercase font-bold text-text-secondary/60">Total Workouts</p>
                      <p className="text-sm font-black text-text-primary mt-0.5">{exerciseStats.totalWorkouts}</p>
                    </div>
                    <div className="bg-surface-hover/10 border border-border/5 p-2.5 rounded-xl">
                      <p className="text-[8px] uppercase font-bold text-text-secondary/60">Total Volume</p>
                      <p className="text-sm font-black text-text-primary mt-0.5">{(exerciseStats.volume).toLocaleString()} <span className="text-[10px] font-semibold text-text-secondary/80">kg</span></p>
                    </div>
                  </div>

                  {chartCoordinates.length >= 2 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-text-secondary/60">Weight Lifted Progression (kg)</p>
                      <div className="relative bg-surface-hover/10 rounded-xl p-2 border border-border/5 h-40">
                        <svg className="w-full h-full text-accent" viewBox="0 0 500 150">
                          <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                          <line x1="20" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                          <line x1="20" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />

                          <path
                            d={`M ${(chartCoordinates as any[]).map((p: any) => `${p.x},${p.y}`).join(' L ')}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          <path
                            d={`M ${(chartCoordinates as any[])[0].x},130 L ${(chartCoordinates as any[]).map((p: any) => `${p.x},${p.y}`).join(' L ')} L ${(chartCoordinates as any[])[chartCoordinates.length - 1].x},130 Z`}
                            fill="url(#chartAreaGradient)"
                            opacity="0.1"
                          />

                          {(chartCoordinates as any[]).map((pt: any, idx: number) => (
                            <g key={idx} className="group/dot cursor-pointer">
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="4"
                                className="fill-surface stroke-accent"
                                strokeWidth="2"
                              />
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="8"
                                className="fill-accent/20 opacity-0 group-hover/dot:opacity-100 transition-opacity"
                              />
                              <text
                                x={pt.x}
                                y={pt.y - 8}
                                textAnchor="middle"
                                className="text-[10px] font-black fill-text-primary"
                              >
                                {pt.weight}
                              </text>
                            </g>
                          ))}

                          <defs>
                            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(167, 139, 250)" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>

                        <div className="absolute bottom-1.5 left-5 right-5 flex justify-between text-[8px] font-bold text-text-secondary/40">
                          {(chartCoordinates as any[]).map((pt: any, idx: number) => (
                            <span key={idx}>{pt.date}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 border-t border-border/5 pt-4">
                    <h4 className="text-[9px] uppercase font-bold text-text-secondary/70 tracking-wider">Exercise Session Logs</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {exerciseHistory.slice().reverse().map((set, idx) => {
                        const setDate = new Date(set.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        return (
                          <div key={idx} className="bg-surface-hover/20 border border-border/5 p-2 rounded-lg flex justify-between items-start text-[9.5px]">
                            <div>
                              <p className="font-extrabold text-text-primary">{setDate}</p>
                              <p className="text-text-secondary/70 font-semibold mt-0.5">Set {set.set_number}: {set.reps} reps × {set.weight} kg {set.rpe ? `(RPE ${set.rpe})` : ''}</p>
                              {set.notes && <p className="text-text-secondary/50 font-medium italic mt-0.5">"{set.notes}"</p>}
                            </div>
                            <span className="font-black text-accent bg-accent/15 border border-accent/20 px-1 rounded">1RM: {Math.round((set.weight * (1 + set.reps / 30)) * 10) / 10}kg</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. CREATE / EDIT PLAN WIZARD MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-surface border border-border/20 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/10 bg-surface/50">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">
                {editingPlan ? `Edit Workout Plan: ${editingPlan.name}` : 'Create Workout Plan'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-hover/80 text-text-secondary transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-5 space-y-4">
              
              {/* Plan parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-secondary/60 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Upper Body Focus"
                    value={planFormName}
                    onChange={(e) => setPlanFormName(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-2 text-text-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-secondary/60 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Focus on push strength"
                    value={planFormDesc}
                    onChange={(e) => setPlanFormDesc(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-2 text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Exercises sub-list management */}
              <div className="border-t border-border/10 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-text-primary uppercase tracking-wider">Exercises & Targets</h4>
                  <button
                    type="button"
                    onClick={handleAddFormExercise}
                    className="flex items-center gap-1 text-[9px] font-black bg-accent/15 border border-accent/25 text-accent px-2.5 py-1 rounded-lg hover:bg-accent hover:text-white transition-all outline-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Exercise</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {planFormExercises.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border/10 rounded-xl text-text-secondary/50 font-bold text-[10px]">
                      No exercises added to this plan yet. Click "Add Exercise" to start!
                    </div>
                  ) : (
                    planFormExercises.map((exe, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-surface-hover/10 border border-border/5 rounded-xl">
                        
                        {/* Name */}
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            placeholder="Exercise Name (e.g. Bicep Curl)"
                            value={exe.exercise_name}
                            onChange={(e) => handleFormExerciseChange(idx, 'exercise_name', e.target.value)}
                            className="w-full bg-surface/40 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
                            required
                          />
                        </div>

                        {/* Sets */}
                        <div className="w-full sm:w-16">
                          <div className="flex items-center gap-1 bg-surface/40 border border-border/15 rounded-lg px-2 py-0.5">
                            <input
                              type="number"
                              min="1"
                              value={exe.target_sets}
                              onChange={(e) => handleFormExerciseChange(idx, 'target_sets', parseInt(e.target.value) || 4)}
                              className="w-8 bg-transparent border-0 text-center font-bold text-text-primary focus:outline-none"
                              title="Sets"
                            />
                            <span className="text-[8px] text-text-secondary/40 font-bold uppercase">sets</span>
                          </div>
                        </div>

                        {/* Reps */}
                        <div className="w-full sm:w-16">
                          <div className="flex items-center gap-1 bg-surface/40 border border-border/15 rounded-lg px-2 py-0.5">
                            <input
                              type="number"
                              min="1"
                              value={exe.target_reps}
                              onChange={(e) => handleFormExerciseChange(idx, 'target_reps', parseInt(e.target.value) || 10)}
                              className="w-8 bg-transparent border-0 text-center font-bold text-text-primary focus:outline-none"
                              title="Reps"
                            />
                            <span className="text-[8px] text-text-secondary/40 font-bold uppercase">reps</span>
                          </div>
                        </div>

                        {/* Weight */}
                        <div className="w-full sm:w-20">
                          <div className="flex items-center gap-1 bg-surface/40 border border-border/15 rounded-lg px-2 py-0.5">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={exe.target_weight || ''}
                              onChange={(e) => handleFormExerciseChange(idx, 'target_weight', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-10 bg-transparent border-0 text-center font-bold text-text-primary focus:outline-none"
                              title="Target Weight"
                            />
                            <span className="text-[8px] text-text-secondary/40 font-bold uppercase">kg</span>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="w-full sm:w-32">
                          <input
                            type="text"
                            placeholder="Target Focus (e.g. increase)"
                            value={exe.notes || ''}
                            onChange={(e) => handleFormExerciseChange(idx, 'notes', e.target.value || null)}
                            className="w-full bg-surface/40 border border-border/15 rounded-lg px-2.5 py-1.5 text-[9px] text-text-primary focus:outline-none"
                          />
                        </div>

                        {/* Order & delete triggers */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveFormExercise(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-surface-hover/80 disabled:opacity-30 rounded text-text-secondary transition-colors"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFormExercise(idx, 'down')}
                            disabled={idx === planFormExercises.length - 1}
                            className="p-1 hover:bg-surface-hover/80 disabled:opacity-30 rounded text-text-secondary transition-colors"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFormExercise(idx)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 rounded-lg text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-border/10">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 border border-border/20 text-text-secondary hover:text-text-primary hover:bg-surface-hover/40 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={planSubmitting}
                  className="flex items-center gap-1 px-4.5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
                >
                  {planSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>Save Plan</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
