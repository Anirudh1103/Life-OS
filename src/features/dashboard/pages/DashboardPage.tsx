import { Sparkles, Users, Activity, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';

function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Welcome to Life OS" description="A clean foundation for planning, fitness, and premium goal management." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Sparkles} label="Productive streak" value="7 days" />
        <StatCard icon={Activity} label="Daily focus" value="3 checkpoints" />
        <StatCard icon={Users} label="Connected users" value="2 accounts" />
        <StatCard icon={CheckCircle2} label="Goals set" value="12 items" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="space-y-4 p-6">
          <SectionHeader title="Quick start" description="Phase 1 foundation with secure access, admin controls, and a modular shell." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-500">Manage your profile</p>
              <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">Update your profile settings and preferences to stay organized.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-500">Admin insights</p>
              <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">Create users, manage roles, and preview the future exercise library.</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-4 p-6">
          <SectionHeader title="System status" description="A stable foundation for future features." />
          <div className="grid gap-3">
            <div className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <p className="font-medium">Authentication</p>
              <p className="mt-1 text-slate-500">Firebase auth and session persistence are ready for your users.</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <p className="font-medium">Database design</p>
              <p className="mt-1 text-slate-500">Typed Firestore collections are in place for users and exercise library.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
