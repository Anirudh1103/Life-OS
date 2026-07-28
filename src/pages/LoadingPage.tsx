import { Loader2 } from 'lucide-react';

export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
        <Loader2 className="h-10 w-10 animate-spin text-slate-700 dark:text-slate-200" />
        <p className="text-sm text-slate-600 dark:text-slate-300">Loading the life workspace...</p>
      </div>
    </div>
  );
}
