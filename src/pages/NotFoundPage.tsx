import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <Card className="w-full max-w-xl border border-slate-200 bg-white/95 p-10 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">404</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">Page not found</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">The page you are looking for does not exist or has been moved. Return to the dashboard to continue.</p>
        <Link to="/dashboard">
          <Button className="mt-8">Go to dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}

export default NotFoundPage;
