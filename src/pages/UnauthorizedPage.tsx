import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <Card className="w-full max-w-xl border border-slate-200 bg-white/95 p-10 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950 dark:text-white">Unauthorized</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">You do not have permission to access this area. Return to the dashboard or contact your administrator.</p>
        <Link to="/dashboard">
          <Button className="mt-8">Back to dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}

export default UnauthorizedPage;
