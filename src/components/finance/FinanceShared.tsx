import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  X,
  Users
} from 'lucide-react';
import type { 
  FinanceTransaction, 
  FinanceAccount, 
  FinanceCategory,
  FinanceSharedSpace,
  FinanceExpenseSplit
} from '../../services/supabase';

interface SharedProps {
  sharedSpaces: FinanceSharedSpace[];
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  onCreateTransaction: (tx: Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'>, splits: Omit<FinanceExpenseSplit, 'id' | 'transaction_id'>[]) => Promise<any>;
  userId: string;
}

export const FinanceShared: React.FC<SharedProps> = ({
  sharedSpaces,
  accounts,
  categories,
  transactions,
  onCreateTransaction,
  userId
}) => {
  const activeSpace = sharedSpaces[0]; // Default to Goa Trip space

  // Form states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('1500');
  const [expenseMerchant, setExpenseMerchant] = useState('');
  const [expensePayer, setExpensePayer] = useState(userId); // Default to current user
  const [expenseCategory, setExpenseCategory] = useState(categories.find(c => c.type === 'expense')?.id || '');

  // Settlement list
  const [settlementList, setSettlementList] = useState<{ id: string, payer: string, payee: string, amount: number, settled: boolean }[]>([]);

  // Hardcoded member maps for presentation consistency
  const members = [
    { id: userId, name: 'Anirudh' },
    { id: 'usr-rahul', name: 'Rahul' },
    { id: 'usr-aakash', name: 'Aakash' }
  ];

  // Filter transactions for Goa space
  const spaceTransactions = transactions.filter(t => t.shared_space_id === activeSpace?.id);

  // Split calculation engine
  const calculateSettlements = () => {
    if (spaceTransactions.length === 0) return { totals: [], balances: [], debts: [] };

    // Sum up payments
    const payments: { [key: string]: number } = {};
    members.forEach(m => { payments[m.id] = 0; });

    spaceTransactions.forEach(t => {
      payments[t.user_id] = (payments[t.user_id] || 0) + Number(t.amount);
    });

    const totalSpent = Object.values(payments).reduce((a, b) => a + b, 0);
    const individualShare = totalSpent / members.length;

    // Balances relative to share (Paid - Owed)
    const balances = members.map(m => {
      const paid = payments[m.id] || 0;
      const net = paid - individualShare;
      return {
        id: m.id,
        name: m.name,
        paid,
        net
      };
    });

    // Simplify debts (who owes whom how much)
    const creditors = balances.filter(b => b.net > 0).sort((a, b) => b.net - a.net);
    const debtors = balances.filter(b => b.net < 0).map(d => ({ ...d, net: Math.abs(d.net) })).sort((a, b) => b.net - a.net);

    const debts: { id: string; payerId: string; payerName: string; payeeId: string; payeeName: string; amount: number; settled: boolean }[] = [];
    
    // Greedy match debtors to creditors
    let cIdx = 0;
    let dIdx = 0;
    let tempCreditors = creditors.map(c => ({ ...c }));
    let tempDebtors = debtors.map(d => ({ ...d }));

    while (cIdx < tempCreditors.length && dIdx < tempDebtors.length) {
      const creditor = tempCreditors[cIdx];
      const debtor = tempDebtors[dIdx];

      if (creditor.net <= 0) {
        cIdx++;
        continue;
      }
      if (debtor.net <= 0) {
        dIdx++;
        continue;
      }

      const settlementAmt = Math.min(creditor.net, debtor.net);
      
      debts.push({
        id: `debt-${debtor.id}-${creditor.id}`,
        payerId: debtor.id,
        payerName: debtor.name,
        payeeId: creditor.id,
        payeeName: creditor.name,
        amount: Math.round(settlementAmt),
        settled: false
      });

      creditor.net -= settlementAmt;
      debtor.net -= settlementAmt;

      if (creditor.net <= 0) cIdx++;
      if (debtor.net <= 0) dIdx++;
    }

    return {
      totalSpent,
      individualShare,
      balances,
      debts
    };
  };

  // Submit shared expense
  const handleSaveSharedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !activeSpace) return;

    // Create splits equally
    const shareAmount = amountNum / members.length;
    const splits = members.map(m => ({
      user_id: m.id,
      owed_amount: parseFloat(shareAmount.toFixed(2))
    }));

    const payload = {
      user_id: expensePayer,
      account_id: accounts[0]?.id || '', // Fallback account
      type: 'expense' as const,
      amount: amountNum,
      currency: 'INR',
      merchant: expenseMerchant || 'Group Expense',
      category_id: expenseCategory,
      transaction_date: new Date().toISOString(),
      notes: 'Group Split equally',
      is_recurring: false,
      transfer_group_id: null,
      shared_space_id: activeSpace.id,
      description: null
    };

    await onCreateTransaction(payload, splits);
    setIsAddExpenseOpen(false);
    setExpenseMerchant('');
  };

  // Toggle debt status locally for interactive feedback
  const handleSettleDebt = (debtId: string) => {
    setSettlementList(prev => {
      if (prev.includes(debtId as any)) {
        return prev.filter(id => id !== (debtId as any));
      } else {
        return [...prev, debtId as any];
      }
    });
  };

  const calcs = calculateSettlements();
  const personalBalance = calcs.balances.find(b => b.id === userId);

  return (
    <div className="space-y-6 animate-fade-in text-left select-none">
      
      {/* Header Info */}
      <div className="flex justify-between items-center bg-surface/10 p-3 rounded-2xl border border-border/10">
        <div>
          <h2 className="text-xs font-bold text-text-primary tracking-wide">{activeSpace?.name || 'Shared Space'}</h2>
          <p className="text-[9px] text-text-secondary font-medium">Split Goa trip expenses with Rahul and Aakash</p>
        </div>

        <button
          onClick={() => {
            setExpenseAmount('1500');
            setExpenseMerchant('');
            setExpensePayer(userId);
            setExpenseCategory(categories.find(c => c.type === 'expense')?.id || '');
            setIsAddExpenseOpen(true);
          }}
          className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-black tracking-wide flex items-center gap-1.5 transition-all outline-none"
        >
          <Plus className="h-3.5 w-3.5" />
          Log Split Expense
        </button>
      </div>

      {/* Top metrics card row */}
      {personalBalance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20">
            <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Group Total Spent</span>
            <h3 className="text-sm font-black text-text-primary tracking-wide mt-1">₹{Math.round(calcs.totalSpent || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20">
            <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Your Personal Paid share</span>
            <h3 className="text-sm font-black text-text-primary tracking-wide mt-1">₹{Math.round(personalBalance.paid).toLocaleString('en-IN')}</h3>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20">
            <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Your Net Settlement State</span>
            <h3 className={`text-sm font-black mt-1 ${personalBalance.net > 0 ? 'text-success' : personalBalance.net === 0 ? 'text-text-primary' : 'text-danger'}`}>
              {personalBalance.net > 0 ? '+' : ''}₹{Math.round(personalBalance.net).toLocaleString('en-IN')}
            </h3>
          </div>
        </div>
      )}

      {/* Splits layout details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Goa Trip Expenses list */}
        <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 lg:col-span-7 space-y-3.5">
          <h4 className="text-xs font-bold text-text-primary tracking-wide">Shared Goa Trip Expenses</h4>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {spaceTransactions.length === 0 ? (
              <div className="text-center py-10 text-[10px] text-text-secondary font-bold">No shared expenses logged.</div>
            ) : (
              spaceTransactions.map(tx => {
                const payer = members.find(m => m.id === tx.user_id);
                return (
                  <div key={tx.id} className="flex justify-between items-center bg-surface/30 p-2.5 rounded-xl border border-border/5">
                    <div>
                      <p className="text-[10px] font-bold text-text-primary">{tx.merchant}</p>
                      <p className="text-[8.5px] font-semibold text-text-secondary tracking-wide uppercase mt-0.5">
                        Paid by {payer?.name || 'Unknown'} • Split Equally
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-text-primary font-mono">₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Debts Settlements board */}
        <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 lg:col-span-5 space-y-3.5 flex flex-col justify-between min-h-[300px]">
          <div>
            <h4 className="text-xs font-bold text-text-primary tracking-wide font-black">Settlements Ledger</h4>
            <p className="text-[9px] text-text-secondary font-medium">Simplified net debt calculations</p>
          </div>

          <div className="space-y-2.5 flex-1 mt-3 overflow-y-auto pr-1">
            {calcs.debts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <Users className="h-8 w-8 text-text-secondary/30 mb-2" />
                <span className="text-[10px] font-bold text-text-secondary">All balances settled!</span>
              </div>
            ) : (
              calcs.debts.map(d => {
                const isSettled = settlementList.includes(d.id as any);
                return (
                  <div 
                    key={d.id} 
                    className={`flex justify-between items-center p-2.5 rounded-xl border transition-all ${
                      isSettled ? 'bg-success/5 border-success/15 opacity-60' : 'bg-surface/30 border-border/5'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-text-primary">
                        {d.payerName} <span className="text-text-secondary font-medium">owes</span> {d.payeeName}
                      </p>
                      <p className={`text-[8px] font-extrabold uppercase mt-0.5 ${
                        isSettled ? 'text-success' : 'text-text-secondary'
                      }`}>
                        {isSettled ? 'Settled and cleared' : 'Outstanding Debt'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black font-mono ${isSettled ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                        ₹{d.amount.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => handleSettleDebt(d.id)}
                        className={`p-1 rounded-lg border flex items-center justify-center transition-colors ${
                          isSettled 
                            ? 'bg-success/15 border-success/30 text-success' 
                            : 'bg-surface/50 border-border/10 text-text-secondary hover:text-text-primary'
                        }`}
                        title={isSettled ? "Mark outstanding" : "Clear Debt"}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-surface/40 p-2.5 rounded-xl border border-border/5 text-[9px] font-bold text-text-secondary text-left leading-normal">
            ℹ️ Net debts simplify member transactions to reduce unnecessary splits transfers.
          </div>
        </div>
      </div>

      {/* Log split expense modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveSharedExpense}
            className="w-full max-w-sm bg-surface border border-border/20 rounded-2xl p-6 space-y-4 shadow-2xl select-none"
          >
            <div className="flex justify-between items-center border-b border-border/10 pb-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                Log Split Expense
              </h4>
              <button 
                type="button" 
                onClick={() => setIsAddExpenseOpen(false)} 
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Expense Title</label>
              <input
                type="text"
                value={expenseMerchant}
                onChange={(e) => setExpenseMerchant(e.target.value)}
                placeholder="e.g. Goa shacks dinner, Villa booking"
                required
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Amount Spent (₹)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                  className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Who Paid?</label>
                <select
                  value={expensePayer}
                  onChange={(e) => setExpensePayer(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Category target</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Split Method</label>
                <select
                  disabled
                  className="w-full px-2 py-1.5 bg-surface-hover/10 border border-border/20 rounded-lg text-text-secondary font-medium"
                >
                  <option>Split Equally</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAddExpenseOpen(false)}
                className="py-2 border border-border/20 text-text-secondary rounded-xl text-[9px] font-black uppercase hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-accent/20 transition-colors"
              >
                Save Split
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
