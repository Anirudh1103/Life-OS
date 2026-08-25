import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  Copy,
  X,
  Clock,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  HeartPulse,
  FileText,
  Plane,
  GraduationCap,
  HelpCircle,
  AlertTriangle,
  DollarSign,
  Briefcase
} from 'lucide-react';
import type { 
  FinanceAccount, 
  FinanceTransaction, 
  FinanceCategory
} from '../../services/supabase';

interface TransactionsProps {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  currentCategoryFilter: string;
  setCurrentCategoryFilter: (catId: string) => void;
  onCreateTransaction: (tx: Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onUpdateTransaction: (txId: string, tx: Partial<FinanceTransaction>) => Promise<any>;
  onDeleteTransaction: (txId: string) => Promise<any>;
  userId: string;
}

export const FinanceTransactions: React.FC<TransactionsProps> = ({
  accounts,
  transactions,
  categories,
  currentCategoryFilter,
  setCurrentCategoryFilter,
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  userId
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Detail drawer states
  const [selectedTx, setSelectedTx] = useState<FinanceTransaction | null>(null);

  // Form modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [txAmount, setTxAmount] = useState('0');
  const [txCategory, setTxCategory] = useState('');
  const [txAccount, setTxAccount] = useState('');
  const [txMerchant, setTxMerchant] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [txTags, setTxTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [destAccount, setDestAccount] = useState(''); // For transfers

  // Delete confirm states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Category Icon Map Helper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils': return <Utensils className="h-4 w-4" />;
      case 'Car': return <Car className="h-4 w-4" />;
      case 'ShoppingBag': return <ShoppingBag className="h-4 w-4" />;
      case 'Film': return <Film className="h-4 w-4" />;
      case 'HeartPulse': return <HeartPulse className="h-4 w-4" />;
      case 'FileText': return <FileText className="h-4 w-4" />;
      case 'Plane': return <Plane className="h-4 w-4" />;
      case 'GraduationCap': return <GraduationCap className="h-4 w-4" />;
      case 'DollarSign': return <DollarSign className="h-4 w-4" />;
      case 'Briefcase': return <Briefcase className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  // Preset quick increment values
  const handleQuickIncrement = (val: number) => {
    const current = parseFloat(txAmount) || 0;
    setTxAmount((current + val).toString());
  };

  // Group transactions by date helper
  const getGroupedTransactions = () => {
    // Apply filters
    let list = [...transactions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        (t.merchant && t.merchant.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    if (selectedAccount !== 'all') {
      list = list.filter(t => t.account_id === selectedAccount);
    }

    if (currentCategoryFilter !== 'all') {
      list = list.filter(t => t.category_id === currentCategoryFilter);
    }

    if (filterType !== 'all') {
      list = list.filter(t => t.type === filterType);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
    } else if (sortBy === 'highest') {
      list.sort((a, b) => Number(b.amount) - Number(a.amount));
    } else if (sortBy === 'lowest') {
      list.sort((a, b) => Number(a.amount) - Number(b.amount));
    }

    // Grouping
    const groups: { [key: string]: FinanceTransaction[] } = {};
    const todayStr = new Date().toDateString();
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = yest.toDateString();

    list.forEach(tx => {
      const txDate = new Date(tx.transaction_date);
      const dateStr = txDate.toDateString();
      let key = dateStr;
      
      if (dateStr === todayStr) {
        key = 'Today';
      } else if (dateStr === yesterdayStr) {
        key = 'Yesterday';
      } else {
        key = txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    return groups;
  };

  // Submit Handler
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const payload = {
      user_id: userId,
      type: txType,
      amount: amountNum,
      currency: 'INR',
      merchant: txMerchant || (txType === 'transfer' ? 'Transfer' : 'Generic Record'),
      category_id: txType === 'transfer' ? null : (txCategory || null),
      account_id: txAccount || accounts[0]?.id,
      transaction_date: new Date(txDate).toISOString(),
      notes: txNotes || null,
      is_recurring: false,
      transfer_group_id: txType === 'transfer' ? destAccount : null,
      shared_space_id: selectedTx?.shared_space_id || null,
      description: null
    };

    if (formMode === 'create') {
      await onCreateTransaction(payload);
    } else if (formMode === 'edit' && selectedTx) {
      await onUpdateTransaction(selectedTx.id, payload);
    }

    setIsFormOpen(false);
    setSelectedTx(null);
  };

  // Duplicate Transaction helper
  const handleDuplicate = (tx: FinanceTransaction) => {
    setFormMode('create');
    setTxType(tx.type);
    setTxAmount(tx.amount.toString());
    setTxCategory(tx.category_id || '');
    setTxAccount(tx.account_id);
    setTxMerchant(tx.merchant || '');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes(tx.notes || '');
    setTxTags([]);
    setDestAccount(tx.transfer_group_id || '');
    setSelectedTx(null);
    setIsFormOpen(true);
  };

  // Edit Trigger helper
  const openEditModal = (tx: FinanceTransaction) => {
    setSelectedTx(tx);
    setFormMode('edit');
    setTxType(tx.type);
    setTxAmount(tx.amount.toString());
    setTxCategory(tx.category_id || '');
    setTxAccount(tx.account_id);
    setTxMerchant(tx.merchant || '');
    setTxDate(new Date(tx.transaction_date).toISOString().split('T')[0]);
    setTxNotes(tx.notes || '');
    setTxTags([]);
    setDestAccount(tx.transfer_group_id || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (txId: string) => {
    await onDeleteTransaction(txId);
    setDeleteConfirmId(null);
    setSelectedTx(null);
  };

  // Add Tag helper
  const handleAddTag = () => {
    if (tagInput.trim() && !txTags.includes(tagInput.trim())) {
      setTxTags([...txTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTxTags(txTags.filter((_, i) => i !== index));
  };

  const grouped = getGroupedTransactions();

  return (
    <div className="space-y-4 animate-fade-in relative min-h-[500px]">
      
      {/* Top Filter and Actions Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-surface/10 p-3 rounded-2xl border border-border/10">
        
        {/* Left: Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:flex-initial md:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-[10px] text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent/40"
            />
          </div>

          {/* Account Filter */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-2.5 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-[10px] font-bold text-text-primary focus:outline-none focus:border-accent/40"
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={currentCategoryFilter}
            onChange={(e) => setCurrentCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-surface/30 border border-border/20 rounded-xl text-[10px] font-bold text-text-primary focus:outline-none focus:border-accent/40"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border border-border/20 flex items-center justify-center transition-colors ${
              showFilters ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface/30 text-text-secondary hover:text-text-primary'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <button
          onClick={() => {
            setFormMode('create');
            setTxType('expense');
            setTxAmount('0');
            setTxCategory(categories.find(c => c.type === 'expense')?.id || '');
            setTxAccount(accounts[0]?.id || '');
            setTxMerchant('');
            setTxDate(new Date().toISOString().split('T')[0]);
            setTxNotes('');
            setTxTags([]);
            setIsFormOpen(true);
          }}
          className="w-full md:w-auto py-1.5 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-[10px] font-black tracking-wide flex items-center justify-center gap-1.5 transition-all outline-none"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Transaction
        </button>
      </div>

      {/* Expanded Filters Drawer */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface/5 p-3 rounded-xl border border-border/5 text-[9px] font-bold">
          <div>
            <span className="text-text-secondary block mb-1 text-[8px] uppercase tracking-wider">Transaction Type</span>
            <div className="flex gap-1.5">
              {(['all', 'expense', 'income', 'transfer'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-1 rounded-lg border capitalize transition-all ${
                    filterType === t 
                      ? 'bg-accent/10 border-accent/30 text-accent' 
                      : 'bg-surface/20 border-border/10 text-text-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-text-secondary block mb-1 text-[8px] uppercase tracking-wider">Sorting</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2 py-1 bg-surface/30 border border-border/10 rounded-lg text-text-primary"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Transactions Timeline Feed */}
      <div className="space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="glass-panel py-16 rounded-2xl flex flex-col items-center justify-center text-center max-w-sm mx-auto border-dashed">
            <Clock className="h-10 w-10 text-text-secondary/40 mb-2" />
            <h4 className="text-xs font-bold text-text-primary">No Transactions Found</h4>
            <p className="text-[10px] text-text-secondary mt-1 max-w-[200px]">
              Add a transaction or clear filters to view logs.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, items]) => (
            <div key={dateKey} className="space-y-1.5">
              {/* Date Header */}
              <h5 className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest px-1">
                {dateKey}
              </h5>

              {/* Transactions List */}
              <div className="space-y-1">
                {items.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const amtStr = isIncome ? `+₹${Number(tx.amount).toLocaleString('en-IN')}` : `-₹${Number(tx.amount).toLocaleString('en-IN')}`;
                  
                  return (
                    <div 
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="flex justify-between items-center p-3 bg-surface/30 hover:bg-surface/50 border border-border/5 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span 
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{ 
                            backgroundColor: `${tx.category_color}12` || '#ffffff08',
                            borderColor: `${tx.category_color}25` || '#ffffff15',
                            color: tx.category_color || '#ffffff'
                          }}
                        >
                          {getCategoryIcon(tx.category_icon || 'HelpCircle')}
                        </span>
                        
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-text-primary truncate tracking-wide">
                            {tx.merchant || (tx.type === 'transfer' ? 'Linked Account Transfer' : 'Expense')}
                          </p>
                          <p className="text-[8px] font-semibold text-text-secondary tracking-wider uppercase mt-0.5">
                            {tx.category_name} • {tx.account_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Hover Quick Edit / Duplicate Buttons */}
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(tx);
                            }}
                            className="p-1 rounded bg-surface border border-border/20 text-text-secondary hover:text-text-primary transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(tx);
                            }}
                            className="p-1 rounded bg-surface border border-border/20 text-text-secondary hover:text-text-primary transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>

                        <span className={`text-[10px] font-black tracking-wide font-mono ${isIncome ? 'text-success' : 'text-text-primary'}`}>
                          {amtStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Slide Drawer Overlay */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in" onClick={() => setSelectedTx(null)}>
          <div 
            className="w-full max-w-sm bg-surface-hover/95 border-l border-border/20 h-screen p-6 flex flex-col justify-between overflow-y-auto select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border/10 pb-4">
                <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">Transaction Details</h4>
                <button onClick={() => setSelectedTx(null)} className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Transaction Highlight */}
              <div className="text-center py-4 space-y-1 bg-surface/30 rounded-2xl border border-border/5">
                <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">{selectedTx.merchant}</span>
                <h2 className={`text-xl font-black ${selectedTx.type === 'income' ? 'text-success' : 'text-text-primary'}`}>
                  {selectedTx.type === 'income' ? '+' : '-'}₹{Number(selectedTx.amount).toLocaleString('en-IN')}
                </h2>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[8.5px] font-bold text-text-secondary bg-surface border border-border/25">
                  {selectedTx.category_name}
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-4 text-[10px] font-semibold text-text-secondary">
                <div className="flex justify-between border-b border-border/5 pb-2">
                  <span>Transaction Date</span>
                  <span className="text-text-primary font-bold">
                    {new Date(selectedTx.transaction_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div className="flex justify-between border-b border-border/5 pb-2">
                  <span>Account Source</span>
                  <span className="text-text-primary font-bold">{selectedTx.account_name}</span>
                </div>

                <div className="flex justify-between border-b border-border/5 pb-2">
                  <span>Transaction Type</span>
                  <span className="text-text-primary font-bold capitalize">{selectedTx.type}</span>
                </div>

                {selectedTx.notes && (
                  <div className="space-y-1 text-left">
                    <span className="block text-[8px] uppercase tracking-wider">Notes</span>
                    <p className="text-text-primary leading-relaxed bg-surface/20 p-2.5 rounded-xl border border-border/5">
                      {selectedTx.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="space-y-2 pt-6 border-t border-border/10">
              {deleteConfirmId === selectedTx.id ? (
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-left space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-danger">Delete Transaction?</p>
                      <p className="text-[8px] text-text-secondary mt-0.5 leading-normal">This action cannot be undone. Account balance will be reversed.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 bg-surface border border-border/20 rounded-lg text-[8px] font-bold text-text-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedTx.id)}
                      className="px-2.5 py-1 bg-danger hover:bg-danger/80 rounded-lg text-[8px] font-bold text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleDuplicate(selectedTx)}
                    className="py-2 bg-surface/50 border border-border/10 hover:bg-surface text-text-secondary hover:text-text-primary rounded-xl text-[9px] font-bold flex items-center justify-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Duplicate
                  </button>
                  <button 
                    onClick={() => openEditModal(selectedTx)}
                    className="py-2 bg-accent/10 border border-accent/20 hover:bg-accent/25 text-accent rounded-xl text-[9px] font-bold flex items-center justify-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(selectedTx.id)}
                    className="py-2 bg-danger/10 border border-danger/20 hover:bg-danger/25 text-danger rounded-xl text-[9px] font-bold flex items-center justify-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveTransaction}
            className="w-full max-w-sm bg-surface border border-border/20 rounded-2xl p-6 space-y-4 shadow-2xl select-none"
          >
            <div className="flex justify-between items-center border-b border-border/10 pb-3">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                {formMode === 'create' ? 'Add Transaction' : 'Edit Transaction'}
              </h4>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-1 bg-surface-hover/30 p-1 rounded-xl border border-border/10">
              {(['expense', 'income', 'transfer'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTxType(t);
                    if (t === 'expense' && !txCategory) {
                      setTxCategory(categories.find(c => c.type === 'expense')?.id || '');
                    } else if (t === 'income' && !txCategory) {
                      setTxCategory(categories.find(c => c.type === 'income')?.id || '');
                    }
                  }}
                  className={`py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all ${
                    txType === t 
                      ? 'bg-accent text-white shadow-sm shadow-accent/20' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Amount and presets */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest">Amount (₹)</label>
              <input
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
                min="1"
                step="any"
                className="w-full px-4 py-2.5 bg-surface-hover/20 border border-border/20 rounded-xl text-center text-lg font-black text-text-primary focus:outline-none focus:border-accent/40"
              />
              {/* Presets */}
              <div className="flex gap-2 justify-center text-[9px] font-bold text-text-secondary">
                <button type="button" onClick={() => handleQuickIncrement(100)} className="px-2.5 py-1 bg-surface-hover rounded-lg border border-border/10 hover:text-text-primary">+₹100</button>
                <button type="button" onClick={() => handleQuickIncrement(500)} className="px-2.5 py-1 bg-surface-hover rounded-lg border border-border/10 hover:text-text-primary">+₹500</button>
                <button type="button" onClick={() => handleQuickIncrement(1000)} className="px-2.5 py-1 bg-surface-hover rounded-lg border border-border/10 hover:text-text-primary">+₹1,000</button>
              </div>
            </div>

            {/* Conditional input details */}
            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              {txType !== 'transfer' ? (
                <div>
                  <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Category</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    required
                    className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                  >
                    {categories.filter(c => c.type === txType).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Destination Account</label>
                  <select
                    value={destAccount}
                    onChange={(e) => setDestAccount(e.target.value)}
                    required
                    className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                  >
                    <option value="" disabled>Select Target</option>
                    {accounts.filter(a => a.id !== txAccount).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Account</label>
                <select
                  value={txAccount}
                  onChange={(e) => setTxAccount(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Merchant / Payee</label>
              <input
                type="text"
                value={txMerchant}
                onChange={(e) => setTxMerchant(e.target.value)}
                placeholder="e.g. Swiggy, Amazon"
                required
                className="w-full px-3 py-1.5 bg-surface-hover/20 border border-border/20 rounded-lg text-[10px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-[9px] font-bold text-left">
              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Date</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  required
                  className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary"
                />
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block mb-1">Tags (Press Add)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="tag"
                    className="w-full px-2 py-1 bg-surface-hover/20 border border-border/20 rounded-lg text-text-primary focus:outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddTag}
                    className="p-1 text-accent border border-accent/20 rounded hover:bg-accent/10"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Display Tags */}
            {txTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 text-left">
                {txTags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-hover border border-border/10 text-[8px] font-bold text-text-secondary">
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(idx)} className="text-text-secondary hover:text-danger">
                      <X className="h-2 w-2" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Notes (Optional)</label>
              <textarea
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                placeholder="Write any additional details..."
                rows={2}
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/20 rounded-lg text-[9px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/40"
              />
            </div>

            {/* Form footer */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="py-2 border border-border/20 text-text-secondary rounded-xl text-[9px] font-black uppercase hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-accent/20 transition-colors"
              >
                {formMode === 'create' ? 'Save' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
