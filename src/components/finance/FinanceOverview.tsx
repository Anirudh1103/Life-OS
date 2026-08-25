import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  DollarSign,
  Briefcase,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  HeartPulse,
  FileText,
  Plane,
  GraduationCap,
  HelpCircle,
  Clock,
  Info
} from 'lucide-react';
import type { 
  FinanceAccount, 
  FinanceTransaction, 
  FinanceBudget, 
  FinanceGoal, 
  FinanceSubscription,
  FinanceCategory
} from '../../services/supabase';

interface OverviewProps {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  budgets: FinanceBudget[];
  goals: FinanceGoal[];
  subscriptions: FinanceSubscription[];
  categories: FinanceCategory[];
  onTabChange: (tab: string) => void;
  onCategoryFilter: (categoryId: string) => void;
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
}

export const FinanceOverview: React.FC<OverviewProps> = ({
  accounts,
  transactions,
  budgets,
  goals,
  subscriptions,
  categories,
  onTabChange,
  onCategoryFilter,
  currentMonth,
  setCurrentMonth
}) => {
  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const activeMonthTransactions = transactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d >= startOfMonth && d <= endOfMonth;
  });

  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.current_balance), 0);
  
  const monthlyIncome = activeMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const monthlyExpenses = activeMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses);

  const investmentsMock = 52000; 
  const assets = accounts
    .filter(a => Number(a.current_balance) > 0)
    .reduce((acc, curr) => acc + Number(curr.current_balance), 0) + investmentsMock;
  const liabilities = Math.abs(
    accounts
      .filter(a => Number(a.current_balance) < 0)
      .reduce((acc, curr) => acc + Number(curr.current_balance), 0)
  );
  const netWorth = assets - liabilities;

  const expenseByCategory = activeMonthTransactions
    .filter(t => t.type === 'expense' && t.category_id)
    .reduce((acc: { [key: string]: number }, curr) => {
      const catId = curr.category_id || 'other';
      acc[catId] = (acc[catId] || 0) + Number(curr.amount);
      return acc;
    }, {});

  const totalExpenseWithCat = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);

  const spendingBreakdown = Object.entries(expenseByCategory).map(([catId, amount]) => {
    const category = categories.find(c => c.id === catId);
    return {
      id: catId,
      name: category ? category.name : 'Other',
      amount,
      percentage: totalExpenseWithCat > 0 ? Math.round((amount / totalExpenseWithCat) * 100) : 0,
      color: category ? category.color : '#6B7280',
      icon: category ? category.icon : 'HelpCircle'
    };
  }).sort((a, b) => b.amount - a.amount);

  const recentTransactions = transactions.slice(0, 5);

  const activeBudgets = budgets.filter(b => {
    const s = new Date(b.start_date);
    return s.getMonth() === currentMonth.getMonth() && s.getFullYear() === currentMonth.getFullYear();
  });

  const budgetProgressList = activeBudgets.map(b => {
    const spent = activeMonthTransactions
      .filter(t => t.type === 'expense' && t.category_id === b.category_id)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    const percentage = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
    return {
      ...b,
      spent,
      percentage
    };
  });

  const upcomingBills = subscriptions
    .filter(s => s.status === 'active')
    .sort((a, b) => new Date(a.next_payment).getTime() - new Date(b.next_payment).getTime())
    .slice(0, 4);

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

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getWeeklyCashFlow = () => {
    const weeklyData = [
      { week: '1 Aug', income: 15000, expenses: 10000 },
      { week: '8 Aug', income: 30000, expenses: 22000 },
      { week: '15 Aug', income: 55000, expenses: 38000 },
      { week: '22 Aug', income: 82000, expenses: 51000 },
      { week: '29 Aug', income: monthlyIncome, expenses: monthlyExpenses }
    ];
    return weeklyData;
  };

  const cashFlowWeeks = getWeeklyCashFlow();
  const maxVal = Math.max(...cashFlowWeeks.map(w => Math.max(w.income, w.expenses)), 100000);

  const getSvgCoordinates = (dataList: number[]) => {
    const width = 450;
    const height = 150;
    const padding = 15;
    const stepX = (width - padding * 2) / (dataList.length - 1);
    
    return dataList.map((val, idx) => {
      const x = padding + idx * stepX;
      const y = height - padding - ((val / maxVal) * (height - padding * 2));
      return { x, y };
    });
  };

  const incomePoints = getSvgCoordinates(cashFlowWeeks.map(w => w.income));
  const expensePoints = getSvgCoordinates(cashFlowWeeks.map(w => w.expenses));

  const formatPathString = (coords: {x: number, y: number}[]) => {
    if (coords.length === 0) return '';
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const cpX1 = coords[i-1].x + (coords[i].x - coords[i-1].x) / 2;
      const cpY1 = coords[i-1].y;
      const cpX2 = coords[i-1].x + (coords[i].x - coords[i-1].x) / 2;
      const cpY2 = coords[i].y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords[i].x} ${coords[i].y}`;
    }
    return d;
  };

  let cumPercent = 0;
  const getDonutSegments = () => {
    const radius = 50;
    const circum = 2 * Math.PI * radius;
    
    return spendingBreakdown.map((item) => {
      const strokeDash = circum;
      const strokeOffset = circum - (item.percentage / 100) * circum;
      const rotation = (cumPercent / 100) * 360;
      cumPercent += item.percentage;
      
      return {
        ...item,
        dashArray: strokeDash,
        dashOffset: strokeOffset,
        rotation
      };
    });
  };

  const getGreeting = () => {
    const now = new Date();
    let hour = now.getHours();
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        hour = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(now), 10);
      }
    } catch (e) {}

    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 16) return 'Good afternoon';
    if (hour >= 16 && hour < 22) return 'Good evening';
    return 'Good night';
  };

  const donutSegments = getDonutSegments();
  const dynamicGreeting = getGreeting();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary tracking-tight">{dynamicGreeting}, Anirudh 👋</h2>
          <p className="text-[10px] text-text-secondary mt-0.5 font-medium">Here's your financial overview.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-surface/40 border border-border/20 rounded-xl p-1 shrink-0 select-none">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-surface rounded-lg text-text-secondary hover:text-text-primary transition-colors outline-none"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="text-[10px] font-bold text-text-primary px-2 min-w-[100px] text-center tracking-wide">
            {monthName}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-surface rounded-lg text-text-secondary hover:text-text-primary transition-colors outline-none"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between min-h-[95px] border border-border/20 bg-surface/20">
          <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Total Balance</span>
          <div className="mt-2.5">
            <h3 className="text-sm font-black text-text-primary tracking-wide">₹{totalBalance.toLocaleString('en-IN')}</h3>
            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-success">
              <TrendingUp className="h-3 w-3" />
              <span>12.5% vs last month</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between min-h-[95px] border border-border/20 bg-surface/20">
          <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Total Income</span>
          <div className="mt-2.5">
            <h3 className="text-sm font-black text-text-primary tracking-wide">₹{monthlyIncome.toLocaleString('en-IN')}</h3>
            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-success">
              <TrendingUp className="h-3 w-3" />
              <span>8.2% vs last month</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between min-h-[95px] border border-border/20 bg-surface/20">
          <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Total Expenses</span>
          <div className="mt-2.5">
            <h3 className="text-sm font-black text-text-primary tracking-wide">₹{monthlyExpenses.toLocaleString('en-IN')}</h3>
            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-danger">
              <TrendingDown className="h-3 w-3" />
              <span>5.1% vs last month</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between min-h-[95px] border border-border/20 bg-surface/20">
          <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Total Savings</span>
          <div className="mt-2.5">
            <h3 className="text-sm font-black text-text-primary tracking-wide">₹{monthlySavings.toLocaleString('en-IN')}</h3>
            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-success">
              <TrendingUp className="h-3 w-3" />
              <span>18.7% vs last month</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between min-h-[95px] col-span-2 lg:col-span-1 border border-border/20 bg-surface/20">
          <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">Net Worth</span>
          <div className="mt-2.5">
            <h3 className="text-sm font-black text-text-primary tracking-wide">₹{netWorth.toLocaleString('en-IN')}</h3>
            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-success">
              <TrendingUp className="h-3 w-3" />
              <span>15.3% vs last month</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 lg:col-span-8 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary tracking-wide">Cash Flow</h4>
              <p className="text-[9px] text-text-secondary font-medium">Income vs Expenses monthly trend</p>
            </div>
            
            <div className="flex gap-4 text-[9px] font-bold select-none">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-text-primary">Income (₹{monthlyIncome.toLocaleString('en-IN')})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-text-primary">Expenses (₹{monthlyExpenses.toLocaleString('en-IN')})</span>
              </div>
            </div>
          </div>

          <div className="h-[160px] w-full flex items-end justify-center relative mt-2">
            <svg 
              viewBox="0 0 450 150" 
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <line x1="0" y1="15" x2="450" y2="15" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="50" x2="450" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="85" x2="450" y2="85" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="120" x2="450" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="135" x2="450" y2="135" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {incomePoints.length > 0 && (
                <path 
                  d={`${formatPathString(incomePoints)} L ${incomePoints[incomePoints.length-1].x} 135 L ${incomePoints[0].x} 135 Z`} 
                  fill="url(#incomeGradient)" 
                  opacity="0.05"
                />
              )}
              {expensePoints.length > 0 && (
                <path 
                  d={`${formatPathString(expensePoints)} L ${expensePoints[expensePoints.length-1].x} 135 L ${expensePoints[0].x} 135 Z`} 
                  fill="url(#expenseGradient)" 
                  opacity="0.05"
                />
              )}

              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path 
                d={formatPathString(incomePoints)} 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              <path 
                d={formatPathString(expensePoints)} 
                fill="none" 
                stroke="#8B5CF6" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />

              {incomePoints.map((pt, i) => (
                <circle 
                  key={`inc-${i}`}
                  cx={pt.x} 
                  cy={pt.y} 
                  r="3.5" 
                  fill="#10B981" 
                  stroke="#0B0F19"
                  strokeWidth="1.5"
                  className="hover:scale-125 transition-transform cursor-pointer"
                />
              ))}
              {expensePoints.map((pt, i) => (
                <circle 
                  key={`exp-${i}`}
                  cx={pt.x} 
                  cy={pt.y} 
                  r="3.5" 
                  fill="#8B5CF6" 
                  stroke="#0B0F19"
                  strokeWidth="1.5"
                  className="hover:scale-125 transition-transform cursor-pointer"
                />
              ))}
            </svg>

            <div className="absolute bottom-[-10px] w-full flex justify-between px-2 text-[8px] font-bold text-text-secondary select-none">
              {cashFlowWeeks.map((w, idx) => (
                <span key={idx}>{w.week}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-text-primary tracking-wide">Spending Breakdown</h4>
            <p className="text-[9px] text-text-secondary font-medium">Category distribution this month</p>
          </div>

          <div className="flex items-center gap-4 py-2 justify-center">
            <div className="relative h-28 w-28 shrink-0 select-none">
              <svg viewBox="0 0 120 120" className="h-full w-full transform -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                {donutSegments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                    transform={`rotate(${seg.rotation} 60 60)`}
                    className="transition-all duration-300 hover:stroke-[14] cursor-pointer"
                    onClick={() => {
                      onCategoryFilter(seg.id);
                      onTabChange('transactions');
                    }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-extrabold uppercase text-text-secondary tracking-widest">Total</span>
                <span className="text-[10px] font-black text-text-primary mt-0.5">₹{monthlyExpenses.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
              {spendingBreakdown.slice(0, 4).map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    onCategoryFilter(item.id);
                    onTabChange('transactions');
                  }}
                  className="flex items-center justify-between text-[9px] font-semibold cursor-pointer hover:bg-surface/30 p-1 rounded transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-text-primary truncate">{item.name}</span>
                  </div>
                  <span className="text-text-secondary shrink-0 font-bold ml-1">{item.percentage}%</span>
                </div>
              ))}
              {spendingBreakdown.length > 4 && (
                <div 
                  onClick={() => {
                    onCategoryFilter('all');
                    onTabChange('transactions');
                  }}
                  className="text-center text-[8px] font-bold text-accent hover:underline pt-0.5 cursor-pointer"
                >
                  View details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary tracking-wide">Budget Summary</h4>
              <p className="text-[9px] text-text-secondary font-medium">Spending vs limits</p>
            </div>
            <button 
              onClick={() => onTabChange('budgets')}
              className="text-[9px] font-bold text-accent hover:underline outline-none"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {budgetProgressList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <Info className="h-6 w-6 text-text-secondary/40 mb-1" />
                <span className="text-[10px] font-bold text-text-secondary">No budgets set</span>
              </div>
            ) : (
              budgetProgressList.slice(0, 3).map((b, idx) => (
                <div key={idx} className="space-y-1 text-[10px]">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-text-primary">{b.category_name}</span>
                    <span className="text-text-secondary">₹{b.spent.toLocaleString('en-IN')} / ₹{b.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="relative h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        b.percentage > 85 ? 'bg-danger' : b.percentage > 65 ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-text-secondary font-semibold">
                    <span>{b.percentage}% used</span>
                    <span>₹{(b.amount - b.spent).toLocaleString('en-IN')} left</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary tracking-wide">Upcoming Bills</h4>
              <p className="text-[9px] text-text-secondary font-medium">Coming obligations calendar</p>
            </div>
            <button 
              onClick={() => onTabChange('bills')}
              className="text-[9px] font-bold text-accent hover:underline outline-none"
            >
              View Calendar
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
            {upcomingBills.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <Calendar className="h-6 w-6 text-text-secondary/40 mb-1" />
                <span className="text-[10px] font-bold text-text-secondary">No upcoming obligations</span>
              </div>
            ) : (
              upcomingBills.map((bill, idx) => {
                const due = new Date(bill.next_payment);
                const day = due.getDate();
                const month = due.toLocaleString('en-US', { month: 'short' });
                return (
                  <div key={idx} className="flex justify-between items-center bg-surface/30 p-2 rounded-xl border border-border/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-7 w-7 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-black text-[10px] shrink-0">
                        {getCategoryIcon(bill.category_color || 'FileText')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-text-primary truncate">{bill.name}</p>
                        <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider">{day} {month}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-text-primary font-mono">₹{Number(bill.amount).toLocaleString('en-IN')}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary tracking-wide">Savings Goals</h4>
              <p className="text-[9px] text-text-secondary font-medium">Funding gauges progress</p>
            </div>
            <button 
              onClick={() => onTabChange('goals')}
              className="text-[9px] font-bold text-accent hover:underline outline-none"
            >
              View All Goals
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <Clock className="h-6 w-6 text-text-secondary/40 mb-1" />
                <span className="text-[10px] font-bold text-text-secondary">No active savings goals</span>
              </div>
            ) : (
              goals.slice(0, 2).map((g, idx) => {
                const percent = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                return (
                  <div key={idx} className="bg-surface/30 p-2.5 rounded-xl border border-border/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                        <span className="text-[10px] font-bold text-text-primary">{g.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-text-primary font-mono">{percent}%</span>
                    </div>
                    <div className="relative h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: g.color }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-text-secondary font-semibold">
                      <span>₹{g.current_amount.toLocaleString('en-IN')} saved</span>
                      <span>Target: ₹{g.target_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/10">
        <div className="flex justify-between items-center mb-3.5">
          <div>
            <h4 className="text-xs font-bold text-text-primary tracking-wide">Recent Transactions</h4>
            <p className="text-[9px] text-text-secondary font-medium">Latest logs feed</p>
          </div>
          <button 
            onClick={() => onTabChange('transactions')}
            className="text-[9px] font-bold text-accent hover:underline outline-none"
          >
            View All Transactions
          </button>
        </div>

        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 text-[10px] text-text-secondary font-bold">
              No transactions recorded yet.
            </div>
          ) : (
            recentTransactions.map((tx, idx) => {
              const isIncome = tx.type === 'income';
              const amtStr = isIncome ? `+₹${Number(tx.amount).toLocaleString('en-IN')}` : `-₹${Number(tx.amount).toLocaleString('en-IN')}`;
              
              return (
                <div key={idx} className="flex justify-between items-center p-2 rounded-xl hover:bg-surface/30 border border-transparent hover:border-border/5 transition-all">
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
                        {tx.merchant || (tx.type === 'transfer' ? 'Transfer Account' : 'Generic Expense')}
                      </p>
                      <p className="text-[8px] font-semibold text-text-secondary tracking-wider uppercase mt-0.5">
                        {tx.category_name} • {tx.account_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black tracking-wide font-mono ${isIncome ? 'text-success' : 'text-text-primary'}`}>
                      {amtStr}
                    </span>
                    <p className="text-[8.5px] font-semibold text-text-secondary mt-0.5">
                      {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
