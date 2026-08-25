import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Info,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import type { 
  FinanceBudget, 
  FinanceCategory,
  FinanceTransaction 
} from '../../services/supabase';

interface BudgetsProps {
  budgets: FinanceBudget[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  onCreateBudget: (budget: Omit<FinanceBudget, 'id'>) => Promise<any>;
  onUpdateBudget: (budgetId: string, budget: Partial<FinanceBudget>) => Promise<any>;
  onDeleteBudget: (budgetId: string) => Promise<any>;
  userId: string;
}

export const FinanceBudgets: React.FC<BudgetsProps> = ({
  budgets,
  categories,
  transactions,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
  userId
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBudget, setSelectedBudget] = useState<FinanceBudget | null>(null);

  // Form states
  const [budName, setBudName] = useState('');
  const [budCategory, setBudCategory] = useState('');
  const [budAmount, setBudAmount] = useState('5000');
  const [budCarryover, setBudCarryover] = useState(false);
  const [budPeriod, setBudPeriod] = useState<'weekly' | 'monthly' | 'custom'>('monthly');

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Calculate stats
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const elapsedDays = today.getDate();
  const timeElapsedPercent = Math.round((elapsedDays / daysInMonth) * 100);

  // Filter transactions for current month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const activeMonthTransactions = transactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d >= startOfMonth && d <= endOfMonth;
  });

  const getBudgetsWithProgress = () => {
    return budgets.map(b => {
      // Find spent amount in category
      const spent = activeMonthTransactions
        .filter(t => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((sum, curr) => sum + Number(curr.amount), 0);

      // Carryover logic simulation (If enabled, assume ₹2,000 carryover from July for demo)
      const carryover = b.carryover_enabled ? 2000 : 0;
      const totalLimit = b.amount + carryover;
      const remaining = Math.max(0, totalLimit - spent);
      const percentage = totalLimit > 0 ? Math.min(100, Math.round((spent / totalLimit) * 100)) : 0;

      // Deterministic Velocity Alert:
      // If spending percentage exceeds the time elapsed percentage of the month by 10% or more, warn user.
      const isTrendingFast = percentage > timeElapsedPercent + 10 && remaining > 0;

      return {
        ...b,
        spent,
        totalLimit,
        remaining,
        percentage,
        carryover,
        isTrendingFast
      };
    });
  };

  // Submit Handler
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(budAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const payload = {
      user_id: userId,
      category_id: budCategory || null,
      name: budName || (categories.find(c => c.id === budCategory)?.name || 'Overall') + ' Budget',
      period_type: budPeriod,
      amount: amountNum,
      carryover_enabled: budCarryover,
      start_date: startOfMonth.toISOString(),
      end_date: endOfMonth.toISOString()
    };

    if (modalMode === 'create') {
      await onCreateBudget(payload);
    } else if (modalMode === 'edit' && selectedBudget) {
      await onUpdateBudget(selectedBudget.id, payload);
    }

    setIsModalOpen(false);
    setSelectedBudget(null);
  };

  // Edit Trigger
  const openEditModal = (budget: FinanceBudget) => {
    setSelectedBudget(budget);
    setModalMode('edit');
    setBudName(budget.name);
    setBudCategory(budget.category_id || '');
    setBudAmount(budget.amount.toString());
    setBudCarryover(budget.carryover_enabled);
    setBudPeriod(budget.period_type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await onDeleteBudget(id);
    setDeleteConfirmId(null);
  };

  const budgetsProgress = getBudgetsWithProgress();
  const overallLimit = budgetsProgress.reduce((sum, curr) => sum + curr.totalLimit, 0);
  const overallSpent = budgetsProgress.reduce((sum, curr) => sum + curr.spent, 0);
  const overallRemaining = Math.max(0, overallLimit - overallSpent);
  const overallPercent = overallLimit > 0 ? Math.round((overallSpent / overallLimit) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header and Add Action */}
      <div className="flex justify-between items-center bg-surface/10 p-3 rounded-2xl border border-border/10">
        <div>
          <h2 className="text-xs font-bold text-text-primary tracking-wide">Monthly Budget Planner</h2>
          <p className="text-[9px] text-text-secondary font-medium">Month progress: {elapsedDays} / {daysInMonth} days elapsed ({timeElapsedPercent}%)</p>
        </div>
        <button
          onClick={() => {
            setModalMode('create');
            setBudName('');
            setBudCategory(categories[0]?.id || '');
            setBudAmount('5000');
            setBudCarryover(false);
            setBudPeriod('monthly');
            setIsModalOpen(true);
          }}
          className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-black tracking-wide flex items-center gap-1.5 transition-all outline-none"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Budget
        </button>
      </div>

      {/* Overall Budget Header Card */}
      {overallLimit > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/20 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div>
              <h3 className="font-extrabold text-text-primary tracking-wide uppercase text-[10px]">Overall Budget Cap</h3>
              <p className="text-[9px] text-text-secondary mt-0.5">Summary of all active budgets combined</p>
            </div>
            <span className="font-black text-text-primary font-mono">₹{overallSpent.toLocaleString('en-IN')} / ₹{overallLimit.toLocaleString('en-IN')}</span>
          </div>

          <div className="relative h-2.5 w-full bg-surface-hover rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                overallPercent > 85 ? 'bg-danger' : overallPercent > 65 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${overallPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[9px] text-text-secondary font-bold">
            <span>{overallPercent}% budget utilized</span>
            <span>₹{overallRemaining.toLocaleString('en-IN')} remaining limit</span>
          </div>
        </div>
      )}

      {/* Budgets Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgetsProgress.length === 0 ? (
          <div className="glass-panel py-16 rounded-2xl flex flex-col items-center justify-center text-center max-w-sm mx-auto border-dashed col-span-full">
            <Info className="h-10 w-10 text-text-secondary/40 mb-2" />
            <h4 className="text-xs font-bold text-text-primary">No Budgets Programmed</h4>
            <p className="text-[10px] text-text-secondary mt-1 max-w-[200px]">
              Set spending envelopes per category to prevent overspending.
            </p>
          </div>
        ) : (
          budgetsProgress.map((b) => (
            <div 
              key={b.id}
              className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/10 flex flex-col justify-between min-h-[160px] space-y-4 group"
            >
              {/* Card Top */}
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: b.category_color }} />
                    <h4 className="text-[11px] font-black text-text-primary truncate max-w-[120px]">{b.name}</h4>
                  </div>
                  {b.carryover_enabled && (
                    <span className="inline-block mt-1 text-[8px] font-bold text-success bg-success/10 border border-success/15 px-1.5 py-0.5 rounded-md">
                      Carryover enabled (+₹{b.carryover.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>

                {/* Edit/Delete controls */}
                <div className="flex items-center gap-1 opacity-65 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(b)}
                    className="p-1 rounded bg-surface border border-border/10 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(b.id)}
                    className="p-1 rounded bg-surface border border-border/10 text-text-secondary hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Progress and values */}
              <div className="space-y-1.5 text-left text-[10px]">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-text-secondary uppercase text-[8.5px] tracking-wider">Spent Utilization</span>
                  <span className="text-text-primary">₹{b.spent.toLocaleString('en-IN')} / ₹{b.totalLimit.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="relative h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      b.percentage > 85 ? 'bg-danger' : b.percentage > 65 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[8.5px] font-extrabold">
                  <span className="text-text-secondary">{b.percentage}% used</span>
                  <span className={b.remaining === 0 ? 'text-danger' : 'text-text-secondary'}>
                    ₹{b.remaining.toLocaleString('en-IN')} remaining
                  </span>
                </div>
              </div>

              {/* Card Footer Warning Alarms */}
              {deleteConfirmId === b.id ? (
                <div className="flex items-center justify-between bg-danger/10 border border-danger/25 rounded-lg p-2 text-[8.5px] font-bold">
                  <span className="text-danger">Delete Budget?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirmId(null)} className="text-text-secondary hover:text-text-primary">No</button>
                    <button onClick={() => handleDelete(b.id)} className="text-danger hover:underline">Yes</button>
                  </div>
                </div>
              ) : b.isTrendingFast ? (
                <div className="flex items-center gap-1.5 bg-warning/10 border border-warning/20 rounded-lg p-2 text-[8.5px] font-bold text-warning leading-normal text-left">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                  <span>You're spending slightly faster than planned.</span>
                </div>
              ) : b.percentage === 100 ? (
                <div className="flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-lg p-2 text-[8.5px] font-bold text-danger leading-normal text-left">
                  <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0" />
                  <span>Budget completely exhausted!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-lg p-2 text-[8.5px] font-bold text-success leading-normal text-left">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  <span>Spending velocity within budget targets.</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Budget Edit/Create Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveBudget}
            className="w-full max-w-sm bg-surface border border-border/20 rounded-2xl p-6 space-y-4 shadow-2xl select-none"
          >
            <div className="flex justify-between items-center border-b border-border/10 pb-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                {modalMode === 'create' ? 'Create Budget' : 'Edit Budget'}
              </h4>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Budget Name</label>
              <input
                type="text"
                value={budName}
                onChange={(e) => setBudName(e.target.value)}
                placeholder="e.g. Food Budget"
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Category Target</label>
                <select
                  value={budCategory}
                  onChange={(e) => setBudCategory(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Period Cycle</label>
                <select
                  value={budPeriod}
                  onChange={(e) => setBudPeriod(e.target.value as any)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Limit Amount (₹)</label>
              <input
                type="number"
                value={budAmount}
                onChange={(e) => setBudAmount(e.target.value)}
                required
                min="100"
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary focus:outline-none focus:border-accent/40"
              />
            </div>

            {/* Carryover toggle */}
            <div className="flex items-center justify-between bg-surface-hover/30 border border-border/10 rounded-xl p-3 text-[10px] font-bold text-left">
              <div>
                <p className="text-text-primary">Enable Carryover</p>
                <p className="text-[8px] text-text-secondary font-medium mt-0.5 leading-normal">
                  Remaining funds at month end will carry over and increase the next month's limits.
                </p>
              </div>
              <input
                type="checkbox"
                checked={budCarryover}
                onChange={(e) => setBudCarryover(e.target.checked)}
                className="h-4.5 w-4.5 accent-accent cursor-pointer"
              />
            </div>

            {/* Form actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="py-2 border border-border/20 text-text-secondary rounded-xl text-[9px] font-black uppercase hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-accent/20 transition-colors"
              >
                {modalMode === 'create' ? 'Save' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
