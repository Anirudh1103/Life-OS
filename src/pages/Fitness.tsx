import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type FitnessActivity, type RoutineItem, type BodyMeasurement } from '../services/supabase';
import { FitnessDashboard } from '../components/fitness/FitnessDashboard';
import { ActivityLogTab } from '../components/fitness/ActivityLogTab';
import { RoutinePlannerTab } from '../components/fitness/RoutinePlannerTab';
import { StrengthTrainingTab } from '../components/fitness/StrengthTrainingTab';
import { BodyMetricsTab } from '../components/fitness/BodyMetricsTab';
import { LogActivityModal } from '../components/fitness/LogActivityModal';
import { ActivityDetailDrawer } from '../components/fitness/ActivityDetailDrawer';
import { LayoutDashboard, Calendar, ClipboardList, Dumbbell, BarChart3, Loader2 } from 'lucide-react';

type Tab = 'dashboard' | 'activities' | 'routine' | 'strength' | 'metrics';

export const Fitness: React.FC = () => {
  const { user } = useAuth();
  
  // Navigation & Modal triggers
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Pre-fill parameters when logging a planned routine item
  const [defaultLogTypeSlug, setDefaultLogTypeSlug] = useState<string | undefined>(undefined);
  const [defaultLogDate, setDefaultLogDate] = useState<string | undefined>(undefined);

  // States
  const [activities, setActivities] = useState<FitnessActivity[]>([]);
  const [streak, setStreak] = useState<{ current: number; best: number }>({ current: 0, best: 0 });
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [weekStartStr, setWeekStartStr] = useState<string>('');

  // Initializing week start to current Monday
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    setWeekStartStr(monday.toISOString().split('T')[0]);
  }, []);

  const loadAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch activities
      const acts = await dbService.getFitnessActivities(user.id);
      setActivities(acts);

      // 2. Fetch active streak
      const strk = await dbService.getFitnessStreak(user.id);
      setStreak(strk);

      // 3. Fetch weekly routines
      if (weekStartStr) {
        const routine = await dbService.getOrCreateWeeklyRoutine(user.id, weekStartStr);
        setRoutineItems(routine.items || []);
      }

      // 4. Fetch body measurements
      const metrics = await dbService.getBodyMeasurements(user.id);
      setMeasurements(metrics);

    } catch (err) {
      console.error('Failed to load fitness data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && weekStartStr) {
      loadAllData();
    }
  }, [user, weekStartStr]);

  // Handle log completed planned trigger
  const handleTriggerLogPlanned = (item: RoutineItem) => {
    // Determine the date of that day in the current active week
    const monday = new Date(weekStartStr);
    const dayOffset = item.day_of_week === 0 ? 6 : item.day_of_week - 1; // Mon=1, Sun=0 mapping
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayOffset);
    
    setDefaultLogDate(targetDate.toISOString().split('T')[0]);
    setDefaultLogTypeSlug(item.activity_type?.slug);
    setShowLogModal(true);
  };


  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'activities', label: 'Activity Log', icon: ClipboardList },
    { id: 'routine', label: 'Routine Planner', icon: Calendar },
    { id: 'strength', label: 'Strength Training', icon: Dumbbell },
    { id: 'metrics', label: 'Body Metrics', icon: BarChart3 }
  ];

  if (!user) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs select-none">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/10 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-accent">Fitness Console</span>
          <h2 className="text-lg font-extrabold tracking-tight text-text-primary mt-0.5">Stay fit & strong</h2>
        </div>

        {/* Premium Tab Navigation Switcher Bar */}
        <div className="flex items-center gap-1.5 bg-surface border border-border/10 p-1 rounded-2xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  setSelectedActivityId(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[9px] active:scale-95 transition-all outline-none ${
                  isActive
                    ? 'bg-accent text-white shadow shadow-accent/15'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SKELETON LOADER DURING INITS */}
      {loading && activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 animate-pulse">Syncing Fitness Console</span>
        </div>
      ) : (
        <div className="transition-all duration-300">
          {/* TAB VIEWS */}
          {activeTab === 'dashboard' && (
            <FitnessDashboard
              activities={activities}
              streak={streak}
              onLogActivityClick={() => {
                setDefaultLogDate(undefined);
                setDefaultLogTypeSlug(undefined);
                setShowLogModal(true);
              }}
              onViewAllClick={() => setActiveTab('activities')}
              onActivitySelect={setSelectedActivityId}
            />
          )}

          {activeTab === 'activities' && (
            <ActivityLogTab
              activities={activities}
              onLogActivityClick={() => {
                setDefaultLogDate(undefined);
                setDefaultLogTypeSlug(undefined);
                setShowLogModal(true);
              }}
              onActivitySelect={setSelectedActivityId}
            />
          )}

          {activeTab === 'routine' && (
            <RoutinePlannerTab
              routineItems={routineItems}
              userId={user.id}
              weekStartStr={weekStartStr}
              onWeekChange={setWeekStartStr}
              onRefreshItems={loadAllData}
              onTriggerLogPlanned={handleTriggerLogPlanned}
            />
          )}

          {activeTab === 'strength' && (
            <StrengthTrainingTab
              userId={user.id}
              onRefreshActivities={loadAllData}
            />
          )}

          {activeTab === 'metrics' && (
            <BodyMetricsTab
              measurements={measurements}
              userId={user.id}
              onRefreshMetrics={loadAllData}
            />
          )}
        </div>
      )}

      {/* Renders Drawer for Activity details breakdown */}
      <ActivityDetailDrawer
        activityId={selectedActivityId}
        isOpen={selectedActivityId !== null}
        onClose={() => setSelectedActivityId(null)}
        onActivityDeleted={loadAllData}
        userId={user.id}
      />

      {/* Renders Log Activity Form Modal */}
      <LogActivityModal
        isOpen={showLogModal}
        onClose={() => {
          setShowLogModal(false);
          setDefaultLogDate(undefined);
          setDefaultLogTypeSlug(undefined);
        }}
        onActivityLogged={loadAllData}
        userId={user.id}
        defaultDate={defaultLogDate}
        defaultTypeSlug={defaultLogTypeSlug}
      />

    </div>
  );
};
