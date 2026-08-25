import React, { useState, useEffect, useMemo } from 'react';
import { dbService, type RoutineItem, type ActivityType } from '../../services/supabase';
import { ChevronLeft, ChevronRight, Edit2, Check, Trash2, Plus, Clock, Loader2 } from 'lucide-react';

interface RoutinePlannerTabProps {
  routineItems: RoutineItem[];
  userId: string;
  weekStartStr: string;
  onWeekChange: (newWeekStart: string) => void;
  onRefreshItems: () => void;
  onTriggerLogPlanned: (item: RoutineItem) => void;
}

export const RoutinePlannerTab: React.FC<RoutinePlannerTabProps> = ({
  routineItems,
  userId,
  weekStartStr,
  onWeekChange,
  onRefreshItems,
  onTriggerLogPlanned
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [types, setTypes] = useState<ActivityType[]>([]);
  
  // New Item Inline Fields
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('60');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await dbService.getActivityTypes();
        setTypes(data);
        if (data.length > 0) setSelectedTypeId(data[0].id);
      } catch (err) {
        console.error('Failed to load types', err);
      }
    };
    fetchTypes();
  }, []);

  // Format week range label (e.g. Aug 19 – Aug 25)
  const formatWeekRange = (mondayStr: string) => {
    const monday = new Date(mondayStr);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString('en-US', options)} – ${sunday.toLocaleDateString('en-US', options)}`;
  };

  const handlePrevWeek = () => {
    const d = new Date(weekStartStr);
    d.setDate(d.getDate() - 7);
    onWeekChange(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(weekStartStr);
    d.setDate(d.getDate() + 7);
    onWeekChange(d.toISOString().split('T')[0]);
  };

  const handleTodayWeek = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    onWeekChange(monday.toISOString().split('T')[0]);
  };

  const handleAddPlannedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !newDuration) return;

    setIsSubmitting(true);
    try {
      // 1. Fetch routine header id
      const routine = await dbService.getOrCreateWeeklyRoutine(userId, weekStartStr);
      
      await dbService.createRoutineItem({
        routine_id: routine.id,
        day_of_week: selectedDay,
        activity_type_id: selectedTypeId,
        title: newTitle.trim() || null,
        duration_minutes: parseInt(newDuration),
        notes: newNotes.trim() || null,
        sort_order: 0
      });

      setNewTitle('');
      setNewNotes('');
      onRefreshItems();
    } catch (err) {
      console.error('Failed to add routine item', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Delete this planned item?')) return;
    try {
      await dbService.deleteRoutineItem(userId, itemId);
      onRefreshItems();
    } catch (err) {
      console.error('Failed to delete routine item', err);
    }
  };

  // Group routine items by day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const groupedItems = useMemo(() => {
    const days = Array(7).fill(null).map((_, idx) => {
      // Re-map Sunday to end of the week in UI (Mon=1, Tue=2, ..., Sat=6, Sun=0)
      const dayIndex = idx === 6 ? 0 : idx + 1;
      const label = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][idx];
      const items = routineItems.filter(item => item.day_of_week === dayIndex);
      return {
        dayIndex,
        label,
        items
      };
    });
    return days;
  }, [routineItems]);

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
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Routine Planner</h2>
          <p className="text-[10px] text-text-secondary/60 mt-0.5 font-medium">Plan your week. Stay consistent.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Week navigator */}
          <div className="flex items-center border border-border/20 rounded-xl bg-surface/30 px-2.5 py-1.5 gap-2 font-bold select-none text-[10px] text-text-secondary uppercase">
            <button onClick={handlePrevWeek} className="p-1 hover:text-text-primary hover:bg-surface-hover/80 rounded transition-colors focus:outline-none">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-text-primary min-w-[120px] text-center">{formatWeekRange(weekStartStr)}</span>
            <button onClick={handleNextWeek} className="p-1 hover:text-text-primary hover:bg-surface-hover/80 rounded transition-colors focus:outline-none">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button 
            onClick={handleTodayWeek}
            className="px-3.5 py-2 border border-border/20 hover:border-border/30 rounded-xl font-bold uppercase tracking-wider text-[9px]"
          >
            This Week
          </button>

          <button
            onClick={() => setIsEditing(prev => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all border active:scale-95 text-[9px] uppercase tracking-wider ${
              isEditing
                ? 'bg-accent/15 text-accent border-accent/25'
                : 'bg-surface hover:bg-surface-hover border-border/20 text-text-primary'
            }`}
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>{isEditing ? 'Finish Editing' : 'Edit Plan'}</span>
          </button>
        </div>
      </div>

      {/* Routine list grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4.5">
        {groupedItems.map((day: any) => (
          <div key={day.dayIndex} className="glass-panel p-4 rounded-2xl border border-border/10 flex flex-col space-y-3 min-h-[300px]">
            {/* Day Header */}
            <div className="border-b border-border/10 pb-1.5 flex justify-between items-center">
              <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">{day.label}</span>
              <span className="text-[8px] font-semibold text-text-secondary/40">
                {day.items.length === 0 ? 'Rest' : `${day.items.length} planned`}
              </span>
            </div>

            {/* Day items lists */}
            <div className="flex-1 space-y-2.5">
              {day.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center text-[9px] text-text-secondary/30 italic">
                  Take it easy
                </div>
              ) : (
                day.items.map((item: any) => {
                  const style = getAccentStyles(item.activity_type?.slug);
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-xl border ${style.border} ${style.bg} flex flex-col justify-between space-y-2 relative group`}
                    >
                      {/* Trash action in editing mode */}
                      {isEditing && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 text-red-400 rounded-md transition-all outline-none"
                          title="Remove item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}

                      <div className="space-y-1">
                        <p className={`text-[10px] font-black ${style.text} truncate pr-5`}>
                          {item.title || item.activity_type?.name}
                        </p>
                        {item.notes && (
                          <p className="text-[9px] text-text-secondary/60 line-clamp-2 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Duration & checkoff */}
                      <div className="flex items-center justify-between border-t border-border/5 pt-1.5 mt-1 text-[9px] font-bold text-text-secondary/50">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{item.duration_minutes} min</span>
                        </span>
                        
                        {/* Checkbox log trigger */}
                        {!isEditing && (
                          <button
                            onClick={() => !item.is_completed && onTriggerLogPlanned(item)}
                            disabled={item.is_completed}
                            className={`h-4 w-4 rounded-md flex items-center justify-center border transition-all ${
                              item.is_completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-border/30 hover:border-accent hover:bg-accent/10 text-transparent hover:text-accent/60'
                            }`}
                            title={item.is_completed ? 'Activity completed!' : 'Click to log completed workout'}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inline Form to add planned item in Edit Mode */}
      {isEditing && (
        <form onSubmit={handleAddPlannedItem} className="glass-panel p-5 rounded-2xl border border-accent/20 animate-scale-in max-w-xl">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-3">Add Planned Activity</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            <div>
              <label className="block text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider mb-1">Day of Week</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={0}>Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider mb-1">Activity Type</label>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
              >
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider mb-1">Focus Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Upper Body Focus"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider mb-1">Notes / Target Goal (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Focus on chest pushes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Plan Workout</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
