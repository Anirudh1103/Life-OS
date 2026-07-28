import { useMemo } from 'react';
import { useUIStore } from '@/store/uiStore';
import { ToastVariant } from '@/types';

export function useToast() {
  const toasts = useUIStore((state) => state.toasts);
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);

  const toast = useMemo(
    () => (options: { title: string; description?: string; variant?: ToastVariant }) => {
      addToast({ ...options, variant: options.variant ?? 'default' });
    },
    [addToast],
  );

  return {
    toasts,
    toast,
    removeToast,
  };
}
