import React, { useState, useEffect } from 'react';
import { dbService, type ActivityType } from '../../services/supabase';
import { Loader2, X, Plus } from 'lucide-react';

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityLogged: () => void;
  userId: string;
  defaultDate?: string;
  defaultTypeSlug?: string;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen,
  onClose,
  onActivityLogged,
  userId,
  defaultDate,
  defaultTypeSlug
}) => {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState('60');
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [steps, setSteps] = useState('');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await dbService.getActivityTypes();
        setTypes(data);
        if (data.length > 0) {
          if (defaultTypeSlug) {
            const match = data.find(t => t.slug === defaultTypeSlug);
            setTypeId(match ? match.id : data[0].id);
          } else {
            setTypeId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load activity types', err);
      } finally {
        setLoadingTypes(false);
      }
    };

    if (isOpen) {
      fetchTypes();
      
      // Setup default date to today in YYYY-MM-DD
      const todayStr = defaultDate || new Date().toISOString().split('T')[0];
      setDate(todayStr);
      
      // Reset optional fields
      setDistance('');
      setCalories('');
      setAvgHeartRate('');
      setMaxHeartRate('');
      setSteps('');
      setIntensity('medium');
      setNotes('');
      setPhotoUrl('');
    }
  }, [isOpen, defaultDate, defaultTypeSlug]);

  if (!isOpen) return null;

  const activeType = types.find(t => t.id === typeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeId || !date || !startTime || !duration) return;

    setIsSubmitting(true);
    try {
      const startedAtStr = `${date}T${startTime}:00`;
      const startD = new Date(startedAtStr);
      const endD = new Date(startD.getTime() + parseInt(duration) * 60000);

      // Estimate calories based on duration & activity type if not provided
      let finalCalories = calories ? parseInt(calories) : null;
      if (!finalCalories && activeType) {
        // Simple heuristic metabolic equivalent
        const mins = parseInt(duration);
        if (activeType.slug === 'strength_training') finalCalories = mins * 6;
        else if (activeType.slug === 'badminton') finalCalories = mins * 7;
        else if (activeType.slug === 'swimming') finalCalories = mins * 8;
        else if (activeType.slug === 'running') finalCalories = mins * 9;
        else if (activeType.slug === 'walking') finalCalories = mins * 4;
        else if (activeType.slug === 'yoga') finalCalories = mins * 3.5;
      }

      await dbService.createFitnessActivity({
        user_id: userId,
        activity_type_id: typeId,
        started_at: startD.toISOString(),
        ended_at: endD.toISOString(),
        duration_minutes: parseInt(duration),
        distance: distance ? parseFloat(distance) : null,
        calories: finalCalories,
        avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate) : null,
        max_heart_rate: maxHeartRate ? parseInt(maxHeartRate) : null,
        steps: steps ? parseInt(steps) : null,
        intensity,
        notes: notes.trim() || null,
        photos: photoUrl.trim() ? [photoUrl.trim()] : []
      });

      onActivityLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log activity', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-surface border border-border/20 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/10 bg-surface/50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Log Activity</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg hover:bg-surface-hover/80 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        {loadingTypes ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Initializing catalog options</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 max-h-[80vh] overflow-y-auto space-y-4 text-xs">
            
            {/* Row 1: Type */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Activity Type</label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary focus:border-accent/40 focus:outline-none transition-colors"
                required
              >
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Row 2: Date & Start Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Row 3: Duration & Intensity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Intensity</label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as any)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none transition-colors"
                >
                  <option value="low">Low Intensity</option>
                  <option value="medium">Medium Intensity</option>
                  <option value="high">High Intensity</option>
                </select>
              </div>
            </div>

            {/* Dynamic fields based on selected type */}
            <div className="border-t border-border/10 pt-4 space-y-4">
              <h4 className="text-[10px] uppercase font-extrabold text-accent/80 tracking-wider mb-1">Performance Details (Optional)</h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Distance for Running/Swimming/Walking */}
                {activeType && ['running', 'swimming', 'walking'].includes(activeType.slug) && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">
                      Distance ({activeType.slug === 'swimming' ? 'meters' : 'km'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 5.2"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
                    />
                  </div>
                )}

                {/* Steps for Walking/Running */}
                {activeType && ['walking', 'running'].includes(activeType.slug) && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Steps</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 8000"
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
                    />
                  </div>
                )}

                {/* Calories */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Calories Burned (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank to auto-calculate"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Avg Heart Rate */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Avg Heart Rate (bpm)</label>
                  <input
                    type="number"
                    min="40"
                    max="220"
                    placeholder="e.g. 132"
                    value={avgHeartRate}
                    onChange={(e) => setAvgHeartRate(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
                  />
                </div>
                {/* Max Heart Rate */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Max Heart Rate (bpm)</label>
                  <input
                    type="number"
                    min="40"
                    max="220"
                    placeholder="e.g. 165"
                    value={maxHeartRate}
                    onChange={(e) => setMaxHeartRate(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Photo URL */}
            <div className="border-t border-border/10 pt-4">
              <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Illustration Photo URL (Optional)</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider mb-1.5">Notes / Description</label>
              <textarea
                rows={3}
                placeholder="How did the session feel? Any breakthrough or metric logs?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2 text-text-primary focus:border-accent/40 focus:outline-none resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border/20 text-text-secondary hover:text-text-primary hover:bg-surface-hover/40 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4.5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Save Activity</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
