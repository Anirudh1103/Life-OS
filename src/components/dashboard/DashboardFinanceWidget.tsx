import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, ArrowUpRight, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface FinanceWidgetProps {
  balance: number;
  spent: number;
  saved: number;
  budgetSpent: number;
  budgetLimit: number;
  upcomingBill: { name: string; amount: number; due_date: string } | null;
  isLoading: boolean;
}

export const DashboardFinanceWidget: React.FC<FinanceWidgetProps> = ({
  balance,
  spent,
  saved,
  budgetSpent,
  budgetLimit,
  upcomingBill,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/20 min-h-[220px] flex items-center justify-center">
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-secondary animate-pulse">Loading finance widget...</span>
      </div>
    );
  }

  const budgetPercent = budgetLimit > 0 ? Math.min(100, Math.round((budgetSpent / budgetLimit) * 100)) : 0;

  return (
    <div className="glass-panel p-4.5 rounded-2xl border border-border/10 bg-surface/10 hover:border-border/20 transition-all text-left">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6.5 w-6.5 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
            <Coins className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">Finance Snapshot</span>
        </div>
        <Link 
          to="/finance" 
          className="text-[9px] font-extrabold uppercase tracking-wide text-accent flex items-center gap-0.5 hover:underline"
        >
          Open Finance
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Primary Balance Metrics */}
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <div className="space-y-0.5">
          <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Total Balance</span>
          <h4 className="text-sm font-black text-text-primary tracking-wide">₹{balance.toLocaleString('en-IN')}</h4>
        </div>
        <div className="space-y-0.5">
          <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Spent / Saved</span>
          <div className="flex flex-col text-[10px] font-bold text-text-primary">
            <span className="text-danger flex items-center gap-0.5"><TrendingDown className="h-3 w-3 shrink-0" /> ₹{spent.toLocaleString('en-IN')}</span>
            <span className="text-success flex items-center gap-0.5"><TrendingUp className="h-3 w-3 shrink-0" /> ₹{saved.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Budget progress */}
      {budgetLimit > 0 && (
        <div className="border-t border-border/5 pt-3.5 mb-4 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-text-secondary uppercase text-[8.5px] tracking-wider">Overall Budget Cap</span>
            <span className="text-text-primary">₹{budgetSpent.toLocaleString('en-IN')} / ₹{budgetLimit.toLocaleString('en-IN')}</span>
          </div>
          <div className="relative h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                budgetPercent > 85 ? 'bg-danger' : budgetPercent > 65 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Next Upcoming obligation summary */}
      {upcomingBill && (
        <div className="border-t border-border/5 pt-3.5 flex justify-between items-center text-[9px] font-semibold text-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-text-secondary/60 shrink-0" />
            <span>Next: <strong className="text-text-primary">{upcomingBill.name}</strong></span>
          </span>
          <span className="font-mono text-text-primary font-bold">
            ₹{upcomingBill.amount.toLocaleString('en-IN')} • {new Date(upcomingBill.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}
    </div>
  );
};
