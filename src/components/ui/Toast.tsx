import { useEffect } from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastVariant } from '@/types';

const variantConfig: Record<ToastVariant, { icon: React.ComponentType<{ className?: string }>; colorClass: string }> = {
  success: { icon: CheckCircle2, colorClass: 'text-emerald-500' },
  danger: { icon: AlertOctagon, colorClass: 'text-rose-500' },
  warning: { icon: AlertTriangle, colorClass: 'text-amber-500' },
  default: { icon: Info, colorClass: 'text-slate-500 dark:text-slate-400' },
};

/**
 * Toast notification viewport container.
 * Subscribes to UI store notifications, rendering styled alerts based on variants.
 */
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
      {toasts.map((toast) => {
        const config = variantConfig[toast.variant ?? 'default'] ?? variantConfig.default;
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className="group flex min-w-[300px] items-start justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-soft transition dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${config.colorClass}`} />
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">{toast.title}</p>
                {toast.description ? <p className="text-sm text-slate-500 dark:text-slate-400">{toast.description}</p> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

