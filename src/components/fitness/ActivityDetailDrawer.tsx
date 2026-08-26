import React, { useState, useEffect } from 'react';
import { dbService, type FitnessActivity } from '../../services/supabase';
import { X, Calendar, Clock, Award, Trash2, Camera, Plus, Loader2 } from 'lucide-react';

interface ActivityDetailDrawerProps {
  activityId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onActivityDeleted: () => void;
  userId: string;
}

export const ActivityDetailDrawer: React.FC<ActivityDetailDrawerProps> = ({
  activityId,
  isOpen,
  onClose,
  onActivityDeleted,
  userId
}) => {
  const [activity, setActivity] = useState<FitnessActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);

  const fetchActivity = async () => {
    if (!activityId) return;
    setLoading(true);
    try {
      const activities = await dbService.getFitnessActivities(userId);
      const match = activities.find(a => a.id === activityId);
      setActivity(match || null);
    } catch (err) {
      console.error('Failed to load activity details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activityId) {
      fetchActivity();
      setShowPhotoInput(false);
      setNewPhotoUrl('');
    } else {
      setActivity(null);
    }
  }, [isOpen, activityId]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!activity) return;
    if (!window.confirm(`Are you sure you want to delete this ${activity.activity_type?.name || 'activity'}?`)) return;

    setDeleting(true);
    try {
      await dbService.deleteFitnessActivity(userId, activity.id);
      onActivityDeleted();
      onClose();
    } catch (err) {
      console.error('Failed to delete activity', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || !newPhotoUrl.trim()) return;

    try {
      const currentPhotos = activity.photos || [];
      const updatedPhotos = [...currentPhotos, newPhotoUrl.trim()];
      
      await dbService.updateFitnessActivity(userId, activity.id, {
        photos: updatedPhotos
      });
      
      setActivity(prev => prev ? { ...prev, photos: updatedPhotos } : null);
      setNewPhotoUrl('');
      setShowPhotoInput(false);
    } catch (err) {
      console.error('Failed to add photo', err);
    }
  };

  // Helper to format date
  const formatActivityDate = (startedAt: string) => {
    const d = new Date(startedAt);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to format time range
  const formatTimeRange = (startedAt: string, endedAt: string) => {
    const start = new Date(startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const end = new Date(endedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${start} – ${end}`;
  };

  // Colors mapping based on slug
  const getAccentStyles = (slug?: string) => {
    switch (slug) {
      case 'strength_training':
        return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/15', fill: '#A78BFA' };
      case 'badminton':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', fill: '#34D399' };
      case 'swimming':
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/15', fill: '#60A5FA' };
      case 'running':
        return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/15', fill: '#F97316' };
      case 'walking':
        return { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/15', fill: '#2DD4BF' };
      case 'yoga':
        return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/15', fill: '#818CF8' };
      default:
        return { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/15', fill: '#A78BFA' };
    }
  };

  const style = activity ? getAccentStyles(activity.activity_type?.slug) : null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-border/10 shadow-2xl flex flex-col justify-between animate-slide-in select-none text-xs">
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4.5 border-b border-border/15 bg-surface/50">
        <span className="text-[10px] uppercase font-black text-text-secondary/70 tracking-widest">Activity Details</span>
        
        <div className="flex items-center gap-2">
          {activity && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg border border-red-500/10 text-red-400 hover:bg-red-500/10 active:scale-95 transition-all outline-none"
              title="Delete Activity"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover/80 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-text-secondary gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Opening activity records</span>
          </div>
        ) : !activity ? (
          <div className="text-center py-20 text-text-secondary/50 font-bold">
            Activity not found.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${style?.bg} ${style?.text} border ${style?.border}`}>
                  {activity.activity_type?.name}
                </span>
                <span className="text-[9px] font-semibold text-text-secondary/50 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatActivityDate(activity.started_at)}
                </span>
              </div>
              <h2 className="text-base font-black text-text-primary leading-tight">
                {activity.notes ? activity.notes.split('\n')[0] : activity.activity_type?.name}
              </h2>
              <p className="text-[10px] font-bold text-text-secondary flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTimeRange(activity.started_at, activity.ended_at)}</span>
              </p>
            </div>

            {/* Quick Metrics Bar Grid */}
            <div className="grid grid-cols-2 gap-3 border-y border-border/10 py-5 select-none text-center">
              <div>
                <p className="text-[9px] uppercase font-bold text-text-secondary/50 tracking-wider">Duration</p>
                <p className="text-sm font-black text-text-primary mt-1">{activity.duration_minutes} <span className="text-[10px] font-semibold text-text-secondary/70">min</span></p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-text-secondary/50 tracking-wider">Intensity</p>
                <p className="text-sm font-black text-text-primary mt-1 capitalize">{activity.intensity}</p>
              </div>
            </div>

            {/* Optional Stats list */}
            {activity.distance && (
              <div className="grid grid-cols-1 gap-3.5">
                <div className="glass-panel p-3 rounded-xl border border-border/10 flex items-center gap-3">
                  <div className="h-8.5 w-8.5 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-text-secondary/60">Distance Travelled</p>
                    <p className="text-[11px] font-bold text-text-primary mt-0.5">
                      {activity.distance} <span className="text-[9px] font-semibold text-text-secondary/80">{activity.activity_type?.slug === 'swimming' ? 'meters' : 'km'}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes content */}
            {activity.notes && (
              <div className="space-y-2 border-t border-border/5 pt-4">
                <h4 className="text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider">Notes</h4>
                <p className="text-text-primary font-medium leading-relaxed bg-surface-hover/30 border border-border/10 p-3 rounded-xl italic">
                  "{activity.notes}"
                </p>
              </div>
            )}

            {/* Photos section */}
            <div className="space-y-3 border-t border-border/5 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase font-bold text-text-secondary/70 tracking-wider">Session Photos</h4>
                <button
                  onClick={() => setShowPhotoInput(prev => !prev)}
                  className="text-[9px] font-black text-accent uppercase tracking-wider flex items-center gap-1 hover:underline outline-none"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Photo</span>
                </button>
              </div>

              {/* Photo Input Field */}
              {showPhotoInput && (
                <form onSubmit={handleAddPhoto} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Enter image URL..."
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="flex-1 bg-surface-hover/55 border border-border/15 rounded-xl px-3 py-1.5 text-[10px] focus:border-accent/40 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all outline-none"
                  >
                    Add
                  </button>
                </form>
              )}

              {/* Photos List Grid */}
              {activity.photos && activity.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {activity.photos.map((ph, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-border/10 bg-surface-hover/20 aspect-video group shadow-sm">
                      <img
                        src={ph}
                        alt={`Activity illustration ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                        onError={(e) => {
                          // fallback
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border/20 rounded-xl p-6 flex flex-col items-center justify-center text-text-secondary/30 gap-1.5 select-none">
                  <Camera className="h-6 w-6" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">No photos uploaded</span>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-border/10 bg-surface/50 text-center select-none text-[10px] font-semibold text-text-secondary/40">
        Logged at: {activity?.created_at ? new Date(activity.created_at).toLocaleString() : '—'}
      </div>
    </div>
  );
};
