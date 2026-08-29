import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Square, CheckSquare, Calendar } from 'lucide-react';

interface JarvisResponseCardProps {
  text: string;
  onChipClick: (prompt: string) => void;
}

// Custom Markdown styling nodes to map inline components cleanly
const inlineMarkdownComponents = {
  p: ({ children }: any) => <span className="inline">{children}</span>,
  strong: ({ children }: any) => <strong className="font-black text-[#38bdf8]">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-cyan-400/80">{children}</em>,
  a: ({ href, children }: any) => <a href={href} target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">{children}</a>
};

const generalMarkdownComponents = {
  p: ({ children }: any) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }: any) => <strong className="font-black text-[#38bdf8]">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-cyan-400/80">{children}</em>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 space-y-1.5 my-2.5 text-slate-300">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 space-y-1.5 my-2.5 text-slate-300">{children}</ol>,
  li: ({ children }: any) => <li className="text-slate-300">{children}</li>,
  a: ({ href, children }: any) => <a href={href} target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">{children}</a>
};

export const JarvisResponseCard: React.FC<JarvisResponseCardProps> = ({ text, onChipClick }) => {
  // Parse message text into components
  const lines = text.split('\n');
  const pendingTasks: { title: string; workspace?: string; priority?: string }[] = [];
  const completedTasks: string[] = [];
  const suggestionChips: string[] = [];
  
  let greeting = '';
  let fitnessPlan = '';
  const generalTexts: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 1. Parse Suggestion Chips: e.g. [Prioritize task]
    const chipMatch = trimmed.match(/^\[([^[\]]+)\]$/);
    if (chipMatch && !trimmed.startsWith('[COMMAND:') && !trimmed.startsWith('[ ]') && !trimmed.startsWith('[x]')) {
      suggestionChips.push(chipMatch[1]);
      return;
    }

    // 2. Parse Checklist tasks (Pending / Completed)
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('[ ]')) {
      const taskContent = trimmed.replace(/^-\s*\[\s*\]\s*/, '').replace(/^\[\s*\]\s*/, '');
      const parts = taskContent.split('|');
      pendingTasks.push({
        title: parts[0]?.trim(),
        workspace: parts[1]?.trim() as any,
        priority: parts[2]?.trim() as any
      });
      return;
    }

    if (trimmed.startsWith('- [x]') || trimmed.startsWith('[x]')) {
      const taskContent = trimmed.replace(/^-\s*\[x\]\s*/, '').replace(/^\[x\]\s*/, '');
      completedTasks.push(taskContent.trim());
      return;
    }

    // 3. Parse Fitness status
    if (trimmed.toLowerCase().startsWith('fitness:') || trimmed.toLowerCase().startsWith('workout:') || trimmed.toLowerCase().includes('rest day')) {
      fitnessPlan = trimmed.replace(/^(fitness|workout):\s*/i, '');
      return;
    }

    // 4. Parse Greeting (usually first descriptive line)
    if (!greeting && (
      trimmed.toLowerCase().includes('good morning') || 
      trimmed.toLowerCase().includes('good evening') || 
      trimmed.toLowerCase().includes('good day') || 
      trimmed.toLowerCase().includes('hello') || 
      trimmed.toLowerCase().includes('hi, sir') || 
      trimmed.toLowerCase().includes('hi, boss') || 
      trimmed.toLowerCase().includes('sir & boss') || 
      trimmed.toLowerCase().includes('sir or boss')
    )) {
      greeting = trimmed;
      return;
    }

    // 5. Default paragraphs
    // Exclude command tags
    if (!trimmed.startsWith('[COMMAND:')) {
      generalTexts.push(trimmed);
    }
  });

  return (
    <div className="space-y-4 text-xs font-semibold text-text-secondary select-none text-left">
      
      {/* A. Greeting Banner Card */}
      {greeting && (
        <div className="relative overflow-hidden p-4 rounded-2xl border border-accent/20 bg-accent/[0.02] bg-gradient-to-r from-accent/5 to-transparent">
          <div className="absolute top-0 right-0 h-10 w-10 bg-accent/15 rounded-full blur-xl pointer-events-none" />
          <div className="text-xs font-extrabold text-white leading-normal">
            <ReactMarkdown components={generalMarkdownComponents}>{greeting}</ReactMarkdown>
          </div>
          <p className="text-[8.5px] uppercase tracking-wider font-black text-accent mt-1">
            System Synchronization Complete &middot; Today's Overview
          </p>
        </div>
      )}

      {/* B. Pending Tasks Card */}
      {pendingTasks.length > 0 && (
        <div className="glass-panel p-4.5 rounded-2xl border border-white/[0.08] bg-white/[0.01] space-y-3">
          <h4 className="text-[9px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Pending Action Items ({pendingTasks.length})
          </h4>

          <div className="space-y-2">
            {pendingTasks.map((t, idx) => {
              const isHigh = t.priority?.toLowerCase() === 'high';
              const isMed = t.priority?.toLowerCase() === 'medium';
              const isLow = t.priority?.toLowerCase() === 'low';
              
              const priorityColor = 
                isHigh ? 'text-red-400 bg-red-500/10 border-red-500/10' :
                isMed ? 'text-amber-400 bg-amber-500/10 border-amber-500/10' :
                isLow ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' : 'text-slate-400 bg-slate-500/10';

              return (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-surface-hover/20 border border-border/10 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Square className="h-4 w-4 text-text-secondary/30 shrink-0" />
                    <span className="font-bold text-white leading-tight truncate">
                      <ReactMarkdown components={inlineMarkdownComponents}>{t.title}</ReactMarkdown>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {t.workspace && (
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-surface/80 border border-border/20 text-text-secondary/60">
                        {t.workspace}
                      </span>
                    )}
                    {t.priority && (
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${priorityColor}`}>
                        {t.priority}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* C. Fitness Plan Capsule */}
      {fitnessPlan && (
        <div className="p-3.5 bg-purple-500/10 border border-purple-500/25 rounded-2xl flex items-start gap-3">
          <Calendar className="h-4.5 w-4.5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h5 className="text-[9px] font-black uppercase tracking-wider text-purple-300">Fitness Routine Status</h5>
            <div className="text-[10px] font-bold text-white leading-snug">
              <ReactMarkdown components={inlineMarkdownComponents}>{fitnessPlan}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* D. Completed Checklist Items */}
      {completedTasks.length > 0 && (
        <div className="glass-panel p-4.5 rounded-2xl border border-white/[0.08] bg-white/[0.01] space-y-2.5">
          <h4 className="text-[9px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Completed Checklist Today ({completedTasks.length})
          </h4>
          <div className="space-y-1.5">
            {completedTasks.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2.5 py-0.5 opacity-65">
                <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white line-through leading-tight">
                  <ReactMarkdown components={inlineMarkdownComponents}>{t}</ReactMarkdown>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. Regular Response Text paragraphs */}
      {generalTexts.length > 0 && (
        <div className="space-y-2 text-text-secondary/90 leading-relaxed text-xs">
          {generalTexts.map((paragraph, idx) => (
            <ReactMarkdown key={idx} components={generalMarkdownComponents}>{paragraph}</ReactMarkdown>
          ))}
        </div>
      )}

      {/* F. Action Quick-Suggestion Chips */}
      {suggestionChips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.04]">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChipClick(chip)}
              className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/25 hover:border-accent/40 rounded-full text-[9px] font-black uppercase tracking-wider text-accent hover:text-white transition-all shadow-sm active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

    </div>
  );
};
