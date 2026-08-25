import React, { useState } from 'react';
import { 
  TrendingUp, 
  Download
} from 'lucide-react';
import type { 
  FinanceTransaction, 
  FinanceCategory 
} from '../../services/supabase';

interface ReportsProps {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  currentMonth: Date;
}

export const FinanceReports: React.FC<ReportsProps> = ({
  transactions,
  categories,
  currentMonth
}) => {
  const reportRange = '3M';
  const [activeReportTab, setActiveReportTab] = useState<'spending' | 'income' | 'networth'>('spending');

  // Filter transactions for active month
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const activeMonthTransactions = transactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d >= startOfMonth && d <= endOfMonth;
  });

  // 1. Calculate Income breakdown
  const incomeTransactions = activeMonthTransactions.filter(t => t.type === 'income');
  const totalIncome = incomeTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const incomeByCategory = incomeTransactions.reduce((acc: { [key: string]: number }, curr) => {
    const catId = curr.category_id || 'other';
    acc[catId] = (acc[catId] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const incomeBreakdown = Object.entries(incomeByCategory).map(([catId, amount]) => {
    const category = categories.find(c => c.id === catId);
    return {
      name: category ? category.name : 'Other Income',
      amount,
      percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
      color: category ? category.color : '#10B981'
    };
  }).sort((a, b) => b.amount - a.amount);

  // 2. Calculate Spending breakdown
  const expenseTransactions = activeMonthTransactions.filter(t => t.type === 'expense');
  const totalExpenses = expenseTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const expenseByCategory = expenseTransactions.reduce((acc: { [key: string]: number }, curr) => {
    const catId = curr.category_id || 'other';
    acc[catId] = (acc[catId] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const spendingBreakdown = Object.entries(expenseByCategory).map(([catId, amount]) => {
    const category = categories.find(c => c.id === catId);
    return {
      name: category ? category.name : 'Other',
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      color: category ? category.color : '#EF4444'
    };
  }).sort((a, b) => b.amount - a.amount);

  // 3. Calculate Savings Rate
  const savingsAmount = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // 4. Net Worth History (Simulated Trend over 3 Months for consistency)
  const netWorthHistory = [
    { label: 'June 2026', value: 210000 },
    { label: 'July 2026', value: 224000 },
    { label: 'August 2026', value: 240000 }
  ];
  const maxWorth = Math.max(...netWorthHistory.map(w => w.value), 300000);

  // Coordinates math for Net Worth SVG Curve
  const getNetWorthCoordinates = () => {
    const width = 450;
    const height = 150;
    const padding = 15;
    const stepX = (width - padding * 2) / (netWorthHistory.length - 1);
    
    return netWorthHistory.map((pt, idx) => {
      const x = padding + idx * stepX;
      const y = height - padding - ((pt.value / maxWorth) * (height - padding * 2));
      return { x, y };
    });
  };

  const netWorthPoints = getNetWorthCoordinates();

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

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ['Merchant', 'Type', 'Amount', 'Category', 'Date', 'Notes'];
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.category_id);
      return [
        t.merchant || 'Generic',
        t.type,
        t.amount,
        cat ? cat.name : 'None',
        t.transaction_date.split('T')[0],
        t.notes || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Life-OS-Finance-Transactions-${reportRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left select-none">
      
      {/* Header filter controls */}
      <div className="flex justify-between items-center bg-surface/10 p-3 rounded-2xl border border-border/10">
        <div>
          <h2 className="text-xs font-bold text-text-primary tracking-wide">Financial Reports</h2>
          <p className="text-[9px] text-text-secondary font-medium">Income, spending, and net asset rates</p>
        </div>

        <div className="flex gap-2">
          {/* CSV Download */}
          <button
            onClick={handleExportCSV}
            className="p-2 bg-surface/40 hover:bg-surface border border-border/20 text-text-secondary hover:text-text-primary rounded-xl flex items-center justify-center gap-1.5 text-[9px] font-bold transition-all outline-none"
            title="Download CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main stats card summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20">
          <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Total Cash In</span>
          <h3 className="text-sm font-black text-success mt-1">₹{totalIncome.toLocaleString('en-IN')}</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20">
          <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Total Cash Out</span>
          <h3 className="text-sm font-black text-danger mt-1">₹{totalExpenses.toLocaleString('en-IN')}</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20">
          <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Net Savings</span>
          <h3 className="text-sm font-black text-text-primary mt-1">₹{savingsAmount.toLocaleString('en-IN')}</h3>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-border/10 bg-surface/20 flex flex-col justify-between">
          <span className="text-[8px] font-extrabold text-text-secondary uppercase tracking-widest block">Savings Rate</span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-sm font-black text-text-primary">{savingsRate.toFixed(1)}%</h3>
            <span className="text-[9px] font-bold text-success flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Good rate
            </span>
          </div>
        </div>
      </div>

      {/* Layout details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left column: reports categories donut & tables */}
        <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 lg:col-span-7 flex flex-col justify-between min-h-[300px] space-y-4">
          <div className="flex justify-between items-center text-xs font-bold border-b border-border/5 pb-2">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveReportTab('spending')}
                className={`pb-1 border-b-2 text-[9px] uppercase font-bold tracking-wider transition-all ${
                  activeReportTab === 'spending' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Spending Breakdown
              </button>
              <button 
                onClick={() => setActiveReportTab('income')}
                className={`pb-1 border-b-2 text-[9px] uppercase font-bold tracking-wider transition-all ${
                  activeReportTab === 'income' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Income Breakdown
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 pr-1 overflow-y-auto max-h-[220px]">
            {activeReportTab === 'spending' ? (
              spendingBreakdown.length === 0 ? (
                <div className="text-center py-10 text-[10px] text-text-secondary font-bold">No expenses logged.</div>
              ) : (
                spendingBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1 text-[10px] font-bold">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-text-primary">{item.name}</span>
                      </div>
                      <span className="text-text-secondary">₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)</span>
                    </div>
                    <div className="h-1 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))
              )
            ) : (
              incomeBreakdown.length === 0 ? (
                <div className="text-center py-10 text-[10px] text-text-secondary font-bold">No income logged.</div>
              ) : (
                incomeBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1 text-[10px] font-bold">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-text-primary">{item.name}</span>
                      </div>
                      <span className="text-text-secondary">₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)</span>
                    </div>
                    <div className="h-1 w-full bg-surface-hover rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Right column: Net Worth history line chart */}
        <div className="glass-panel p-4 rounded-2xl border border-border/10 bg-surface/10 lg:col-span-5 flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary tracking-wide">Net Worth History</h4>
              <p className="text-[9px] text-text-secondary font-medium">Assets minus liabilities trend</p>
            </div>
            
            <span className="text-[9px] font-bold text-success flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +15.3% vs last quarter
            </span>
          </div>

          {/* SVG Net worth Plotted line */}
          <div className="h-[140px] w-full flex items-end justify-center relative mt-2">
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

              {netWorthPoints.length > 0 && (
                <path 
                  d={`${formatPathString(netWorthPoints)} L ${netWorthPoints[netWorthPoints.length-1].x} 135 L ${netWorthPoints[0].x} 135 Z`} 
                  fill="url(#networthGradient)" 
                  opacity="0.05"
                />
              )}

              <defs>
                <linearGradient id="networthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path 
                d={formatPathString(netWorthPoints)} 
                fill="none" 
                stroke="#8B5CF6" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />

              {netWorthPoints.map((pt, i) => (
                <circle 
                  key={`nw-${i}`}
                  cx={pt.x} 
                  cy={pt.y} 
                  r="4" 
                  fill="#8B5CF6" 
                  stroke="#0B0F19"
                  strokeWidth="1.5"
                  className="hover:scale-125 transition-transform cursor-pointer"
                />
              ))}
            </svg>

            {/* Labels */}
            <div className="absolute bottom-[-10px] w-full flex justify-between px-2 text-[8px] font-bold text-text-secondary select-none">
              {netWorthHistory.map((w, idx) => (
                <span key={idx}>{w.label}</span>
              ))}
            </div>
          </div>

          <div className="mt-3 bg-surface/30 p-2.5 rounded-xl border border-border/5 text-[9px] font-semibold text-text-secondary flex justify-between">
            <span>Starting (June): ₹2.1L</span>
            <span>Current (August): ₹2.4L</span>
            <span className="text-success">Net Change: +₹30,000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
