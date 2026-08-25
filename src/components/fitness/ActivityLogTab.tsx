import React, { useState, useMemo } from 'react';
import { type FitnessActivity } from '../../services/supabase';
import { Dumbbell, Activity, Waves, Timer, Footprints, Sparkles, Plus, Clock, Flame, Heart, ChevronRight, Search } from 'lucide-react';

interface ActivityLogTabProps {
  activities: FitnessActivity[];
  onLogActivityClick: () => void;
  onActivitySelect: (id: string) => void;
}

export const ActivityLogTab: React.FC<ActivityLogTabProps> = ({
  activities,
  onLogActivityClick,
  onActivitySelect
}) => {
  const [filterSlug, setFilterSlug] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filtered list
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchFilter = filterSlug === 'all' || act.activity_type?.slug === filterSlug;
      const notesMatch = act.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const typeMatch = act.activity_type?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const matchSearch = !searchQuery.trim() || notesMatch || typeMatch;
      return matchFilter && matchSearch;
    });
  }, [activities, filterSlug, searchQuery]);

  // 2. Group by date headers (e.g., TODAY, YESTERDAY, AUG 18)
  const groupedActivities = useMemo(() => {
    const groups: Record<string, FitnessActivity[]> = {};
    const todayStr = new Date().toDateString();
    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

    filteredActivities.forEach(act => {
      const actDate = new Date(act.started_at);
      const dateStr = actDate.toDateString();
      let header = '';

      if (dateStr === todayStr) {
        header = 'TODAY';
      } else if (dateStr === yesterdayStr) {
        header = 'YESTERDAY';
      } else {
        header = actDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).toUpperCase();
      }

      if (!groups[header]) {
        groups[header] = [];
      }
      groups[header].push(act);
    });

    return Object.entries(groups);
  }, [filteredActivities]);

  // Filter tabs list
  const filterTabs = [
    { label: 'All Activities', slug: 'all' },
    { label: 'Strength', slug: 'strength_training' },
    { label: 'Badminton', slug: 'badminton' },
    { label: 'Swimming', slug: 'swimming' },
    { label: 'Running', slug: 'running' },
    { label: 'Walking', slug: 'walking' },
    { label: 'Yoga', slug: 'yoga' }
  ];

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
      
      {/* Header bar controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Activity Log</h2>
          <p className="text-[10px] text-text-secondary/60 mt-0.5 font-medium">Log any activity. Stay consistent.</p>
        </div>
        
        <button
          onClick={onLogActivityClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
        >
          <Plus className="h-4 w-4" />
          <span>Log Activity</span>
        </button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-border/10 pb-4">
        {/* Chips */}
        <div className="flex flex-wrap gap-2.5">
          {filterTabs.map(tab => (
            <button
              key={tab.slug}
              onClick={() => setFilterSlug(tab.slug)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all active:scale-95 outline-none text-[10px] uppercase tracking-wider ${
                filterSlug === tab.slug
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface hover:bg-surface-hover/60 border-border/20 text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <input
            type="text"
            placeholder="Search notes or types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface/30 border border-border/25 rounded-xl pl-9 pr-4 py-2 focus:border-accent/40 focus:outline-none transition-colors"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary/40 pointer-events-none" />
        </div>
      </div>

      {/* Activities list grouped by day */}
      {groupedActivities.length === 0 ? (
        <div className="border border-dashed border-border/20 rounded-2xl p-16 text-center text-text-secondary/50 font-bold select-none">
          <p>No activity logs match your search.</p>
          <button
            onClick={onLogActivityClick}
            className="mt-4 text-[10px] font-bold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg transition-all"
          >
            + Log Activity
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedActivities.map(([dateHeader, list]) => (
            <div key={dateHeader} className="space-y-3">
              {/* Date Header Title */}
              <h3 className="text-[10px] font-black text-text-secondary/50 tracking-widest pl-1">
                {dateHeader}
              </h3>
              
              {/* Log cards group */}
              <div className="space-y-3">
                {list.map(act => {
                  const style = getAccentStyles(act.activity_type?.slug);
                  const timeLabel = new Date(act.started_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={act.id}
                      onClick={() => onActivitySelect(act.id)}
                      className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/25 hover:bg-surface/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Icon */}
                        <div className={`h-10 w-10 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center shrink-0 shadow-sm`}>
                          {act.activity_type?.slug === 'strength_training' && <Dumbbell className={`h-5 w-5 ${style.text}`} />}
                          {act.activity_type?.slug === 'badminton' && <Activity className={`h-5 w-5 ${style.text}`} />}
                          {act.activity_type?.slug === 'swimming' && <Waves className={`h-5 w-5 ${style.text}`} />}
                          {act.activity_type?.slug === 'running' && <Timer className={`h-5 w-5 ${style.text}`} />}
                          {act.activity_type?.slug === 'walking' && <Footprints className={`h-5 w-5 ${style.text}`} />}
                          {act.activity_type?.slug === 'yoga' && <Sparkles className={`h-5 w-5 ${style.text}`} />}
                        </div>

                        {/* Title and notes preview */}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-text-primary group-hover:text-accent transition-colors">
                            {act.notes ? act.notes.split('\n')[0] : act.activity_type?.name}
                          </p>
                          <p className="text-[9px] font-bold text-text-secondary/50 mt-0.5 flex items-center gap-1.5">
                            <span>{act.activity_type?.name}</span>
                            <span>•</span>
                            <span>{timeLabel}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right metadata fields */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 border-border/5 pt-2 sm:pt-0">
                        <div className="flex items-center gap-4 text-center select-none text-[9px] font-bold text-text-secondary/60">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-text-secondary/40" />
                            <span className="text-text-primary font-black text-xs">{act.duration_minutes}</span> min
                          </div>
                          {act.calories && (
                            <div className="flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5 text-text-secondary/40" />
                              <span className="text-text-primary font-black text-xs">{act.calories}</span> kcal
                            </div>
                          )}
                          {act.avg_heart_rate && (
                            <div className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5 text-text-secondary/40" />
                              <span className="text-text-primary font-black text-xs">{act.avg_heart_rate}</span> bpm
                            </div>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 text-text-secondary/30 group-hover:text-text-primary group-hover:translate-x-0.5 transition-all hidden sm:block" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
