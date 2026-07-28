import { ShieldAlert, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

function AdminPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Admin console" description="Manage users, the exercise library, and the structure for future growth." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">User management</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Create and approve user accounts</h2>
            </div>
          </div>
          <Link to="/admin/users">
            <Button className="mt-6" variant="secondary">
              Open users
            </Button>
          </Link>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Exercise library</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Build the foundation for workouts and activities</h2>
            </div>
          </div>
          <Link to="/admin/exercises">
            <Button className="mt-6" variant="secondary">
              Open exercise library
            </Button>
          </Link>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">System controls</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">Role access, active state, and audit-ready workflow</h2>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminPage;
