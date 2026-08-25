import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type LearningActivity, type Task, type FitnessActivity, type RoutineItem } from '../services/supabase';
import { StreakCard } from '../components/dashboard/StreakCard';
import { DashboardTasksWidget } from '../components/dashboard/DashboardTasksWidget';
import { DashboardFitnessWidget } from '../components/dashboard/DashboardFitnessWidget';
import { DashboardFinanceWidget } from '../components/dashboard/DashboardFinanceWidget';
import { ProgressCard } from '../components/dashboard/ProgressCard';
import { Calendar } from '../components/dashboard/Calendar';
import { TodaysFocus, type FocusTopic } from '../components/dashboard/TodaysFocus';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { QuickJournal } from '../components/dashboard/QuickJournal';
import { RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [streakStats, setStreakStats] = useState({ current: 24, best: 45 });
  const [learningProgress, setLearningProgress] = useState(0);
  const [learningDetails, setLearningDetails] = useState('0 / 0 topics completed');
  const [focusTopics, setFocusTopics] = useState<FocusTopic[]>([]);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  
  // Tasks integration states
  const [tasksProgress, setTasksProgress] = useState(0);
  const [tasksDetails, setTasksDetails] = useState('0 / 0 tasks completed');
  const [todayPersonalTasks, setTodayPersonalTasks] = useState<Task[]>([]);
  const [todayWorkTasks, setTodayWorkTasks] = useState<Task[]>([]);
  const [personalOpenCount, setPersonalOpenCount] = useState(0);
  const [workOpenCount, setWorkOpenCount] = useState(0);
  
  // Fitness integration states
  const [fitnessStreak, setFitnessStreak] = useState({ current: 12, best: 28 });
  const [fitnessProgress, setFitnessProgress] = useState(0);
  const [fitnessDetails, setFitnessDetails] = useState('0 / 5 workouts completed');
  const [todayFitActivity, setTodayFitActivity] = useState<FitnessActivity | null>(null);
  const [todayFitPlanned, setTodayFitPlanned] = useState<RoutineItem | null>(null);
  
  // Finance integration states
  const [financeBalance, setFinanceBalance] = useState(0);
  const [financeSpent, setFinanceSpent] = useState(0);
  const [financeSaved, setFinanceSaved] = useState(0);
  const [financeBudgetSpent, setFinanceBudgetSpent] = useState(0);
  const [financeBudgetLimit, setFinanceBudgetLimit] = useState(0);
  const [financeUpcomingBill, setFinanceUpcomingBill] = useState<{ name: string; amount: number; due_date: string } | null>(null);
  const [financeProgress, setFinanceProgress] = useState(0);
  const [financeDetails, setFinanceDetails] = useState('₹0 spent this month');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async (showRefreshIndicator = false) => {
    if (!user) return;
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);
    
    setError(null);

    try {
      // Get start of current week (Monday)
      const today = new Date();
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMonday);
      const mondayStr = monday.toISOString().split('T')[0];

      // 1. Fetch data in parallel
      const [topics, activitiesData, streaks, fitActivities, fitStreak, weeklyRoutine] = await Promise.all([
        dbService.getTopics(user.id),
        dbService.getActivities(user.id, 5),
        dbService.getStreaks(user.id),
        dbService.getFitnessActivities(user.id),
        dbService.getFitnessStreak(user.id),
        dbService.getOrCreateWeeklyRoutine(user.id, mondayStr)
      ]);

      // 2. Process Learning Progress
      const totalTopics = topics.length;
      const completedTopics = topics.filter(t => t.is_completed).length;
      const progressPct = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
      
      setLearningProgress(progressPct);
      setLearningDetails(`${completedTopics} / ${totalTopics} topics completed`);

      // 3. Process Streak
      setStreakStats(streaks);

      // 3.1. Process Fitness metrics
      setFitnessStreak(fitStreak);
      
      const monDate = new Date(mondayStr);
      monDate.setHours(0, 0, 0, 0);
      const sunDate = new Date(monDate);
      sunDate.setDate(monDate.getDate() + 6);
      sunDate.setHours(23, 59, 59, 999);

      const weekFit = fitActivities.filter(act => {
        const d = new Date(act.started_at);
        return d >= monDate && d <= sunDate;
      });

      const fitProgressPct = Math.min((weekFit.length / 5) * 100, 100);
      setFitnessProgress(fitProgressPct);
      setFitnessDetails(`${weekFit.length} / 5 workouts completed`);

      // Determine today's activity and today's planned item
      const todayDateStr = new Date().toDateString();
      const todayAct = fitActivities.find(act => new Date(act.started_at).toDateString() === todayDateStr) || null;
      setTodayFitActivity(todayAct);

      const todayDayOfWeek = new Date().getDay();
      const todayPlan = (weeklyRoutine.items || []).find(i => i.day_of_week === todayDayOfWeek) || null;
      setTodayFitPlanned(todayPlan);

      // 3.5. Fetch and Process Tasks
      const [personalTasks, workTasks] = await Promise.all([
        dbService.getTasks(user.id, 'personal'),
        dbService.getTasks(user.id, 'work')
      ]);

      const allTasks = [...personalTasks, ...workTasks];
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.is_completed).length;
      const tProgressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      setTasksProgress(tProgressPct);
      setTasksDetails(`${completedTasks} / ${totalTasks} tasks completed`);
      setPersonalOpenCount(personalTasks.filter(t => !t.is_completed).length);
      setWorkOpenCount(workTasks.filter(t => !t.is_completed).length);

      const todayStr = new Date().toISOString().split('T')[0];
      const filterToday = (tList: Task[]) => {
        return tList.filter(t => t.is_in_today || (t.due_at && t.due_at.split('T')[0] === todayStr));
      };

      let personalToday = filterToday(personalTasks);
      let workToday = filterToday(workTasks);

      if (personalToday.length === 0) personalToday = personalTasks.filter(t => !t.is_completed).slice(0, 3);
      if (workToday.length === 0) workToday = workTasks.filter(t => !t.is_completed).slice(0, 3);

      setTodayPersonalTasks(personalToday.slice(0, 3));
      setTodayWorkTasks(workToday.slice(0, 3));

      // 3.8. Fetch and Process Finance Summary
      const [finAccounts, finTransactions, finBudgets, finSubscriptions] = await Promise.all([
        dbService.getFinanceAccounts(user.id),
        dbService.getFinanceTransactions(user.id),
        dbService.getFinanceBudgets(user.id),
        dbService.getFinanceSubscriptions(user.id)
      ]);

      const balanceSum = finAccounts.reduce((sum, curr) => sum + Number(curr.current_balance), 0);

      const startOfM = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfM = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const monthTxs = finTransactions.filter(t => {
        const d = new Date(t.transaction_date);
        return d >= startOfM && d <= endOfM;
      });

      const incomeSum = monthTxs.filter(t => t.type === 'income').reduce((sum, curr) => sum + Number(curr.amount), 0);
      const expenseSum = monthTxs.filter(t => t.type === 'expense').reduce((sum, curr) => sum + Number(curr.amount), 0);
      const savingsSum = Math.max(0, incomeSum - expenseSum);

      const activeBudgets = finBudgets.filter(b => {
        const s = new Date(b.start_date);
        return s.getMonth() === today.getMonth() && s.getFullYear() === today.getFullYear();
      });

      const overallBudgetLimit = activeBudgets.reduce((sum, curr) => sum + Number(curr.amount), 0);
      const overallBudgetSpent = activeBudgets.reduce((sum, b) => {
        const spent = monthTxs
          .filter(t => t.type === 'expense' && t.category_id === b.category_id)
          .reduce((acc, curr) => acc + Number(curr.amount), 0);
        return sum + spent;
      }, 0);

      const nextBill = finSubscriptions
        .filter(s => s.status === 'active')
        .sort((a, b) => new Date(a.next_payment).getTime() - new Date(b.next_payment).getTime())[0] || null;

      const fProgressPct = overallBudgetLimit > 0 ? Math.min(100, Math.round((overallBudgetSpent / overallBudgetLimit) * 100)) : 0;

      setFinanceBalance(balanceSum);
      setFinanceSpent(expenseSum);
      setFinanceSaved(savingsSum);
      setFinanceBudgetSpent(overallBudgetSpent);
      setFinanceBudgetLimit(overallBudgetLimit);
      if (nextBill) {
        setFinanceUpcomingBill({
          name: nextBill.name,
          amount: Number(nextBill.amount),
          due_date: nextBill.next_payment
        });
      } else {
        setFinanceUpcomingBill(null);
      }
      setFinanceProgress(fProgressPct);
      setFinanceDetails(`₹${expenseSum.toLocaleString('en-IN')} spent`);

      // 4. Process Today's Focus (up to 4 uncompleted topics)
      // We will map categories to get names later, but for now, let's load active categories too
      const categories = await dbService.getCategories(user.id);
      const catMap = new Map(categories.map(c => [c.id, c.name]));
      
      const uncompleted = topics
        .filter(t => !t.is_completed)
        .slice(0, 4)
        .map(t => ({
          id: t.id,
          title: t.title,
          is_completed: false,
          category_name: catMap.get(t.category_id)
        }));
      setFocusTopics(uncompleted);

      // 5. Set Activities
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Dashboard loading error:', err);
      setError('Unable to load dashboard data. Please check connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleToggleFocusComplete = async (topicId: string, currentStatus: boolean) => {
    if (!user) return;
    
    try {
      // Optimistically update Today's Focus UI to be fast
      setFocusTopics(prev => prev.filter(t => t.id !== topicId));

      await dbService.updateTopic(user.id, topicId, { is_completed: !currentStatus });
      
      // Reload in background silently to sync streaks and progress bars
      loadDashboardData(true);
    } catch (err) {
      console.error('Failed to complete focus topic', err);
      // Fallback reload if error
      loadDashboardData();
    }
  };

  const progressItems = [
    { name: 'Learning', progress: learningProgress, isImplemented: true, details: learningDetails },
    { name: 'Fitness', progress: fitnessProgress, isImplemented: true, details: fitnessDetails },
    { name: 'Tasks', progress: tasksProgress, isImplemented: true, details: tasksDetails },
    { name: 'Journal', progress: 0, isImplemented: false },
    { name: 'Finance', progress: financeProgress, isImplemented: true, details: financeDetails },
  ];

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto animate-fade-in select-none">
      
      {/* Header section with refresh triggers */}
      <div className="flex justify-between items-center px-1">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-accent">Personal Terminal</span>
          <h2 className="text-xl font-extrabold tracking-tight text-text-primary mt-0.5">Control Center</h2>
        </div>
        <button
          onClick={() => loadDashboardData(true)}
          disabled={isLoading || isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/30 bg-surface/20 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 transition-all focus:outline-none"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs flex flex-col gap-2 max-w-md mx-auto text-center">
          <p>{error}</p>
          <button 
            onClick={() => loadDashboardData()}
            className="px-4 py-1.5 bg-red-950/40 border border-red-500/30 hover:border-red-500/50 rounded-xl font-bold uppercase tracking-wider text-[10px] self-center transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Grid 1: Streaks and Daily Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StreakCard 
          icon="🔥" 
          title="Learning Streak" 
          current={streakStats.current} 
          best={streakStats.best} 
          isLoading={isLoading} 
        />
        <StreakCard 
          icon="🏃" 
          title="Fitness Streak" 
          current={fitnessStreak.current} 
          best={fitnessStreak.best} 
          isLoading={isLoading} 
        />
        <ProgressCard 
          items={progressItems} 
          isLoading={isLoading} 
        />
      </div>

      {/* Grid 2: Core Activity Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left column: Calendar & Journal */}
        <div className="space-y-5 lg:col-span-1">
          <Calendar />
          <QuickJournal />
          <DashboardFinanceWidget
            balance={financeBalance}
            spent={financeSpent}
            saved={financeSaved}
            budgetSpent={financeBudgetSpent}
            budgetLimit={financeBudgetLimit}
            upcomingBill={financeUpcomingBill}
            isLoading={isLoading}
          />
        </div>

        {/* Center column: Focus and Tasks */}
        <div className="lg:col-span-1 space-y-5">
          <TodaysFocus 
            topics={focusTopics} 
            onToggleComplete={handleToggleFocusComplete}
            isLoading={isLoading}
          />
          <DashboardTasksWidget
            personalTasks={todayPersonalTasks}
            workTasks={todayWorkTasks}
            personalCount={personalOpenCount}
            workCount={workOpenCount}
            isLoading={isLoading}
            onTaskChange={loadDashboardData}
          />
        </div>

        {/* Right column: Recent Activity */}
        <div className="lg:col-span-1 space-y-5">
          <RecentActivity 
            activities={activities}
            isLoading={isLoading}
          />
          <DashboardFitnessWidget
            todayActivity={todayFitActivity}
            todayPlanned={todayFitPlanned}
            isLoading={isLoading}
          />
        </div>

      </div>

    </div>
  );
};
