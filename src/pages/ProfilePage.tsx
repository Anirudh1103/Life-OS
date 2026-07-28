import { useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuth } from '@/hooks/useAuth';

function ProfilePage() {
  const { user } = useAuth();

  const metadata = useMemo(
    () => [
      { label: 'Email', value: user?.email ?? 'n/a' },
      { label: 'Role', value: user?.role ?? 'user' },
      { label: 'Status', value: user?.isActive ? 'Active' : 'Disabled' },
      { label: 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'n/a' },
    ],
    [user],
  );

  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Your account details and active membership." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="space-y-5 p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name ?? 'Guest'} src={user?.photoURL} size="lg" />
            <div>
              <p className="text-xl font-semibold text-slate-950 dark:text-white">{user?.name ?? 'Guest user'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.role === 'admin' ? 'Administrator' : 'Personal user'}</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            This profile page is a starting point for richer account settings, preferences, and personalization in later phases.
          </p>
        </Card>
        <Card className="p-6">
          <div className="space-y-4">
            {metadata.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ProfilePage;
