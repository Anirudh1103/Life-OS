import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle,
  X,
  Laptop,
  Shield,
  Home,
  Car,
  Gift,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { 
  FinanceGoal 
} from '../../services/supabase';

interface GoalsProps {
  goals: FinanceGoal[];
  onCreateGoal: (goal: Omit<FinanceGoal, 'id'>) => Promise<any>;
  onUpdateGoal: (goalId: string, goal: Partial<FinanceGoal>) => Promise<any>;
  onDeleteGoal: (goalId: string) => Promise<any>;
  userId: string;
}

export const FinanceGoals: React.FC<GoalsProps> = ({
  goals,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  userId
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedGoal, setSelectedGoal] = useState<FinanceGoal | null>(null);

  // Form states
  const [gName, setGName] = useState('');
  const [gTarget, setGTarget] = useState('100000');
  const [gCurrent, setGCurrent] = useState('0');
  const [gTargetDate, setGTargetDate] = useState('2026-12-31');
  const [gIcon, setGIcon] = useState('Target');
  const [gColor, setGColor] = useState('#8B5CF6');
  const [gNotes, setGNotes] = useState('');

  // Contribution modal
  const [isContribOpen, setIsContribOpen] = useState(false);
  const [contribType, setContribType] = useState<'add' | 'withdraw'>('add');
  const [contribAmount, setContribAmount] = useState('5000');
  const [contribGoal, setContribGoal] = useState<FinanceGoal | null>(null);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Icon Helper Map
  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="h-4.5 w-4.5" />;
      case 'Shield': return <Shield className="h-4.5 w-4.5" />;
      case 'Home': return <Home className="h-4.5 w-4.5" />;
      case 'Car': return <Car className="h-4.5 w-4.5" />;
      case 'Gift': return <Gift className="h-4.5 w-4.5" />;
      default: return <Target className="h-4.5 w-4.5" />;
    }
  };

  // Submit Goal
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(gTarget);
    const currentNum = parseFloat(gCurrent);

    const payload = {
      user_id: userId,
      name: gName,
      target_amount: targetNum,
      current_amount: currentNum,
      target_date: new Date(gTargetDate).toISOString(),
      icon: gIcon,
      color: gColor,
      notes: gNotes || null
    };

    if (modalMode === 'create') {
      await onCreateGoal(payload);
    } else if (modalMode === 'edit' && selectedGoal) {
      await onUpdateGoal(selectedGoal.id, payload);
    }

    setIsModalOpen(false);
    setSelectedGoal(null);
  };

  // Submit Contribution
  const handleContribSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0 || !contribGoal) return;

    const diff = contribType === 'add' ? amt : -amt;
    const newCurrent = Math.max(0, contribGoal.current_amount + diff);

    await onUpdateGoal(contribGoal.id, { current_amount: newCurrent });
    setIsContribOpen(false);
    setContribGoal(null);
  };

  // Calculate Pace contributions helper
  const getGoalCalculations = (goal: FinanceGoal) => {
    const today = new Date();
    const target = new Date(goal.target_date);
    
    // Remaining time calculations
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.max(1, Math.round(diffDays / 30));
    const diffWeeks = Math.max(1, Math.round(diffDays / 7));

    const remainingAmount = Math.max(0, goal.target_amount - goal.current_amount);
    const percentage = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;

    const monthlyTarget = remainingAmount > 0 ? Math.round(remainingAmount / diffMonths) : 0;
    const weeklyTarget = remainingAmount > 0 ? Math.round(remainingAmount / diffWeeks) : 0;

    return {
      percentage,
      remainingAmount,
      diffMonths,
      diffDays,
      monthlyTarget,
      weeklyTarget
    };
  };

  const openEditModal = (goal: FinanceGoal) => {
    setSelectedGoal(goal);
    setModalMode('edit');
    setGName(goal.name);
    setGTarget(goal.target_amount.toString());
    setGCurrent(goal.current_amount.toString());
    setGTargetDate(new Date(goal.target_date).toISOString().split('T')[0]);
    setGIcon(goal.icon);
    setGColor(goal.color);
    setGNotes(goal.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await onDeleteGoal(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview and Create Header */}
      <div className="flex justify-between items-center bg-surface/10 p-3 rounded-2xl border border-border/10">
        <div>
          <h2 className="text-xs font-bold text-text-primary tracking-wide">Savings Goals</h2>
          <p className="text-[9px] text-text-secondary font-medium">Tracking and auto target pacing calculator</p>
        </div>
        <button
          onClick={() => {
            setModalMode('create');
            setGName('');
            setGTarget('150000');
            setGCurrent('0');
            setGTargetDate('2026-12-31');
            setGIcon('Target');
            setGColor('#8B5CF6');
            setGNotes('');
            setIsModalOpen(true);
          }}
          className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-black tracking-wide flex items-center gap-1.5 transition-all outline-none"
        >
          <Plus className="h-3.5 w-3.5" />
          New Savings Goal
        </button>
      </div>

      {/* Grid Goals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.length === 0 ? (
          <div className="glass-panel py-16 rounded-2xl flex flex-col items-center justify-center text-center max-w-sm mx-auto border-dashed col-span-full">
            <Target className="h-10 w-10 text-text-secondary/40 mb-2" />
            <h4 className="text-xs font-bold text-text-primary">No Savings Goals Set</h4>
            <p className="text-[10px] text-text-secondary mt-1 max-w-[200px]">
              Setup target goals like a flat, laptop, or emergency reserve.
            </p>
          </div>
        ) : (
          goals.map(g => {
            const calcs = getGoalCalculations(g);
            
            return (
              <div 
                key={g.id}
                className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/10 flex flex-col justify-between min-h-[170px] relative group text-left"
              >
                {/* Header detail */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span 
                      className="h-8 w-8 rounded-lg flex items-center justify-center border"
                      style={{ 
                        backgroundColor: `${g.color}15`, 
                        borderColor: `${g.color}30`,
                        color: g.color
                      }}
                    >
                      {getGoalIcon(g.icon)}
                    </span>
                    <div>
                      <h4 className="text-[11px] font-black text-text-primary tracking-wide">{g.name}</h4>
                      <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider mt-0.5">
                        Target Date: {new Date(g.target_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(g)}
                      className="p-1 rounded bg-surface border border-border/10 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(g.id)}
                      className="p-1 rounded bg-surface border border-border/10 text-text-secondary hover:text-danger transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Progress bar and ratios */}
                <div className="py-2 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-text-secondary uppercase tracking-wider text-[8.5px]">Funding Progress</span>
                    <span className="text-text-primary">
                      ₹{g.current_amount.toLocaleString('en-IN')} / ₹{g.target_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="relative h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300 animate-pulse-subtle"
                      style={{ width: `${calcs.percentage}%`, backgroundColor: g.color }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[8.5px] font-extrabold text-text-secondary">
                    <span>{calcs.percentage}% completed</span>
                    <span>₹{calcs.remainingAmount.toLocaleString('en-IN')} left</span>
                  </div>
                </div>

                {/* Contribution details and action */}
                <div className="border-t border-border/5 pt-3.5 flex justify-between items-center">
                  <div className="text-left text-[8.5px] font-bold text-text-secondary space-y-0.5">
                    <p>Required monthly pacing: <span className="text-text-primary">₹{calcs.monthlyTarget.toLocaleString('en-IN')}/mo</span></p>
                    <p>Required weekly pacing: <span className="text-text-primary">₹{calcs.weeklyTarget.toLocaleString('en-IN')}/wk</span></p>
                  </div>

                  <button
                    onClick={() => {
                      setContribGoal(g);
                      setContribAmount('5000');
                      setContribType('add');
                      setIsContribOpen(true);
                    }}
                    className="py-1 px-3 bg-surface/50 border border-border/15 hover:bg-surface text-text-primary rounded-xl text-[9px] font-bold transition-all outline-none"
                  >
                    Adjust Money
                  </button>
                </div>

                {/* Delete confirm overlay */}
                {deleteConfirmId === g.id && (
                  <div className="absolute inset-0 bg-surface/95 border border-border/20 rounded-2xl p-4 flex flex-col justify-between z-10">
                    <div className="flex items-start gap-2 text-left">
                      <AlertTriangle className="h-4.5 w-4.5 text-danger shrink-0" />
                      <div>
                        <h5 className="text-[10px] font-bold text-danger">Delete Savings Goal?</h5>
                        <p className="text-[8px] text-text-secondary mt-0.5 leading-normal">
                          The goal details and progress metric will be deleted. Saved reserves will return to balance calculation source.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1 bg-surface border border-border/10 rounded-lg text-[8px] font-bold text-text-secondary"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleDelete(g.id)}
                        className="px-3 py-1 bg-danger hover:bg-danger/80 rounded-lg text-[8px] font-bold text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Goal Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveGoal}
            className="w-full max-w-sm bg-surface border border-border/20 rounded-2xl p-6 space-y-4 shadow-2xl select-none"
          >
            <div className="flex justify-between items-center border-b border-border/10 pb-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                {modalMode === 'create' ? 'Create Goal' : 'Edit Goal'}
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
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Goal Name</label>
              <input
                type="text"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                placeholder="e.g. MacBook Pro, Emergency Fund"
                required
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  value={gTarget}
                  onChange={(e) => setGTarget(e.target.value)}
                  required
                  className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                />
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Current Saved (₹)</label>
                <input
                  type="number"
                  value={gCurrent}
                  onChange={(e) => setGCurrent(e.target.value)}
                  required
                  className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-[9px] font-bold text-left">
              <div className="col-span-2">
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={gTargetDate}
                  onChange={(e) => setGTargetDate(e.target.value)}
                  required
                  className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                />
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Theme Color</label>
                <input
                  type="color"
                  value={gColor}
                  onChange={(e) => setGColor(e.target.value)}
                  className="w-full h-7 bg-surface-hover/20 border border-border/20 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Icon Representation</label>
                <select
                  value={gIcon}
                  onChange={(e) => setGIcon(e.target.value)}
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  <option value="Target">Target Goal</option>
                  <option value="Laptop">Laptop / Tech</option>
                  <option value="Shield">Shield / Emergency</option>
                  <option value="Home">Home / Flat</option>
                  <option value="Car">Car / Transit</option>
                  <option value="Gift">Gift / Event</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Notes (Optional)</label>
              <textarea
                value={gNotes}
                onChange={(e) => setGNotes(e.target.value)}
                placeholder="Details of the savings goal..."
                rows={2}
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/20 rounded-lg text-[9px] text-text-primary focus:outline-none"
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

      {/* Adjust Reserves Contribution Modal */}
      {isContribOpen && contribGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleContribSubmit}
            className="w-full max-w-sm bg-surface border border-border/20 rounded-2xl p-6 space-y-4 shadow-2xl select-none"
          >
            <div className="flex justify-between items-center border-b border-border/10 pb-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                Adjust Savings: {contribGoal.name}
              </h4>
              <button 
                type="button" 
                onClick={() => {
                  setIsContribOpen(false);
                  setContribGoal(null);
                }} 
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Switch Contribution Type */}
            <div className="grid grid-cols-2 gap-1 bg-surface-hover/30 p-1 rounded-xl border border-border/10">
              <button
                type="button"
                onClick={() => setContribType('add')}
                className={`py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide flex items-center justify-center gap-1 transition-all ${
                  contribType === 'add' 
                    ? 'bg-success text-white shadow-sm shadow-success/20' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Contribute / Add
              </button>
              <button
                type="button"
                onClick={() => setContribType('withdraw')}
                className={`py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide flex items-center justify-center gap-1 transition-all ${
                  contribType === 'withdraw' 
                    ? 'bg-danger text-white shadow-sm shadow-danger/20' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" />
                Withdraw / Reduce
              </button>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Adjust Amount (₹)</label>
              <input
                type="number"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                required
                min="10"
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setIsContribOpen(false);
                  setContribGoal(null);
                }}
                className="py-2 border border-border/20 text-text-secondary rounded-xl text-[9px] font-black uppercase hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-accent/20 transition-colors"
              >
                Confirm Adjust
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
