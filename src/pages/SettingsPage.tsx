import { Divider } from '@/components/ui/Divider';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { useTheme } from '@/hooks/useTheme';

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" description="Control theme, notifications, and account preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Theme</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light, dark, and system preferences.</p>
            </div>
            <Toggle checked={theme === 'dark'} onCheckedChange={toggleTheme} label="Dark mode" />
          </div>
        </Card>
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Notifications</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Toast notifications keep you informed when actions complete successfully.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-700 dark:text-slate-200">Notification delivery is enabled by default for key actions, admin events, and account updates.</p>
          </div>
        </Card>
      </div>
      <Divider />
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Future preferences</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Additional personalization options for goals, workouts, meals, and shared experiences will be added in later phases.</p>
      </Card>
    </div>
  );
}

export default SettingsPage;
