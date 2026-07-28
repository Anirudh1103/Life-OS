import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function ToastViewport() {
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id);
      }, 5000),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [toasts, removeToast]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="group flex min-w-[300px] items-start justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-soft transition dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">{toast.title}</p>
              {toast.description ? <p className="text-sm text-slate-500 dark:text-slate-400">{toast.description}</p> : null}
            </div>
          </div>
          <button type="button" onClick={() => removeToast(toast.id)} className="text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
