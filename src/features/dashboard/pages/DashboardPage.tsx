import { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  Settings,
  Plus,
  Play,
  ClipboardList,
  Scale,
  Sun,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  RotateCcw
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { DashboardWidget } from '../components/DashboardWidget';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Modal } from '@/components/ui/Modal';

/**
 * Premium modular dashboard acts as the personal command center.
 * Integrates dynamically with Zustand store for configurations, orders, and checklists.
 */
export default function DashboardPage() {
  const {
    stats,
    widgets,
    isLoading,
    error,
    isCompactMode,
    loadDashboard,
    toggleWidgetVisibility,
    updateWidgetOrder,
    setCompactMode,
    resetWidgets
  } = useDashboardStore();

  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Compute date string
  const dateString = useMemoDate();

  // Handle widget shifting/ordering actions
  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= widgets.length) return;

    const updated = [...widgets];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;

    updateWidgetOrder(updated.map((w) => w.id));
  };

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center space-y-4">
        <p className="text-sm font-semibold text-rose-500">{error}</p>
        <Button onClick={() => void loadDashboard()}>Try Reloading</Button>
      </div>
    );
  }

  // Hero card progress ring geometry
  const svgRadius = 45;
  const circumference = 2 * Math.PI * svgRadius;
  const progressPercent = stats?.dailyProgressPercent ?? 0;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-6 pb-16 lg:pb-0 text-slate-800 dark:text-[#f8fafc]">
      {/* Top Greeting Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {stats?.greeting ?? 'Good morning'}, {stats?.userName ?? 'Anirudh'} ☀️
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">{dateString}</p>
          {stats?.motivationalQuote && (
            <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400 max-w-lg">
              &quot;{stats.motivationalQuote}&quot; — <span className="font-semibold">{stats.quoteAuthor}</span>
            </p>
          )}
        </div>

        {/* Header Right Widgets */}
        <div className="flex items-center gap-3">
          {/* Weather snapshot pill */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-655 dark:border-slate-800 dark:bg-[#11131c] dark:text-slate-300 shadow-soft">
            <Sun className="h-4.5 w-4.5 text-amber-500" />
            <span>{stats?.weatherTemp ?? 24}°C • {stats?.weatherCondition ?? 'Sunny'}</span>
          </div>

          <button className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#11131c] dark:text-slate-300 dark:hover:bg-slate-800 shadow-soft">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500"></span>
          </button>

          <Button variant="secondary" icon={Settings} onClick={() => setSettingsOpen(true)}>
            Customize
          </Button>
        </div>
      </div>

      {/* Hero Today's Summary Card */}
      {stats && (
        <Card className="relative overflow-hidden border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#11131c] grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-indigo-500">Command Center</span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Today&apos;s Focus</h2>
              <p className="text-sm font-semibold text-emerald-500">{stats.todayFocus}</p>
            </div>

            {/* Daily stats rows */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 pt-2">
              <div className="rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-900/40">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Planned Tasks</span>
                <p className="text-base font-extrabold mt-0.5">{stats.plannedActivitiesCount}</p>
              </div>
              <div className="rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-900/40">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Completed</span>
                <p className="text-base font-extrabold mt-0.5">{stats.completedTasksCount}</p>
              </div>
              <div className="rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-900/40">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Calories Burned</span>
                <p className="text-base font-extrabold mt-0.5">{stats.health.calories} kcal</p>
              </div>
              <div className="rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-900/40">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Hydration</span>
                <p className="text-base font-extrabold mt-0.5">{stats.health.waterMl} ml</p>
              </div>
            </div>
          </div>

          {/* Radial progress ring column */}
          <div className="flex flex-col items-center justify-center border-t border-slate-100 pt-4 md:border-t-0 md:border-l md:pt-0 dark:border-slate-800/60">
            <div className="relative flex items-center justify-center">
              <svg className="h-28 w-28 -rotate-90 transform">
                <circle
                  cx="56"
                  cy="56"
                  r={svgRadius}
                  className="stroke-slate-100 dark:stroke-slate-800/60"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={svgRadius}
                  className="stroke-indigo-500 transition-all duration-300"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{progressPercent}%</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Done</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Action Buttons */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-450 dark:text-slate-500">Quick Actions</span>
        <div className="flex flex-wrap gap-3">
          <Button variant="default" icon={Play} className="rounded-xl px-4 py-2.5 text-xs bg-indigo-650 hover:bg-indigo-700">
            Log Workout
          </Button>
          <Button variant="default" icon={Plus} className="rounded-xl px-4 py-2.5 text-xs bg-emerald-650 hover:bg-emerald-700">
            Add Task
          </Button>
          <Button variant="default" icon={ClipboardList} className="rounded-xl px-4 py-2.5 text-xs bg-amber-650 hover:bg-amber-700">
            Add Goal
          </Button>
          <Button variant="default" icon={Scale} className="rounded-xl px-4 py-2.5 text-xs bg-rose-650 hover:bg-rose-700">
            Log Weight
          </Button>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-12 gap-6 pt-4">
        {widgets.map((widget) => (
          <DashboardWidget
            key={widget.id}
            widget={widget}
            stats={stats}
            isLoading={isLoading}
            isCompact={isCompactMode}
          />
        ))}
      </div>

      {/* Customizable Widget settings dialog modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Dashboard Settings" size="md">
        <div className="space-y-6 py-2">
          {/* Layout controls */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/60">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Compact Mode</h4>
              <p className="text-[10px] text-slate-400">Fits more items in widgets with less padding</p>
            </div>
            <Toggle checked={isCompactMode} onCheckedChange={setCompactMode} />
          </div>

          {/* Widget visibility list & sorting */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-450">Active Widgets</span>
              <button
                onClick={resetWidgets}
                className="flex items-center gap-1 text-[9px] font-bold text-rose-500 hover:text-rose-600 transition"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Defaults
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 max-h-60 overflow-y-auto pr-1">
              {widgets.map((w, index) => (
                <div key={w.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleWidgetVisibility(w.id)}
                      className={`text-slate-400 hover:text-indigo-500 transition`}
                      title={w.visible ? 'Hide Widget' : 'Show Widget'}
                    >
                      {w.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-slate-350 dark:text-slate-600" />}
                    </button>
                    <span className={`font-semibold ${w.visible ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600 line-through'}`}>
                      {w.title}
                    </span>
                  </div>
                  {/* Sorting controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveWidget(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <MoveUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveWidget(index, 'down')}
                      disabled={index === widgets.length - 1}
                      className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <MoveDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <Button onClick={() => setSettingsOpen(false)}>Save & Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Hook helper to construct the welcome date header string
function useMemoDate() {
  return useMemo(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }, []);
}
