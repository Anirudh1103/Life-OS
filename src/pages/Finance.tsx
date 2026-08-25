import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import type { 
  FinanceAccount, 
  FinanceTransaction, 
  FinanceBudget, 
  FinanceGoal, 
  FinanceSubscription,
  FinanceCategory,
  FinanceSharedSpace
} from '../services/supabase';
import { 
  LayoutDashboard, 
  List, 
  Sliders, 
  Landmark, 
  Target, 
  Calendar, 
  BarChart3, 
  Users,
  Coins,
  Loader2
} from 'lucide-react';
import { FinanceOverview } from '../components/finance/FinanceOverview';
import { FinanceTransactions } from '../components/finance/FinanceTransactions';
import { FinanceBudgets } from '../components/finance/FinanceBudgets';
import { FinanceAccounts } from '../components/finance/FinanceAccounts';
import { FinanceGoals } from '../components/finance/FinanceGoals';
import { FinanceBills } from '../components/finance/FinanceBills';
import { FinanceReports } from '../components/finance/FinanceReports';
import { FinanceShared } from '../components/finance/FinanceShared';

export const Finance: React.FC = () => {
  const { user } = useAuth();
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Month date selector state (defaults to Aug 2026 for consistency with references)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 7, 1)); 

  // Database lists
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<FinanceSubscription[]>([]);
  const [sharedSpaces, setSharedSpaces] = useState<FinanceSharedSpace[]>([]);

  // State filtering overrides
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState('all');

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // Fetch Finance Data
  const loadFinanceData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [accs, txs, cats, buds, gls, subs, spaces] = await Promise.all([
        dbService.getFinanceAccounts(user.id),
        dbService.getFinanceTransactions(user.id),
        dbService.getFinanceCategories(user.id),
        dbService.getFinanceBudgets(user.id),
        dbService.getFinanceGoals(user.id),
        dbService.getFinanceSubscriptions(user.id),
        dbService.getFinanceSharedSpaces(user.id)
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setCategories(cats);
      setBudgets(buds);
      setGoals(gls);
      setSubscriptions(subs);
      setSharedSpaces(spaces);
    } catch (err) {
      console.error('[Life-OS] Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [user]);

  // CRUD operation bindings (Updates states locally or re-fetches to sync immediately)
  
  // Accounts CRUD
  const handleCreateAccount = async (payload: any) => {
    await dbService.createFinanceAccount(payload);
    await loadFinanceData();
  };
  const handleUpdateAccount = async (id: string, payload: any) => {
    await dbService.updateFinanceAccount(user!.id, id, payload);
    await loadFinanceData();
  };
  const handleDeleteAccount = async (id: string) => {
    await dbService.deleteFinanceAccount(user!.id, id);
    await loadFinanceData();
  };

  // Transactions CRUD
  const handleCreateTransaction = async (payload: any, splits?: any) => {
    await dbService.createFinanceTransaction(payload, splits);
    await loadFinanceData();
  };
  const handleUpdateTransaction = async (id: string, payload: any) => {
    await dbService.updateFinanceTransaction(user!.id, id, payload);
    await loadFinanceData();
  };
  const handleDeleteTransaction = async (id: string) => {
    await dbService.deleteFinanceTransaction(user!.id, id);
    await loadFinanceData();
  };

  // Budgets CRUD
  const handleCreateBudget = async (payload: any) => {
    await dbService.createFinanceBudget(payload);
    await loadFinanceData();
  };
  const handleUpdateBudget = async (id: string, payload: any) => {
    await dbService.updateFinanceBudget(user!.id, id, payload);
    await loadFinanceData();
  };
  const handleDeleteBudget = async (id: string) => {
    await dbService.deleteFinanceBudget(user!.id, id);
    await loadFinanceData();
  };

  // Goals CRUD
  const handleCreateGoal = async (payload: any) => {
    await dbService.createFinanceGoal(payload);
    await loadFinanceData();
  };
  const handleUpdateGoal = async (id: string, payload: any) => {
    await dbService.updateFinanceGoal(user!.id, id, payload);
    await loadFinanceData();
  };
  const handleDeleteGoal = async (id: string) => {
    await dbService.deleteFinanceGoal(user!.id, id);
    await loadFinanceData();
  };

  // Subscriptions CRUD
  const handleCreateSubscription = async (payload: any) => {
    await dbService.createFinanceSubscription(payload);
    await loadFinanceData();
  };
  const handleUpdateSubscription = async (id: string, payload: any) => {
    await dbService.updateFinanceSubscription(user!.id, id, payload);
    await loadFinanceData();
  };
  const handleDeleteSubscription = async (id: string) => {
    await dbService.deleteFinanceSubscription(user!.id, id);
    await loadFinanceData();
  };

  // Secondary sidebar tabs list configuration
  const subNavItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: List },
    { id: 'budgets', name: 'Budgets', icon: Sliders },
    { id: 'accounts', name: 'Accounts', icon: Landmark },
    { id: 'goals', name: 'Goals', icon: Target },
    { id: 'bills', name: 'Bills & Subscriptions', icon: Calendar },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'shared', name: 'Shared', icon: Users },
  ];

  // Active sub-panel render switch
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <FinanceOverview
            accounts={accounts}
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            subscriptions={subscriptions}
            categories={categories}
            onTabChange={setActiveTab}
            onCategoryFilter={setCurrentCategoryFilter}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
          />
        );
      case 'transactions':
        return (
          <FinanceTransactions
            accounts={accounts}
            transactions={transactions}
            categories={categories}
            currentCategoryFilter={currentCategoryFilter}
            setCurrentCategoryFilter={setCurrentCategoryFilter}
            onCreateTransaction={handleCreateTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            userId={user!.id}
          />
        );
      case 'budgets':
        return (
          <FinanceBudgets
            budgets={budgets}
            categories={categories}
            transactions={transactions}
            onCreateBudget={handleCreateBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
            userId={user!.id}
          />
        );
      case 'accounts':
        return (
          <FinanceAccounts
            accounts={accounts}
            onCreateAccount={handleCreateAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
            onCreateTransaction={handleCreateTransaction}
            userId={user!.id}
          />
        );
      case 'goals':
        return (
          <FinanceGoals
            goals={goals}
            onCreateGoal={handleCreateGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            userId={user!.id}
          />
        );
      case 'bills':
        return (
          <FinanceBills
            subscriptions={subscriptions}
            accounts={accounts}
            categories={categories}
            onCreateSubscription={handleCreateSubscription}
            onUpdateSubscription={handleUpdateSubscription}
            onDeleteSubscription={handleDeleteSubscription}
            userId={user!.id}
          />
        );
      case 'reports':
        return (
          <FinanceReports
            transactions={transactions}
            categories={categories}
            currentMonth={currentMonth}
          />
        );
      case 'shared':
        return (
          <FinanceShared
            sharedSpaces={sharedSpaces}
            accounts={accounts}
            categories={categories}
            transactions={transactions}
            onCreateTransaction={handleCreateTransaction}
            userId={user!.id}
          />
        );
      default:
        return null;
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex-1 min-h-[400px] flex items-center justify-center text-text-secondary select-none">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading Finance Space...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-screen bg-[#0B0F19]">
      
      {/* Secondary Sub-Sidebar navigation for Finance */}
      <aside className="w-full md:w-56 bg-surface/10 border-b md:border-b-0 md:border-r border-border/10 flex md:flex-col p-4 shrink-0 md:h-screen md:sticky md:top-0 overflow-x-auto md:overflow-x-visible select-none whitespace-nowrap md:whitespace-normal scrollbar-none">
        
        {/* Module title header */}
        <div className="hidden md:flex items-center gap-2.5 px-3 mb-6">
          <div className="h-7 w-7 rounded-lg bg-accent/15 border border-accent/35 text-accent flex items-center justify-center">
            <Coins className="h-4 w-4" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-text-primary">Finance</span>
        </div>

        {/* Tab buttons listing */}
        <nav className="flex md:flex-col gap-1 w-full">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'transactions') {
                    setCurrentCategoryFilter('all'); // Reset category filters on sub-switches
                  }
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none outline-none ${
                  isActive 
                    ? 'bg-accent/15 text-accent border-l-2 border-accent pl-[12px]' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/20'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Primary Workspace Scroll Panel */}
      <main className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full">
        {renderActiveScreen()}
      </main>
    </div>
  );
};
