import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex bg-slate-950/50">
      <div className="ml-auto h-full w-full max-w-md overflow-auto rounded-l-[2rem] bg-white p-6 shadow-soft dark:bg-slate-950">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
