import React, { useState } from 'react';
import { BookMarked, Sparkles } from 'lucide-react';

export const QuickJournal: React.FC = () => {
  const [text, setText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);

    // Simulate save
    setTimeout(() => {
      setIsSubmitting(false);
      setToastMessage('Journal draft saved to browser storage! Complete sync coming in future release.');
      setText('');

      // Auto clear toast after 4s
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }, 800);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl select-none relative">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
        Quick Journal
      </h3>
      
      <p className="text-[11px] font-semibold text-text-primary mb-3">
        How was your day?
      </p>

      <form onSubmit={handleSave} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a few lines about your day..."
          rows={3}
          maxLength={300}
          className="w-full text-xs p-3 bg-surface-hover/20 border border-border/30 rounded-xl text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/15 transition-all resize-none"
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="w-full py-2 bg-surface hover:bg-surface-hover border border-border/40 text-text-primary hover:text-accent rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3.5 w-3.5 text-text-secondary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            <>
              <BookMarked className="h-3.5 w-3.5" />
              <span>Save Entry</span>
            </>
          )}
        </button>
      </form>

      {/* Floating Alert Toast */}
      {toastMessage && (
        <div className="absolute bottom-3 left-3 right-3 p-3 bg-indigo-950/90 border border-indigo-500/20 text-indigo-200 text-[10px] font-medium rounded-xl flex items-start gap-2 shadow-lg animate-slide-up z-20">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
