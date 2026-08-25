import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  Play,
  Pause,
  Slash
} from 'lucide-react';
import type { 
  FinanceSubscription,
  FinanceAccount,
  FinanceCategory 
} from '../../services/supabase';

interface BillsProps {
  subscriptions: FinanceSubscription[];
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  onCreateSubscription: (sub: Omit<FinanceSubscription, 'id'>) => Promise<any>;
  onUpdateSubscription: (subId: string, sub: Partial<FinanceSubscription>) => Promise<any>;
  onDeleteSubscription: (subId: string) => Promise<any>;
  userId: string;
}

export const FinanceBills: React.FC<BillsProps> = ({
  subscriptions,
  accounts,
  categories,
  onCreateSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
  userId
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSub, setSelectedSub] = useState<FinanceSubscription | null>(null);

  // Form states
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('500');
  const [subAccount, setSubAccount] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subFrequency, setSubFrequency] = useState<'daily' | 'weekly' | 'every_2_weeks' | 'monthly' | 'every_4_weeks' | 'quarterly' | 'yearly'>('monthly');
  const [subNextPayment, setSubNextPayment] = useState('2026-09-02');
  const [subNotes, setSubNotes] = useState('');

  // Active date selection on calendar
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [activeCalendarMonth, setActiveCalendarMonth] = useState<number>(today.getMonth());
  const [activeCalendarYear, setActiveCalendarYear] = useState<number>(today.getFullYear());

  // Calculations
  // Total Monthly / Yearly recurring sum
  const totals = subscriptions
    .filter(s => s.status === 'active')
    .reduce((acc, curr) => {
      const amt = Number(curr.amount);
      let monthly = 0;
      let yearly = 0;
      
      if (curr.frequency === 'monthly' || curr.frequency === 'every_4_weeks') {
        monthly = amt;
        yearly = amt * 12;
      } else if (curr.frequency === 'yearly') {
        monthly = amt / 12;
        yearly = amt;
      } else if (curr.frequency === 'quarterly') {
        monthly = amt / 3;
        yearly = amt * 4;
      } else if (curr.frequency === 'weekly') {
        monthly = amt * 4.33;
        yearly = amt * 52;
      } else if (curr.frequency === 'every_2_weeks') {
        monthly = amt * 2.16;
        yearly = amt * 26;
      } else if (curr.frequency === 'daily') {
        monthly = amt * 30;
        yearly = amt * 365;
      }

      acc.monthly += monthly;
      acc.yearly += yearly;
      return acc;
    }, { monthly: 0, yearly: 0 });

  // Generate calendar days
  const getCalendarDays = () => {
    const startOf = new Date(activeCalendarYear, activeCalendarMonth, 1);
    const endOf = new Date(activeCalendarYear, activeCalendarMonth + 1, 0);
    const totalDays = endOf.getDate();
    const startDayOfWeek = startOf.getDay(); // 0 is Sunday, 6 is Saturday

    const daysList = [];
    
    // Fill initial empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
      daysList.push(null);
    }
    
    // Fill days
    for (let i = 1; i <= totalDays; i++) {
      daysList.push(i);
    }

    return daysList;
  };

  // Find bills due on a specific day in the active calendar month
  const getBillsForDay = (day: number) => {
    return subscriptions.filter(s => {
      if (s.status !== 'active') return false;
      const due = new Date(s.next_payment);
      return due.getDate() === day && due.getMonth() === activeCalendarMonth && due.getFullYear() === activeCalendarYear;
    });
  };

  // Switch Sub Status
  const handleToggleStatus = async (sub: FinanceSubscription, nextStatus: 'active' | 'paused' | 'cancelled') => {
    await onUpdateSubscription(sub.id, {
      status: nextStatus,
      cancelled_date: nextStatus === 'cancelled' ? new Date().toISOString() : null
    });
  };

  // Submit Sub form
  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(subAmount);
    if (isNaN(amtNum) || amtNum <= 0) return;

    const payload = {
      user_id: userId,
      account_id: subAccount || null,
      category_id: subCategory || null,
      name: subName,
      amount: amtNum,
      frequency: subFrequency,
      next_payment: new Date(subNextPayment).toISOString(),
      status: 'active' as const,
      start_date: new Date().toISOString(),
      end_date: null,
      cancelled_date: null,
      notes: subNotes || null
    };

    if (modalMode === 'create') {
      await onCreateSubscription(payload);
    } else if (modalMode === 'edit' && selectedSub) {
      await onUpdateSubscription(selectedSub.id, payload);
    }

    setIsModalOpen(false);
    setSelectedSub(null);
  };

  const openEditModal = (sub: FinanceSubscription) => {
    setSelectedSub(sub);
    setModalMode('edit');
    setSubName(sub.name);
    setSubAmount(sub.amount.toString());
    setSubAccount(sub.account_id || '');
    setSubCategory(sub.category_id || '');
    setSubFrequency(sub.frequency as any);
    setSubNextPayment(new Date(sub.next_payment).toISOString().split('T')[0]);
    setSubNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  const calendarDays = getCalendarDays();
  const activeDayBills = getBillsForDay(selectedDate);
  const weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-fade-in text-left select-none">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20">
          <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Monthly Subscriptions</span>
          <h3 className="text-sm font-black text-text-primary tracking-wide mt-2">₹{Math.round(totals.monthly).toLocaleString('en-IN')}/mo</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20">
          <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Yearly Subscriptions</span>
          <h3 className="text-sm font-black text-text-primary tracking-wide mt-2">₹{Math.round(totals.yearly).toLocaleString('en-IN')}/yr</h3>
        </div>
        
        <button
          onClick={() => {
            setModalMode('create');
            setSubName('');
            setSubAmount('500');
            setSubAccount(accounts[0]?.id || '');
            setSubCategory(categories.find(c => c.type === 'expense')?.id || '');
            setSubFrequency('monthly');
            setSubNextPayment(new Date().toISOString().split('T')[0]);
            setSubNotes('');
            setIsModalOpen(true);
          }}
          className="h-full py-3 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-black tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Bill / Subscription
        </button>
      </div>

      {/* Main Splits layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Financial Calendar */}
        <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center text-xs font-bold border-b border-border/5 pb-2">
            <span className="text-text-primary uppercase tracking-wide">
              {new Date(activeCalendarYear, activeCalendarMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex gap-1.5 text-[8.5px]">
              <button 
                onClick={() => {
                  if (activeCalendarMonth === 0) {
                    setActiveCalendarMonth(11);
                    setActiveCalendarYear(activeCalendarYear - 1);
                  } else {
                    setActiveCalendarMonth(activeCalendarMonth - 1);
                  }
                }}
                className="px-2 py-1 bg-surface border border-border/10 rounded-lg hover:text-text-primary"
              >
                Prev
              </button>
              <button 
                onClick={() => {
                  if (activeCalendarMonth === 11) {
                    setActiveCalendarMonth(0);
                    setActiveCalendarYear(activeCalendarYear + 1);
                  } else {
                    setActiveCalendarMonth(activeCalendarMonth + 1);
                  }
                }}
                className="px-2 py-1 bg-surface border border-border/10 rounded-lg hover:text-text-primary"
              >
                Next
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Days Name Header */}
            {weekNames.map(w => (
              <span key={w} className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest mb-1.5">{w}</span>
            ))}

            {/* Days list */}
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              
              const dayBills = getBillsForDay(day);
              const hasBills = dayBills.length > 0;
              const isSelected = selectedDate === day;
              
              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-lg cursor-pointer flex flex-col items-center justify-between min-h-[42px] transition-all border ${
                    isSelected 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-surface/20 border-border/5 hover:border-border/20 text-text-primary'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold leading-none">{day}</span>
                  {hasBills && (
                    <span className={`h-1.5 w-1.5 rounded-full mt-1.5 animate-pulse ${
                      isSelected ? 'bg-white' : 'bg-accent'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bills due on selected day */}
          <div className="border-t border-border/5 pt-3.5 space-y-2.5">
            <h5 className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">
              Obligations Due on Day {selectedDate}
            </h5>
            
            <div className="space-y-1.5">
              {activeDayBills.length === 0 ? (
                <p className="text-[10px] text-text-secondary font-bold text-center py-4 bg-surface/20 rounded-xl border border-dashed border-border/10">
                  No bills due on this date.
                </p>
              ) : (
                activeDayBills.map(bill => (
                  <div key={bill.id} className="flex justify-between items-center bg-surface/30 p-2.5 rounded-xl border border-border/5">
                    <div>
                      <p className="text-[10px] font-bold text-text-primary">{bill.name}</p>
                      <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider mt-0.5">
                        {bill.frequency.replace('_', ' ')} • via {bill.account_name}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-text-primary font-mono">₹{Number(bill.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Subscriptions Tracker list */}
        <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 lg:col-span-5 space-y-3">
          <h4 className="text-xs font-bold text-text-primary tracking-wide">All Active & Paused Subscriptions</h4>
          
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-[10px] text-text-secondary font-bold">No subscriptions added.</div>
            ) : (
              subscriptions.map(sub => {
                const isActive = sub.status === 'active';
                
                return (
                  <div 
                    key={sub.id} 
                    className="p-3 bg-surface/20 hover:bg-surface/30 rounded-xl border border-border/5 flex flex-col gap-2.5 group transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-[10px] font-bold text-text-primary">{sub.name}</h5>
                        <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider mt-0.5">
                          ₹{Number(sub.amount).toLocaleString('en-IN')} every {sub.frequency.replace('_', ' ')}
                        </p>
                      </div>

                      {/* Status indicator */}
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${
                        isActive ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    {/* Actions drawer */}
                    <div className="flex justify-between items-center border-t border-border/5 pt-2 text-[9px] font-bold text-text-secondary select-none">
                      <div className="flex gap-2">
                        {isActive ? (
                          <button 
                            type="button" 
                            onClick={() => handleToggleStatus(sub, 'paused')}
                            className="flex items-center gap-1 hover:text-text-primary"
                          >
                            <Pause className="h-3 w-3" /> Pause
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => handleToggleStatus(sub, 'active')}
                            className="flex items-center gap-1 hover:text-text-primary"
                          >
                            <Play className="h-3 w-3" /> Resume
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => handleToggleStatus(sub, 'cancelled')}
                          className="flex items-center gap-1 hover:text-text-primary"
                        >
                          <Slash className="h-3 w-3" /> Cancel
                        </button>
                      </div>

                      <div className="flex gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(sub)} className="hover:text-text-primary"><Edit3 className="h-3 w-3" /></button>
                        <button onClick={() => onDeleteSubscription(sub.id)} className="hover:text-danger"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Subscription edit/create modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveSubscription}
            className="w-full max-w-sm bg-surface border border-border/20 rounded-2xl p-6 space-y-4 shadow-2xl select-none"
          >
            <div className="flex justify-between items-center border-b border-border/10 pb-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                {modalMode === 'create' ? 'Track Subscription' : 'Edit Subscription'}
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
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Subscription Name</label>
              <input
                type="text"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="e.g. Netflix, Spotify, Gym"
                required
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  required
                  className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                />
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Billing Cycle</label>
                <select
                  value={subFrequency}
                  onChange={(e) => setSubFrequency(e.target.value as any)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  <option value="weekly">Weekly</option>
                  <option value="every_2_weeks">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="every_4_weeks">Every 4 Weeks</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Pay Account</label>
                <select
                  value={subAccount}
                  onChange={(e) => setSubAccount(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Category target</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Next Billing Payment Date</label>
              <input
                type="date"
                value={subNextPayment}
                onChange={(e) => setSubNextPayment(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Notes (Optional)</label>
              <textarea
                value={subNotes}
                onChange={(e) => setSubNotes(e.target.value)}
                placeholder="Description details..."
                rows={2}
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/20 rounded-lg text-[9px] text-text-primary focus:outline-none"
              />
            </div>

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
