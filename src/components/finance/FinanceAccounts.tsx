import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle,
  ArrowRightLeft,
  X,
  CreditCard,
  Building
} from 'lucide-react';
import type { 
  FinanceAccount,
  FinanceTransaction 
} from '../../services/supabase';

interface AccountsProps {
  accounts: FinanceAccount[];
  onCreateAccount: (account: Omit<FinanceAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onUpdateAccount: (accountId: string, account: Partial<FinanceAccount>) => Promise<any>;
  onDeleteAccount: (accountId: string) => Promise<any>;
  onCreateTransaction: (tx: Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  userId: string;
}

export const FinanceAccounts: React.FC<AccountsProps> = ({
  accounts,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onCreateTransaction,
  userId
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAcc, setSelectedAcc] = useState<FinanceAccount | null>(null);

  // Form states
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'bank' | 'savings' | 'cash' | 'credit_card'>('bank');
  const [accInstitution, setAccInstitution] = useState('');
  const [accBalance, setAccBalance] = useState('0');
  const [creditLimit, setCreditLimit] = useState('100000');
  const [billCycle, setBillCycle] = useState('15');
  const [paymentDue, setPaymentDue] = useState('5');

  // Transfer form modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [sourceAccId, setSourceAccId] = useState('');
  const [destAccId, setDestAccId] = useState('');
  const [transferAmount, setTransferAmount] = useState('1000');
  const [transferNotes, setTransferNotes] = useState('');

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Calculations
  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.current_balance), 0);

  // Submit Account Handler
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(accBalance);
    const limitNum = accType === 'credit_card' ? parseFloat(creditLimit) : null;

    const payload = {
      user_id: userId,
      name: accName,
      type: accType,
      institution: accInstitution || null,
      currency: 'INR',
      opening_balance: balanceNum,
      current_balance: balanceNum,
      credit_limit: limitNum,
      billing_cycle_day: accType === 'credit_card' ? parseInt(billCycle) : null,
      payment_due_day: accType === 'credit_card' ? parseInt(paymentDue) : null,
      is_active: true
    };

    if (modalMode === 'create') {
      await onCreateAccount(payload);
    } else if (modalMode === 'edit' && selectedAcc) {
      await onUpdateAccount(selectedAcc.id, payload);
    }

    setIsModalOpen(false);
    setSelectedAcc(null);
  };

  // Submit Transfer Handler
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !sourceAccId || !destAccId) return;

    // Create the transfer record transaction (will trigger account adjustments)
    const payload = {
      user_id: userId,
      account_id: sourceAccId,
      type: 'transfer' as const,
      amount: amountNum,
      currency: 'INR',
      merchant: 'Linked Account Transfer',
      category_id: null,
      transaction_date: new Date().toISOString(),
      notes: transferNotes || 'Intra-account transfer',
      is_recurring: false,
      transfer_group_id: destAccId, // Destination Account Linked
      shared_space_id: null,
      description: null
    };

    await onCreateTransaction(payload);
    setIsTransferOpen(false);
    setTransferNotes('');
  };

  // Edit Trigger
  const openEditModal = (acc: FinanceAccount) => {
    setSelectedAcc(acc);
    setModalMode('edit');
    setAccName(acc.name);
    setAccType(acc.type as any);
    setAccInstitution(acc.institution || '');
    setAccBalance(acc.current_balance.toString());
    setCreditLimit((acc.credit_limit || 100000).toString());
    setBillCycle((acc.billing_cycle_day || 15).toString());
    setPaymentDue((acc.payment_due_day || 5).toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await onDeleteAccount(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview Cards Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-surface/10 p-3 rounded-2xl border border-border/10">
        <div>
          <h2 className="text-xs font-bold text-text-primary tracking-wide">Account Portfolio</h2>
          <p className="text-[9px] text-text-secondary font-medium">Derived Balance: ₹{totalBalance.toLocaleString('en-IN')}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              if (accounts.length < 2) return;
              setSourceAccId(accounts[0]?.id || '');
              setDestAccId(accounts[1]?.id || '');
              setIsTransferOpen(true);
            }}
            disabled={accounts.length < 2}
            className="flex-1 md:flex-none py-1.5 px-4 bg-surface/40 hover:bg-surface border border-border/20 text-text-primary rounded-xl text-[10px] font-black tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transfer Funds
          </button>
          <button
            onClick={() => {
              setModalMode('create');
              setAccName('');
              setAccType('bank');
              setAccInstitution('');
              setAccBalance('0');
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none py-1.5 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-black tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </button>
        </div>
      </div>

      {/* Grid Accounts Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {accounts.map(acc => {
          const isCard = acc.type === 'credit_card';
          const bal = Number(acc.current_balance);
          const limit = Number(acc.credit_limit || 0);
          
          // Credit Card logic
          const usedCredit = Math.abs(bal);
          const availableCredit = Math.max(0, limit - usedCredit);
          const creditPercent = limit > 0 ? Math.min(100, Math.round((usedCredit / limit) * 100)) : 0;

          return (
            <div 
              key={acc.id}
              className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/10 flex flex-col justify-between min-h-[140px] relative group text-left"
            >
              {/* Top Details */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                    isCard ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-success/10 border-success/20 text-success'
                  }`}>
                    {isCard ? <CreditCard className="h-4.5 w-4.5" /> : <Building className="h-4.5 w-4.5" />}
                  </span>
                  <div>
                    <h4 className="text-[11px] font-black text-text-primary tracking-wide">{acc.name}</h4>
                    <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider mt-0.5">
                      {acc.type.replace('_', ' ')} {acc.institution ? `• ${acc.institution}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(acc)}
                    className="p-1 rounded bg-surface border border-border/10 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(acc.id)}
                    className="p-1 rounded bg-surface border border-border/10 text-text-secondary hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Middle Section Balance */}
              <div className="py-3">
                <h3 className={`text-lg font-black tracking-wide ${bal < 0 ? 'text-danger' : 'text-text-primary'}`}>
                  ₹{bal.toLocaleString('en-IN')}
                </h3>
                <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest mt-0.5">Current Balance</span>
              </div>

              {/* Bottom Credit Card parameters */}
              {isCard && (
                <div className="border-t border-border/5 pt-3.5 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="text-text-secondary uppercase tracking-wider">Used Credit Limit</span>
                      <span className="text-text-primary font-mono">₹{usedCredit.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="relative h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${creditPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-text-secondary font-bold">
                      <span>{creditPercent}% utilized</span>
                      <span>₹{availableCredit.toLocaleString('en-IN')} available credit</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[8.5px] font-extrabold text-text-secondary bg-surface/30 p-2 rounded-xl border border-border/5">
                    <span>Cycle Ends: Day {acc.billing_cycle_day}</span>
                    <span className="text-warning">Due: Day {acc.payment_due_day} next month</span>
                  </div>
                </div>
              )}

              {/* Delete confirm box overlay */}
              {deleteConfirmId === acc.id && (
                <div className="absolute inset-0 bg-surface/95 border border-border/20 rounded-2xl p-4 flex flex-col justify-between z-10">
                  <div className="flex items-start gap-2 text-left">
                    <AlertTriangle className="h-4.5 w-4.5 text-danger shrink-0" />
                    <div>
                      <h5 className="text-[10px] font-bold text-danger">Delete Account?</h5>
                      <p className="text-[8px] text-text-secondary mt-0.5 leading-normal">
                        All transactions linked to this account will remain, but the account asset will be deleted.
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
                      onClick={() => handleDelete(acc.id)}
                      className="px-3 py-1 bg-danger hover:bg-danger/80 rounded-lg text-[8px] font-bold text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Account Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveAccount}
            className="w-full max-w-sm bg-surface border border-border/20 rounded-2xl p-6 space-y-4 shadow-2xl select-none"
          >
            <div className="flex justify-between items-center border-b border-border/10 pb-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                {modalMode === 'create' ? 'Create Account' : 'Edit Account'}
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
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Account Name</label>
              <input
                type="text"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="e.g. HDFC Salary, Cash"
                required
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Account Type</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as any)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  <option value="bank">Bank Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Institution</label>
                <input
                  type="text"
                  value={accInstitution}
                  onChange={(e) => setAccInstitution(e.target.value)}
                  placeholder="e.g. ICICI Bank"
                  className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Opening Balance (₹)</label>
              <input
                type="number"
                value={accBalance}
                onChange={(e) => setAccBalance(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary focus:outline-none focus:border-accent/40"
              />
            </div>

            {accType === 'credit_card' && (
              <div className="border-t border-border/5 pt-3.5 space-y-3">
                <div className="space-y-1 text-left">
                  <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary focus:outline-none focus:border-accent/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
                  <div>
                    <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Billing Cycle Day</label>
                    <input
                      type="number"
                      value={billCycle}
                      onChange={(e) => setBillCycle(e.target.value)}
                      required
                      min="1"
                      max="31"
                      className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Payment Due Day</label>
                    <input
                      type="number"
                      value={paymentDue}
                      onChange={(e) => setPaymentDue(e.target.value)}
                      required
                      min="1"
                      max="31"
                      className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                    />
                  </div>
                </div>
              </div>
            )}

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

      {/* Intra-account Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleExecuteTransfer}
            className="w-full max-w-sm bg-surface border border-border/20 rounded-2xl p-6 space-y-4 shadow-2xl select-none"
          >
            <div className="flex justify-between items-center border-b border-border/10 pb-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                Transfer Funds
              </h4>
              <button 
                type="button" 
                onClick={() => setIsTransferOpen(false)} 
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Source Account</label>
                <select
                  value={sourceAccId}
                  onChange={(e) => setSourceAccId(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Destination Account</label>
                <select
                  value={destAccId}
                  onChange={(e) => setDestAccId(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  {accounts.filter(a => a.id !== sourceAccId).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Transfer Amount (₹)</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary focus:outline-none focus:border-accent/40"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Description / Notes</label>
              <input
                type="text"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="e.g. Move to savings, credit card pay"
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsTransferOpen(false)}
                className="py-2 border border-border/20 text-text-secondary rounded-xl text-[9px] font-black uppercase hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-accent/20 transition-colors"
              >
                Execute Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
