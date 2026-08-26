import React, { useState, useEffect } from 'react';
import { dbService, type FitnessRoutine, type FitnessRoutineDay, type FitnessRoutineExercise } from '../../services/supabase';
import { 
  Plus, Trash2, Calendar, Clipboard, Copy, ChevronUp, ChevronDown, RefreshCw, Info, Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoutinePlannerTabProps {
  userId: string;
  onRefreshItems: () => void;
}

export const RoutinePlannerTab: React.FC<RoutinePlannerTabProps> = ({
  userId,
  onRefreshItems
}) => {
  const [routines, setRoutines] = useState<FitnessRoutine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('');
  const [activeRoutine, setActiveRoutine] = useState<FitnessRoutine | null>(null);
  
  // Edit Routine Header states
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [routineStartDate, setRoutineStartDate] = useState('');
  const [routineEndDate, setRoutineEndDate] = useState('');
  const [routineStatus, setRoutineStatus] = useState<'active' | 'archived' | 'draft'>('draft');

  // Copy Routine states
  const [isCopying, setIsCopying] = useState(false);
  const [copyName, setCopyName] = useState('');
  const [copyStartDate, setCopyStartDate] = useState('');
  const [copyEndDate, setCopyEndDate] = useState('');

  // Selected Day to edit inside routine
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // default Monday=1
  const [activeDayConfig, setActiveDayConfig] = useState<FitnessRoutineDay | null>(null);

  // Exercise Add form
  const [newExeName, setNewExeName] = useState('');
  const [newExeSets, setNewExeSets] = useState(3);
  const [newExeRepsMin, setNewExeRepsMin] = useState(10);
  const [newExeRepsMax, setNewExeRepsMax] = useState(12);
  const [newExeWeight, setNewExeWeight] = useState('');
  const [newExeNotes, setNewExeNotes] = useState('');
  
  // Loading flags
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoutines = async (selectId?: string) => {
    setIsLoading(true);
    try {
      const data = await dbService.getFitnessRoutines(userId);
      setRoutines(data);
      
      let nextId = selectId || selectedRoutineId;
      if (!nextId && data.length > 0) {
        // Auto select active routine or the most recent one
        const active = data.find(r => r.status === 'active');
        nextId = active ? active.id : data[0].id;
      }
      setSelectedRoutineId(nextId);
    } catch (err) {
      console.error('Failed to load routines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, [userId]);

  // Load selected routine details
  useEffect(() => {
    if (!selectedRoutineId) {
      setActiveRoutine(null);
      setActiveDayConfig(null);
      return;
    }

    const loadRoutineDetails = async () => {
      try {
        const details = await dbService.getFitnessRoutine(userId, selectedRoutineId);
        setActiveRoutine(details);
        
        // Setup header form fields
        setRoutineName(details.name);
        setRoutineDescription(details.description || '');
        setRoutineStartDate(details.start_date ? details.start_date.split('T')[0] : '');
        setRoutineEndDate(details.end_date ? details.end_date.split('T')[0] : '');
        setRoutineStatus(details.status);

        // Fetch routine days configs
        const days = await dbService.getFitnessRoutineDays(details.id);

        // Auto select the active day's tab
        const dayMatch = days.find(d => d.day_of_week === selectedDayOfWeek) || days[0];
        if (dayMatch) {
          setSelectedDayOfWeek(dayMatch.day_of_week);
          setActiveDayConfig(dayMatch);
        }
      } catch (err) {
        console.error('Failed to load routine details:', err);
      }
    };

    loadRoutineDetails();
  }, [selectedRoutineId, selectedDayOfWeek]);

  const handleUpdateHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoutine) return;
    setIsSubmitting(true);
    try {
      const updated = await dbService.updateFitnessRoutine(userId, activeRoutine.id, {
        name: routineName.trim(),
        description: routineDescription.trim() || null,
        start_date: routineStartDate,
        end_date: routineEndDate,
        status: routineStatus
      });
      setIsEditingHeader(false);
      fetchRoutines(updated.id);
      confetti({ particleCount: 20, spread: 25, origin: { y: 0.85 } });
    } catch (err) {
      console.error('Failed to update routine header:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewRoutine = async () => {
    setIsSubmitting(true);
    try {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + 30); // 30 days default range

      const newR = await dbService.createFitnessRoutine(userId, {
        name: `Strength Routine - ${today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
        description: '30-day target strength and flexibility progression.',
        start_date: today.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        status: 'draft',
        source_routine_id: null,
        user_id: userId
      });

      fetchRoutines(newR.id);
      confetti({ particleCount: 30, spread: 40 });
    } catch (err) {
      console.error('Failed to create new routine:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoutine = async () => {
    if (!activeRoutine) return;
    if (!window.confirm(`Are you absolutely sure you want to delete "${activeRoutine.name}"? This action deletes all scheduled days and exercise configurations.`)) return;

    setIsSubmitting(true);
    try {
      await dbService.deleteFitnessRoutine(userId, activeRoutine.id);
      fetchRoutines('');
    } catch (err) {
      console.error('Failed to delete routine:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoutine || !copyName.trim() || !copyStartDate || !copyEndDate) return;
    setIsSubmitting(true);
    try {
      const copied = await dbService.copyFitnessRoutine(userId, activeRoutine.id, copyName.trim(), copyStartDate, copyEndDate);
      setIsCopying(false);
      setCopyName('');
      fetchRoutines(copied.id);
      confetti({ particleCount: 40, spread: 50 });
    } catch (err) {
      console.error('Failed to copy routine:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Day settings edits
  const handleUpdateDayConfig = async (fields: Partial<FitnessRoutineDay>) => {
    if (!activeDayConfig) return;
    try {
      const updated = await dbService.updateFitnessRoutineDay(userId, activeDayConfig.id, fields);
      
      // Update local state
      setActiveDayConfig(curr => curr ? { ...curr, ...updated } : null);
      
      // notify parent dashboard to pick up changes
      onRefreshItems();
    } catch (err) {
      console.error('Failed to update day configs:', err);
    }
  };

  // Exercise actions
  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDayConfig || !newExeName.trim()) return;

    try {
      const order = activeDayConfig.exercises ? activeDayConfig.exercises.length : 0;
      await dbService.createFitnessRoutineExercise(userId, {
        routine_day_id: activeDayConfig.id,
        exercise_name: newExeName.trim(),
        exercise_id: null,
        sets: newExeSets,
        reps_min: newExeRepsMin,
        reps_max: newExeRepsMax,
        weight: newExeWeight.trim() ? parseFloat(newExeWeight) : null,
        duration_seconds: null,
        rest_seconds: 90,
        order_index: order,
        notes: newExeNotes.trim() || null
      });

      // Clear Form fields
      setNewExeName('');
      setNewExeNotes('');
      
      // Refresh selected day
      const updatedDays = await dbService.getFitnessRoutineDays(activeDayConfig.routine_id);
      const match = updatedDays.find(d => d.id === activeDayConfig.id);
      if (match) setActiveDayConfig(match);

      onRefreshItems();
      confetti({ particleCount: 15, spread: 20 });
    } catch (err) {
      console.error('Failed to add exercise:', err);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!activeDayConfig) return;
    try {
      await dbService.deleteFitnessRoutineExercise(userId, exerciseId);
      
      // Refresh selected day
      const updatedDays = await dbService.getFitnessRoutineDays(activeDayConfig.routine_id);
      const match = updatedDays.find(d => d.id === activeDayConfig.id);
      if (match) setActiveDayConfig(match);

      onRefreshItems();
    } catch (err) {
      console.error('Failed to delete exercise:', err);
    }
  };

  const handleReorderExercise = async (exercise: FitnessRoutineExercise, direction: 'up' | 'down') => {
    if (!activeDayConfig || !activeDayConfig.exercises) return;
    
    const exercises = [...activeDayConfig.exercises];
    const index = exercises.findIndex(e => e.id === exercise.id);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= exercises.length) return;

    // Swap indexes
    const tempOrder = exercises[index].order_index;
    exercises[index].order_index = exercises[swapIndex].order_index;
    exercises[swapIndex].order_index = tempOrder;

    try {
      await dbService.reorderFitnessRoutineExercises(userId, [
        { id: exercises[index].id, order_index: exercises[index].order_index },
        { id: exercises[swapIndex].id, order_index: exercises[swapIndex].order_index }
      ]);

      // Refresh Day Config exercises list sorting
      const updatedDays = await dbService.getFitnessRoutineDays(activeDayConfig.routine_id);
      const match = updatedDays.find(d => d.id === activeDayConfig.id);
      if (match) setActiveDayConfig(match);
    } catch (err) {
      console.error('Failed to reorder exercises:', err);
    }
  };

  const weekdays = [
    { key: 1, label: 'Mon' },
    { key: 2, label: 'Tue' },
    { key: 3, label: 'Wed' },
    { key: 4, label: 'Thu' },
    { key: 5, label: 'Fri' },
    { key: 6, label: 'Sat' },
    { key: 0, label: 'Sun' }
  ];

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* HEADER CONTROLS (Routine dropdown selector + creation triggers) */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border/10 pb-5">
        <div className="space-y-2">
          <label className="block text-[9px] uppercase font-bold text-text-secondary/70 tracking-wider">Workout Routine</label>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedRoutineId}
              onChange={(e) => setSelectedRoutineId(e.target.value)}
              className="bg-surface-hover/30 border border-border/20 rounded-xl px-3.5 py-2.5 text-text-primary text-xs font-bold outline-none focus:border-accent"
              disabled={isLoading}
            >
              {routines.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.status === 'active' ? '· Active' : r.status === 'draft' ? '· Draft' : '· Archived'}
                </option>
              ))}
              {routines.length === 0 && <option value="">No routines configured</option>}
            </select>

            <button
              onClick={handleCreateNewRoutine}
              className="p-2.5 rounded-xl border border-border/20 hover:bg-surface-hover/50 text-text-primary flex items-center justify-center transition-all focus:outline-none"
              title="Create new empty draft routine"
            >
              <Plus className="h-4.5 w-4.5" />
            </button>
            
            {activeRoutine && (
              <button
                onClick={() => {
                  setCopyName(`Copy of ${activeRoutine.name}`);
                  setCopyStartDate(activeRoutine.start_date.split('T')[0]);
                  setCopyEndDate(activeRoutine.end_date.split('T')[0]);
                  setIsCopying(true);
                }}
                className="p-2.5 rounded-xl border border-border/20 hover:bg-surface-hover/50 text-text-secondary hover:text-text-primary flex items-center justify-center transition-all focus:outline-none"
                title="Duplicate / Template this routine"
              >
                <Copy className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeRoutine && (
            <>
              <button
                onClick={() => setIsEditingHeader(prev => !prev)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-bold uppercase tracking-wider text-[9px] transition-all ${isEditingHeader ? 'bg-accent/10 border-accent/25 text-accent' : 'bg-surface border-border/20 text-text-primary hover:bg-surface-hover'}`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditingHeader ? 'Close Editor' : 'Edit Routine Settings'}</span>
              </button>

              <button
                onClick={handleDeleteRoutine}
                className="px-4 py-2.5 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold uppercase tracking-wider text-[9px] rounded-xl transition-all"
              >
                Delete Routine
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-accent" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Syncing Routine Layout</span>
        </div>
      ) : !activeRoutine ? (
        <div className="py-20 text-center bg-surface/10 rounded-2xl border border-border/10 space-y-4">
          <Calendar className="h-10 w-10 text-text-secondary/20 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-text-primary">Create Your First Fitness Routine</p>
            <p className="text-[10px] text-text-secondary/50 max-w-xs mx-auto">Design routines spanning weeks/months with daily workout configurations, target sets & reps.</p>
          </div>
          <button
            onClick={handleCreateNewRoutine}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            Create Routine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT/MIDDLE: ROUTINE HEADER DETAILS & WEEKDAY PLANNER CONFIG */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header editing block */}
            {isEditingHeader ? (
              <form onSubmit={handleUpdateHeader} className="glass-panel p-5 rounded-3xl border border-border/20 space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Edit Routine Settings</h3>
                
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Routine Name</label>
                  <input
                    type="text"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    required
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Description / Goal</label>
                  <textarea
                    value={routineDescription}
                    onChange={(e) => setRoutineDescription(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary text-xs"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Start Date</label>
                    <input
                      type="date"
                      value={routineStartDate}
                      onChange={(e) => setRoutineStartDate(e.target.value)}
                      required
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">End Date</label>
                    <input
                      type="date"
                      value={routineEndDate}
                      onChange={(e) => setRoutineEndDate(e.target.value)}
                      required
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Routine Status</label>
                  <select
                    value={routineStatus}
                    onChange={(e) => setRoutineStatus(e.target.value as any)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary text-xs font-bold"
                  >
                    <option value="draft">Draft (Planning Phase)</option>
                    <option value="active">Active (Currently Training)</option>
                    <option value="archived">Archived (Finished Routine)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingHeader(false)}
                    className="flex-1 py-2.5 border border-border/20 text-text-secondary font-bold uppercase text-[9px] tracking-wider rounded-xl hover:bg-surface-hover/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white font-black uppercase text-[9px] tracking-wider rounded-xl shadow-md"
                  >
                    Save Routine Settings
                  </button>
                </div>
              </form>
            ) : (
              <div className="glass-panel p-6 rounded-3xl border border-border/10 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${activeRoutine.status === 'active' ? 'bg-success/15 border border-success/35 text-success' : activeRoutine.status === 'draft' ? 'bg-yellow-500/10 border border-yellow-500/20 text-warning' : 'bg-surface border border-border/20 text-text-secondary'}`}>
                      {activeRoutine.status} Routine
                    </span>
                    <h3 className="text-base font-black text-text-primary mt-1.5">{activeRoutine.name}</h3>
                    <p className="text-[10px] text-text-secondary/70 leading-relaxed italic">{activeRoutine.description || 'No description provided.'}</p>
                  </div>

                  <div className="text-right space-y-1 text-text-secondary font-bold shrink-0">
                    <p className="text-[9px] uppercase tracking-wider text-text-secondary/50">Training Window</p>
                    <p className="text-xs text-text-primary">{new Date(activeRoutine.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[9px] text-text-secondary/60">to</p>
                    <p className="text-xs text-text-primary">{new Date(activeRoutine.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Weekday Configuration selection panel */}
            <div className="glass-panel p-6 rounded-3xl border border-border/10 space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-border/10 pb-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Weekly Schedule Configuration</h3>
                
                {/* Weekday Switcher */}
                <div className="flex bg-surface-hover/30 p-1 border border-border/10 rounded-2xl gap-1">
                  {weekdays.map(day => (
                    <button
                      key={day.key}
                      onClick={() => setSelectedDayOfWeek(day.key)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all outline-none ${selectedDayOfWeek === day.key ? 'bg-accent text-white font-black' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/60'}`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeDayConfig ? (
                <div className="space-y-6">
                  
                  {/* Workout type, body target target config */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Workout Type / Activity Target</label>
                      <input
                        type="text"
                        placeholder="Strength Training, HIIT, Active Rest, Swimming..."
                        value={activeDayConfig.workout_type || ''}
                        onChange={(e) => handleUpdateDayConfig({ workout_type: e.target.value, is_rest_day: e.target.value.toLowerCase().includes('rest') })}
                        onBlur={(e) => handleUpdateDayConfig({ workout_type: e.target.value.trim() || null })}
                        className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Target Muscle Group / Focus Area</label>
                      <input
                        type="text"
                        placeholder="Chest + Push, Posterior Chain, Legs, Flexibility..."
                        disabled={activeDayConfig.is_rest_day}
                        value={activeDayConfig.body_part || ''}
                        onChange={(e) => handleUpdateDayConfig({ body_part: e.target.value })}
                        onBlur={(e) => handleUpdateDayConfig({ body_part: e.target.value.trim() || null })}
                        className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary font-bold text-xs disabled:opacity-40"
                      />
                    </div>
                  </div>

                  {/* Warmup & Stretching Config */}
                  {!activeDayConfig.is_rest_day && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/10 pt-4">
                      
                      {/* Warmup config */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Warm-up Setup</label>
                          <select
                            value={activeDayConfig.warmup_type}
                            onChange={(e) => handleUpdateDayConfig({ warmup_type: e.target.value as any })}
                            className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary text-xs font-semibold"
                          >
                            <option value="none">No Warmup Scheduled</option>
                            <option value="common">Common Warmup (5-10m active stretch)</option>
                            <option value="custom">Specific Warmup Exercises</option>
                            <option value="both">Common + Specific Exercises</option>
                          </select>
                        </div>
                        {activeDayConfig.warmup_type !== 'none' && (
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold uppercase tracking-wider text-text-secondary/50">Warm-up Notes</label>
                            <input
                              type="text"
                              placeholder="5 min light treadmill + arm rotations"
                              value={activeDayConfig.warmup_notes || ''}
                              onChange={(e) => handleUpdateDayConfig({ warmup_notes: e.target.value })}
                              onBlur={(e) => handleUpdateDayConfig({ warmup_notes: e.target.value.trim() || null })}
                              className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-2 text-[10px] text-text-primary"
                            />
                          </div>
                        )}
                      </div>

                      {/* Stretching config */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Cool-down / Stretching Setup</label>
                          <select
                            value={activeDayConfig.stretching_type}
                            onChange={(e) => handleUpdateDayConfig({ stretching_type: e.target.value as any })}
                            className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary text-xs font-semibold"
                          >
                            <option value="none">No Stretching Scheduled</option>
                            <option value="common">Common Cool-down (5m static holds)</option>
                            <option value="custom">Custom Mobility stretches</option>
                            <option value="both">Common + Custom Mobility stretches</option>
                          </select>
                        </div>
                        {activeDayConfig.stretching_type !== 'none' && (
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold uppercase tracking-wider text-text-secondary/50">Mobility Notes</label>
                            <input
                              type="text"
                              placeholder="doorway chest stretch + foam roller lats"
                              value={activeDayConfig.stretching_notes || ''}
                              onChange={(e) => handleUpdateDayConfig({ stretching_notes: e.target.value })}
                              onBlur={(e) => handleUpdateDayConfig({ stretching_notes: e.target.value.trim() || null })}
                              className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-2 text-[10px] text-text-primary"
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* REST DAY BANNER SUMMARY */}
                  {activeDayConfig.is_rest_day && (
                    <div className="p-4 bg-emerald-950/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                      <Info className="h-4 w-4 text-success" />
                      <p className="text-[10px] text-text-secondary leading-normal">
                        This day is marked as a <span className="text-success font-black">REST DAY</span>. Workouts execution checks are disabled. Ensure your body gets optimal sleep, hydration, and nutrition.
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-12 text-center text-text-secondary/40 font-bold italic">
                  Select a day to configure schedule.
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ACTIVE EXERCISE BUILDER */}
          <div className="space-y-6">
            
            {activeDayConfig && !activeDayConfig.is_rest_day ? (
              <div className="space-y-6">
                
                {/* Exercises Checklist builder */}
                <div className="glass-panel p-5 rounded-3xl border border-border/10 space-y-4">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Exercise List</h3>

                  <div className="space-y-3">
                    {activeDayConfig.exercises && activeDayConfig.exercises.length > 0 ? (
                      <div className="divide-y divide-border/10">
                        {activeDayConfig.exercises.map((exe, idx) => (
                          <div key={exe.id} className="py-2.5 flex items-center justify-between group">
                            <div className="space-y-0.5 min-w-0 pr-2">
                              <p className="text-xs font-bold text-text-primary truncate">
                                {idx + 1}. {exe.exercise_name}
                              </p>
                              <p className="text-[9px] font-medium text-text-secondary/60">
                                {exe.sets} sets × {exe.reps_min}{exe.reps_max !== exe.reps_min ? `–${exe.reps_max}` : ''} reps {exe.weight ? `· ${exe.weight} kg` : ''}
                              </p>
                              {exe.notes && (
                                <p className="text-[8px] text-text-secondary/40 italic">{exe.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-45 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleReorderExercise(exe, 'up')}
                                disabled={idx === 0}
                                className="p-1 border border-border/20 rounded hover:bg-surface-hover disabled:opacity-20 outline-none"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button 
                                onClick={() => handleReorderExercise(exe, 'down')}
                                disabled={idx === (activeDayConfig.exercises?.length || 1) - 1}
                                className="p-1 border border-border/20 rounded hover:bg-surface-hover disabled:opacity-20 outline-none"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteExercise(exe.id)}
                                className="p-1 border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded outline-none"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-[10px] text-text-secondary/40 italic">
                        No exercises configured for this workout day.
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Exercise Creator Form */}
                <form onSubmit={handleAddExercise} className="glass-panel p-5 rounded-3xl border border-border/10 space-y-4">
                  <h4 className="text-[10px] uppercase font-bold text-accent tracking-wider">Add Exercise</h4>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Exercise Name</label>
                    <input
                      type="text"
                      placeholder="Bench Press, Squats, Pull-ups..."
                      value={newExeName}
                      onChange={(e) => setNewExeName(e.target.value)}
                      required
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-2 text-xs font-semibold text-text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-text-secondary/50">Sets</label>
                      <input
                        type="number"
                        min="1"
                        value={newExeSets}
                        onChange={(e) => setNewExeSets(parseInt(e.target.value) || 3)}
                        className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-2 py-1.5 text-center text-xs font-bold text-text-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-text-secondary/50">Min Reps</label>
                      <input
                        type="number"
                        min="1"
                        value={newExeRepsMin}
                        onChange={(e) => setNewExeRepsMin(parseInt(e.target.value) || 10)}
                        className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-2 py-1.5 text-center text-xs font-bold text-text-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-text-secondary/50">Max Reps</label>
                      <input
                        type="number"
                        min="1"
                        value={newExeRepsMax}
                        onChange={(e) => setNewExeRepsMax(parseInt(e.target.value) || 12)}
                        className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-2 py-1.5 text-center text-xs font-bold text-text-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold uppercase tracking-wider text-text-secondary/50">Weight target (kg, optional)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 60"
                        value={newExeWeight}
                        onChange={(e) => setNewExeWeight(e.target.value)}
                        className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-1.5 text-xs font-semibold text-text-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-text-secondary/50">Notes / Focus</label>
                    <input
                      type="text"
                      placeholder="Controlled eccentrics, pause at bottom..."
                      value={newExeNotes}
                      onChange={(e) => setNewExeNotes(e.target.value)}
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-2 text-xs text-text-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-accent hover:bg-accent-hover text-white font-bold uppercase tracking-wider text-[9px] rounded-xl transition-all shadow-md"
                  >
                    Add Exercise
                  </button>
                </form>

              </div>
            ) : (
              <div className="glass-panel p-6 rounded-3xl border border-border/10 text-center py-16 text-text-secondary/40 font-bold italic space-y-1.5 select-none">
                <Clipboard className="h-6 w-6 text-text-secondary/20 mx-auto" />
                <p className="text-[10px]">Rest Day scheduled.</p>
                <p className="text-[8px] font-normal leading-normal max-w-[150px] mx-auto text-text-secondary/50">Exercises mapping is only available on training days.</p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================
          MODAL: DUPLICATE / COPY PREVIOUS ACTIVE ROUTINE
          ======================================================== */}
      {isCopying && activeRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 select-none animate-fade-in">
          <form onSubmit={handleCopyRoutine} className="glass-panel p-6 rounded-3xl max-w-md w-full border border-border/30 space-y-4 animate-scale-in">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Duplicate Routine</h3>
            
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">New Routine Name</label>
              <input 
                type="text"
                value={copyName}
                onChange={(e) => setCopyName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface/30 border border-border/40 text-xs text-text-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">Start Date</label>
                <input 
                  type="date"
                  value={copyStartDate}
                  onChange={(e) => setCopyStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface/30 border border-border/40 text-xs text-text-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary/70">End Date</label>
                <input 
                  type="date"
                  value={copyEndDate}
                  onChange={(e) => setCopyEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface/30 border border-border/40 text-xs text-text-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCopying(false)}
                className="flex-1 py-2.5 border border-border/35 hover:bg-surface-hover/30 text-text-secondary font-bold uppercase text-[10px] rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white font-black uppercase text-[10px] rounded-xl transition-all shadow-md"
              >
                Duplicate Routine
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
