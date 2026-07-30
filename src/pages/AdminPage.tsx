import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Activity,
  Download,
  Search,
  Plus,
  UserCheck,
  UserX,
  Lock,
  ChevronRight,
  ShieldCheck,
  Play,
  AlertOctagon,
  Bell,
  Trophy
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import { UserRecord } from '@/types/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Enter a name'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['user', 'admin']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

// Sparkline SVG graph component for metrics
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 120;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height - 2; // offset padding
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="h-8 w-24 overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Uptime monitor horizontal ticks
function UptimeMonitor() {
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-1 rounded-sm ${i === 23 ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`}
        />
      ))}
    </div>
  );
}

// Activity Vertical Bars Chart
function ActivityChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="flex h-36 items-end justify-between gap-3 pt-4">
      {days.map((day, i) => {
        const h1 = [25, 45, 65, 30, 80, 50, 40][i];
        const h2 = [40, 30, 50, 60, 45, 35, 60][i];
        const h3 = [15, 20, 35, 10, 55, 40, 25][i];
        return (
          <div key={day} className="flex flex-col items-center flex-1">
            <div className="flex items-end gap-[3px] w-full justify-center h-24">
              <div className="w-[4px] rounded-full bg-indigo-500" style={{ height: `${h1}%` }}></div>
              <div className="w-[4px] rounded-full bg-emerald-500" style={{ height: `${h2}%` }}></div>
              <div className="w-[4px] rounded-full bg-amber-500" style={{ height: `${h3}%` }}></div>
            </div>
            <span className="mt-2 text-[10px] font-medium text-slate-400">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', role: 'user' },
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const items = await userService.listUsers();
      setUsers(items);
    } catch {
      toast({ title: 'Unable to load users', description: 'Please reload to try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

  const onCreateUser = async (values: CreateUserForm) => {
    try {
      await userService.createUser({
        name: values.name,
        email: values.email,
        role: values.role,
      });
      toast({ title: 'User created', description: `${values.name} has been added successfully.`, variant: 'success' });
      form.reset();
      setDialogOpen(false);
      await fetchUsers();
    } catch {
      toast({ title: 'Creation failed', description: 'There was an error creating the user.', variant: 'danger' });
    }
  };

  const onToggleActive = async (user: UserRecord, isActive: boolean) => {
    try {
      await userService.updateUserStatus(user.uid ?? user.id ?? '', isActive);
      await fetchUsers();
      toast({ title: 'Status updated', description: `${user.name} is now ${isActive ? 'active' : 'disabled'}.`, variant: 'success' });
    } catch {
      toast({ title: 'Status update failed', description: 'There was an error updating user status.', variant: 'danger' });
    }
  };

  const onDeleteUser = async (user: UserRecord) => {
    try {
      await userService.softDeleteUser(user.uid ?? user.id ?? '');
      await fetchUsers();
      toast({ title: 'User soft-deleted', description: `${user.name} was successfully disabled and soft deleted.`, variant: 'success' });
    } catch {
      toast({ title: 'Delete failed', description: 'Could not soft delete the user account.', variant: 'danger' });
    }
  };

  const onResetPassword = async (user: UserRecord) => {
    try {
      await sendPasswordReset(user.email);
      toast({ title: 'Reset link sent', description: `Password reset instructions sent to ${user.email}.`, variant: 'success' });
    } catch {
      toast({ title: 'Request failed', description: 'Unable to dispatch password reset request.', variant: 'danger' });
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, searchQuery]);

  return (
    <div className="space-y-8 pb-16 lg:pb-0">
      {/* Top Console Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Overview</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, Admin! Here&apos;s what&apos;s happening with Life OS.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-655 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350">
            Jul 21 – Jul 27, 2024
          </span>
          <Button variant="secondary" size="sm" icon={Download}>
            Export
          </Button>
          <button className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">3</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Metric 1 */}
        <Card className="p-5 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-slate-450 dark:text-slate-400">Total Users</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{users.length || 2}</p>
              <span className="text-[10px] text-emerald-500 font-semibold">↑ 0% <span className="text-slate-400 font-normal">vs last 7d</span></span>
            </div>
            <Sparkline data={[2, 2, 2, 2, 2, 2, 2]} color="#6366f1" />
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="p-5 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-slate-450 dark:text-slate-400">Active Users</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {users.filter(u => u.isActive).length || 2}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold">↑ 0% <span className="text-slate-400 font-normal">vs last 7d</span></span>
            </div>
            <Sparkline data={[2, 2, 2, 2, 2, 2, 2]} color="#10b981" />
          </div>
        </Card>

        {/* Metric 3 */}
        <Card className="p-5 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-slate-450 dark:text-slate-400">Workouts Logged</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">18</p>
              <span className="text-[10px] text-emerald-500 font-semibold">↑ 28% <span className="text-slate-400 font-normal">vs last 7d</span></span>
            </div>
            <Sparkline data={[10, 12, 9, 15, 14, 16, 18]} color="#3b82f6" />
          </div>
        </Card>

        {/* Metric 4 */}
        <Card className="p-5 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-slate-450 dark:text-slate-400">Goals Completed</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">5</p>
              <span className="text-[10px] text-emerald-500 font-semibold">↑ 25% <span className="text-slate-400 font-normal">vs last 7d</span></span>
            </div>
            <Sparkline data={[2, 3, 2, 4, 3, 4, 5]} color="#f59e0b" />
          </div>
        </Card>

        {/* Metric 5 */}
        <Card className="p-5 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-slate-450 dark:text-slate-400">System Health</span>
          </div>
          <div className="mt-4 flex flex-col justify-between h-full">
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">Excellent</p>
              <span className="text-[10px] text-slate-500">100% Uptime</span>
            </div>
            <div className="mt-2.5">
              <UptimeMonitor />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side (User Management Table + Charts) */}
        <div className="space-y-6 lg:col-span-2">
          {/* User Management Panel */}
          <Card className="p-6 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800/60">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">User Management</span>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 rounded-2xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-4 text-xs text-slate-900 outline-none transition focus:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:w-60"
                  />
                </div>
                <Button size="sm" icon={Plus} onClick={() => setDialogOpen(true)}>
                  Add User
                </Button>
              </div>
            </div>

            {/* Responsive custom table wrapper */}
            <div className="mt-6 overflow-x-auto">
              {loading ? (
                <p className="text-center py-6 text-sm text-slate-500">Loading user profiles...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-500">No matching user records found.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800/60 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">User</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Joined On</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/20">
                    {filteredUsers.map((item) => (
                      <tr key={item.uid ?? item.id} className="text-slate-700 dark:text-slate-250">
                        <td className="py-4 font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-[10px]">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{item.name}</span>
                        </td>
                        <td className="py-4 font-medium">{item.email}</td>
                        <td className="py-4">
                          <Badge variant={item.role === 'admin' ? 'success' : 'secondary'}>
                            {item.role}
                          </Badge>
                        </td>
                        <td className="py-4 text-slate-450">Jan 10, 2024</td>
                        <td className="py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450'
                                : 'bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() => onToggleActive(item, !item.isActive)}
                              title={item.isActive ? 'Disable User' : 'Enable User'}
                            >
                              {item.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() => onResetPassword(item)}
                              title="Reset Password Link"
                            >
                              <Lock className="h-3 w-3" />
                            </Button>
                            <Button
                              size="xs"
                              variant="danger"
                              onClick={() => onDeleteUser(item)}
                              title="Soft Delete User"
                            >
                              <AlertOctagon className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* Charts Row */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* System Analytics */}
            <Card className="p-6 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">System Analytics</span>
              <div className="mt-5 space-y-4 text-xs font-semibold">
                <div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-700 dark:text-slate-350">Database Reads</span>
                    <span className="text-slate-400">12.4K (24%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-700 dark:text-slate-350">Database Writes</span>
                    <span className="text-slate-400">3.6K (16%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '16%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-700 dark:text-slate-350">Storage Used</span>
                    <span className="text-slate-400">248 MB (16%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '16%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-700 dark:text-slate-350">Bandwidth Used</span>
                    <span className="text-slate-400">1.2 GB (22%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '22%' }}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* User Activity Chart */}
            <Card className="p-6 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">User Activity Overview</span>
              <ActivityChart />
            </Card>
          </div>
        </div>

        {/* Right Side Column (Activity log, Actions, Reports) */}
        <div className="space-y-6">
          {/* Recent Activity Log */}
          <Card className="p-6 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Recent Activity</span>
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">Anirudh logged a workout</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400">Upper Body Workout • Today, 9:41 AM</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">Partner completed a goal</p>
                  <p className="text-[10px] text-slate-455 dark:text-slate-400">10K Steps in a Day • Today, 8:17 AM</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">Partner added a progress photo</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400">Progress Photo - Jul 27 • Yesterday, 9:22 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">Anirudh logged a run</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400">3.2 km • 24 min • Yesterday, 7:15 AM</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Quick Actions</span>
            <div className="mt-5 space-y-2">
              <button
                onClick={() => setDialogOpen(true)}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-850/60"
              >
                <span>Add New User</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-850/60">
                <span>Manage Exercises</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-850/60">
                <span>Create Challenge</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-850/60">
                <span>System Settings</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </Card>

          {/* Recent Reports */}
          <Card className="p-6 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Recent Reports</span>
            <div className="mt-5 space-y-3">
              {['User Activity Report', 'Workout Analytics Report', 'Goal Progress Report', 'System Performance Report'].map((report, idx) => (
                <div
                  key={report}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs font-medium text-slate-700 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-slate-300"
                >
                  <div>
                    <p className="font-semibold">{report}</p>
                    <span className="text-[10px] text-slate-400">Jul 27, 2024 • {[2.4, 1.8, 1.2, 3.1][idx]} MB</span>
                  </div>
                  <button className="rounded-xl bg-slate-100 p-2 text-slate-655 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog title="Create new user" open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onCreateUser)}>
          <Input label="Name" placeholder="Jenny Doe" {...form.register('name')} error={form.formState.errors.name?.message} />
          <Input label="Email" placeholder="jenny@example.com" {...form.register('email')} error={form.formState.errors.email?.message} />
          <Select label="Role" {...form.register('role')} options={[{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }]} error={form.formState.errors.role?.message} />
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={Plus}>
              Create user
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default AdminPage;
