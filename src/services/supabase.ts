import { createClient } from '@supabase/supabase-js';
import { KOTLIN_SYLLABUS } from './kotlinSyllabus';

// Types definition
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  description: string | null;
  notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  topic_id: string;
  user_id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  last_reviewed_at: string | null;
  next_review_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningActivity {
  id: string;
  user_id: string;
  topic_id: string | null;
  activity_type: string;
  created_at: string;
  topic_title?: string;
  category_name?: string;
}

// Tasks Module Types
export interface Task {
  id: string;
  user_id: string;
  workspace: 'personal' | 'work';
  title: string;
  description: string | null;
  is_completed: boolean;
  is_important: boolean;
  is_in_today: boolean;
  priority: 'none' | 'low' | 'medium' | 'high';
  due_at: string | null;
  reminder_at: string | null;
  recurrence_rule: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Join fields calculated dynamically
  steps_count?: number;
  completed_steps_count?: number;
  files_count?: number;
  flow?: TaskFlow | null;
  tags?: string[];
}

export interface TaskStep {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskFile {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface TaskFlow {
  id: string;
  task_id: string;
  user_id: string;
  name: string;
  is_completed: boolean;
  current_stage_id: string | null;
  created_at: string;
  updated_at: string;
  stages?: TaskFlowStage[];
}

export interface TaskFlowStage {
  id: string;
  flow_id: string;
  name: string;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFlowHistory {
  id: string;
  flow_id: string;
  from_stage_id: string | null;
  to_stage_id: string | null;
  changed_at: string;
  from_stage_name?: string;
  to_stage_name?: string;
}

// Fitness Module Types
export interface ActivityType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface FitnessActivity {
  id: string;
  user_id: string;
  activity_type_id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  distance: number | null;
  calories: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  steps: number | null;
  intensity: 'low' | 'medium' | 'high';
  notes: string | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
  activity_type?: ActivityType;
}

export interface FitnessRoutine {
  id: string;
  user_id: string;
  week_start: string;
  created_at: string;
  updated_at: string;
  items?: RoutineItem[];
}

export interface RoutineItem {
  id: string;
  routine_id: string;
  day_of_week: number;
  activity_type_id: string;
  title: string | null;
  duration_minutes: number;
  notes: string | null;
  sort_order: number;
  is_completed: boolean;
  completed_activity_id: string | null;
  created_at: string;
  updated_at: string;
  activity_type?: ActivityType;
}

export interface StrengthPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  exercises?: StrengthPlanExercise[];
}

export interface StrengthPlanExercise {
  id: string;
  plan_id: string;
  exercise_name: string;
  muscle_group: string | null;
  sort_order: number;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  rest_seconds: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StrengthSession {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  completed_at: string;
  notes: string | null;
  created_at: string;
  sets?: StrengthSessionSet[];
  plan_name?: string;
}

export interface StrengthSessionSet {
  id: string;
  session_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight: number;
  rpe: number | null;
  notes: string | null;
  completed_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  recorded_at: string;
  metric_type: string;
  value: number;
  unit: string | null;
  source: string;
  notes: string | null;
  created_at: string;
}

export interface FinanceAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'bank' | 'savings' | 'cash' | 'credit_card' | 'wallet' | 'investment' | 'loan' | 'other';
  institution: string | null;
  currency: string;
  opening_balance: number;
  current_balance: number;
  credit_limit: number | null;
  billing_cycle_day: number | null;
  payment_due_day: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income' | 'all';
  icon: string;
  color: string;
  sort_order: number;
}

export interface FinanceTransaction {
  id: string;
  user_id: string;
  account_id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  merchant: string | null;
  category_id: string | null;
  transaction_date: string;
  description: string | null;
  notes: string | null;
  is_recurring: boolean;
  transfer_group_id: string | null;
  shared_space_id: string | null;
  created_at: string;
  updated_at: string;
  account_name?: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  tags?: string[];
}

export interface FinanceTag {
  id: string;
  user_id: string;
  name: string;
}

export interface FinanceBudget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  period_type: 'weekly' | 'monthly' | 'custom';
  amount: number;
  carryover_enabled: boolean;
  start_date: string;
  end_date: string;
  category_name?: string;
  category_color?: string;
}

export interface FinanceGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  icon: string;
  color: string;
  notes: string | null;
}

export interface FinanceSubscription {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'every_2_weeks' | 'monthly' | 'every_4_weeks' | 'quarterly' | 'yearly' | 'custom';
  next_payment: string;
  status: 'active' | 'paused' | 'cancelled';
  start_date: string;
  end_date: string | null;
  cancelled_date: string | null;
  notes: string | null;
  account_name?: string;
  category_name?: string;
  category_color?: string;
}

export interface FinanceSharedSpace {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
}

export interface FinanceSharedMember {
  id: string;
  space_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  display_name?: string;
  email?: string;
}

export interface FinanceExpenseSplit {
  id: string;
  transaction_id: string;
  user_id: string;
  owed_amount: number;
  display_name?: string;
}

export interface FinanceSettlement {
  id: string;
  space_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  settled_date: string;
  notes: string | null;
  payer_name?: string;
  payee_name?: string;
}

// Check if credentials exist
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isMockEnabled = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id');

if (isMockEnabled) {
  console.warn(
    '[Life-OS] Supabase URL/Key is missing or placeholder. Running in LocalStorage-mock mode.'
  );
}

export const supabase = !isMockEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock storage database keys
const KEYS = {
  PROFILE: 'life_os_profile',
  CATEGORIES: 'life_os_categories',
  TOPICS: 'life_os_topics',
  FLASHCARDS: 'life_os_flashcards',
  ACTIVITIES: 'life_os_activities',
  SESSION: 'life_os_session',
  TASKS: 'life_os_tasks',
  TASK_STEPS: 'life_os_task_steps',
  TASK_FILES: 'life_os_task_files',
  TASK_FLOWS: 'life_os_task_flows',
  TASK_FLOW_STAGES: 'life_os_task_flow_stages',
  TASK_FLOW_HISTORY: 'life_os_task_flow_history',
  FITNESS_ACTIVITIES: 'life_os_fitness_activities',
  FITNESS_ROUTINES: 'life_os_fitness_routines',
  ROUTINE_ITEMS: 'life_os_routine_items',
  STRENGTH_PLANS: 'life_os_strength_plans',
  STRENGTH_PLAN_EXERCISES: 'life_os_strength_plan_exercises',
  STRENGTH_SESSIONS: 'life_os_strength_sessions',
  STRENGTH_SESSION_SETS: 'life_os_strength_session_sets',
  BODY_MEASUREMENTS: 'life_os_body_measurements',
  ACTIVITY_TYPES: 'life_os_activity_types',
  FINANCE_ACCOUNTS: 'life_os_finance_accounts',
  FINANCE_CATEGORIES: 'life_os_finance_categories',
  FINANCE_TRANSACTIONS: 'life_os_finance_transactions',
  FINANCE_TAGS: 'life_os_finance_tags',
  FINANCE_TRANSACTION_TAGS: 'life_os_finance_transaction_tags',
  FINANCE_BUDGETS: 'life_os_finance_budgets',
  FINANCE_GOALS: 'life_os_finance_goals',
  FINANCE_SUBSCRIPTIONS: 'life_os_finance_subscriptions',
  FINANCE_SHARED_SPACES: 'life_os_finance_shared_spaces',
  FINANCE_SHARED_MEMBERS: 'life_os_finance_shared_members',
  FINANCE_EXPENSE_SPLITS: 'life_os_finance_expense_splits',
  FINANCE_SETTLEMENTS: 'life_os_finance_settlements',
};

// Seed default data if empty
const initMockDB = (userId: string) => {
  if (!localStorage.getItem(KEYS.CATEGORIES)) {
    const defaultCategories: Category[] = [
      {
        id: 'cat-1',
        user_id: userId,
        name: 'Kotlin Basics',
        description: 'Fundamental building blocks of Kotlin programming language',
        icon: 'BookOpen',
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'cat-2',
        user_id: userId,
        name: 'Data Structures & Algorithms',
        description: 'Crucial structures and problem solving paradigms',
        icon: 'Code2',
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(defaultCategories));
  }

  if (!localStorage.getItem(KEYS.TOPICS)) {
    const defaultTopics: Topic[] = [
      {
        id: 'topic-1',
        category_id: 'cat-1',
        user_id: userId,
        title: 'Variables & Basic Types',
        description: 'Val, var, numbers, booleans, strings and standard declarations',
        notes: 'Kotlin has read-only variables declared with val and mutable variables declared with var.',
        is_completed: true,
        completed_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'topic-2',
        category_id: 'cat-1',
        user_id: userId,
        title: 'Kotlin Collections',
        description: 'Lists, Sets, Maps, read-only vs mutable collections',
        notes: 'By default, Kotlin collections are read-only. Use mutableListOf, mutableSetOf etc. for modifications.',
        is_completed: true,
        completed_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'topic-3',
        category_id: 'cat-1',
        user_id: userId,
        title: 'HashMaps & HashSets',
        description: 'Key-value maps, hashing mechanics and lookups',
        notes: 'HashMap stores elements in key-value pairs. O(1) average time complexity for lookups.',
        is_completed: false,
        completed_at: null,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'topic-4',
        category_id: 'cat-1',
        user_id: userId,
        title: 'Binary Search',
        description: 'Logarithmic search logic on sorted datasets',
        notes: 'Binary search works on sorted arrays. Time complexity is O(log n).',
        is_completed: false,
        completed_at: null,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(KEYS.TOPICS, JSON.stringify(defaultTopics));
  }

  if (!localStorage.getItem(KEYS.ACTIVITIES)) {
    const defaultActivities: LearningActivity[] = [
      {
        id: 'act-1',
        user_id: userId,
        topic_id: 'topic-1',
        activity_type: 'topic_completed',
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        topic_title: 'Variables & Basic Types',
        category_name: 'Kotlin Basics',
      },
      {
        id: 'act-2',
        user_id: userId,
        topic_id: 'topic-2',
        activity_type: 'topic_completed',
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        topic_title: 'Kotlin Collections',
        category_name: 'Kotlin Basics',
      },
    ];
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(defaultActivities));
  }

  // Seed tasks if empty
  if (!localStorage.getItem(KEYS.TASKS)) {
    const defaultTasks: Task[] = [
      {
        id: 'task-1',
        user_id: userId,
        workspace: 'personal',
        title: 'Read 10 pages of a book',
        description: 'Read Chapter 4 of Clean Code',
        is_completed: false,
        is_important: true,
        is_in_today: true,
        priority: 'none',
        due_at: new Date().toISOString().split('T')[0],
        reminder_at: null,
        recurrence_rule: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['personal', 'reading']
      },
      {
        id: 'task-2',
        user_id: userId,
        workspace: 'personal',
        title: 'Workout - Strength Training',
        description: 'Leg day routine in the gym',
        is_completed: false,
        is_important: false,
        is_in_today: true,
        priority: 'medium',
        due_at: new Date().toISOString().split('T')[0],
        reminder_at: null,
        recurrence_rule: 'weekly',
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['personal', 'fitness']
      },
      {
        id: 'task-3',
        user_id: userId,
        workspace: 'personal',
        title: 'Meditate for 10 minutes',
        description: 'Mindfulness session',
        is_completed: false,
        is_important: false,
        is_in_today: true,
        priority: 'low',
        due_at: null,
        reminder_at: null,
        recurrence_rule: 'daily',
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['health']
      },
      {
        id: 'task-4',
        user_id: userId,
        workspace: 'personal',
        title: 'Pay electricity bill',
        description: 'Clear dues',
        is_completed: true,
        is_important: false,
        is_in_today: false,
        priority: 'none',
        due_at: null,
        reminder_at: null,
        recurrence_rule: null,
        completed_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-5',
        user_id: userId,
        workspace: 'work',
        title: 'Issue-31 — Bluetooth reconnect failure',
        description: 'Investigate connection loss after secondary module reboots',
        is_completed: false,
        is_important: true,
        is_in_today: true,
        priority: 'high',
        due_at: new Date().toISOString().split('T')[0],
        reminder_at: null,
        recurrence_rule: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['android', 'kotlin']
      },
      {
        id: 'task-6',
        user_id: userId,
        workspace: 'work',
        title: 'Review PR',
        description: 'Review database service rewrite',
        is_completed: true,
        is_important: false,
        is_in_today: false,
        priority: 'none',
        due_at: null,
        reminder_at: null,
        recurrence_rule: null,
        completed_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-7',
        user_id: userId,
        workspace: 'work',
        title: 'Prepare architecture notes',
        description: 'Outline database stage transitions',
        is_completed: false,
        is_important: false,
        is_in_today: false,
        priority: 'medium',
        due_at: null,
        reminder_at: null,
        recurrence_rule: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['development']
      },
      {
        id: 'task-8',
        user_id: userId,
        workspace: 'work',
        title: 'Team meeting',
        description: 'Daily standup',
        is_completed: true,
        is_important: false,
        is_in_today: false,
        priority: 'none',
        due_at: null,
        reminder_at: null,
        recurrence_rule: 'daily',
        completed_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    localStorage.setItem(KEYS.TASKS, JSON.stringify(defaultTasks));

    // Seed subtask steps for task-5
    const defaultSteps: TaskStep[] = [
      {
        id: 'step-1',
        task_id: 'task-5',
        user_id: userId,
        title: 'Reproduce issue in lab environment',
        is_completed: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'step-2',
        task_id: 'task-5',
        user_id: userId,
        title: 'Collect stacktraces and logs',
        is_completed: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'step-3',
        task_id: 'task-5',
        user_id: userId,
        title: 'Implement retry connection lifecycle',
        is_completed: false,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'step-4',
        task_id: 'task-5',
        user_id: userId,
        title: 'Test firmware reconnection code',
        is_completed: false,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(KEYS.TASK_STEPS, JSON.stringify(defaultSteps));

    // Seed workflow tracker for task-5
    const defaultFlows: TaskFlow[] = [
      {
        id: 'flow-1',
        task_id: 'task-5',
        user_id: userId,
        name: 'Issue-31 Development Flow',
        is_completed: false,
        current_stage_id: 'stage-4',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    localStorage.setItem(KEYS.TASK_FLOWS, JSON.stringify(defaultFlows));

    const defaultStages: TaskFlowStage[] = [
      { id: 'stage-1', flow_id: 'flow-1', name: 'Open', sort_order: 0, is_completed: true, completed_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'stage-2', flow_id: 'flow-1', name: 'Working', sort_order: 1, is_completed: true, completed_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'stage-3', flow_id: 'flow-1', name: 'Created PR', sort_order: 2, is_completed: true, completed_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'stage-4', flow_id: 'flow-1', name: 'Under Review', sort_order: 3, is_completed: false, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'stage-5', flow_id: 'flow-1', name: 'Approved', sort_order: 4, is_completed: false, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'stage-6', flow_id: 'flow-1', name: 'Queued', sort_order: 5, is_completed: false, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'stage-7', flow_id: 'flow-1', name: 'Merged', sort_order: 6, is_completed: false, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    localStorage.setItem(KEYS.TASK_FLOW_STAGES, JSON.stringify(defaultStages));

    const defaultHistory: TaskFlowHistory[] = [
      { id: 'hist-1', flow_id: 'flow-1', from_stage_id: 'stage-1', to_stage_id: 'stage-2', changed_at: new Date(Date.now() - 3600000 * 4).toISOString() },
      { id: 'hist-2', flow_id: 'flow-1', from_stage_id: 'stage-2', to_stage_id: 'stage-3', changed_at: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'hist-3', flow_id: 'flow-1', from_stage_id: 'stage-3', to_stage_id: 'stage-4', changed_at: new Date(Date.now() - 3600000 * 1).toISOString() }
    ];
    localStorage.setItem(KEYS.TASK_FLOW_HISTORY, JSON.stringify(defaultHistory));
  }

  // Seed fitness activity types
  if (!localStorage.getItem(KEYS.ACTIVITY_TYPES)) {
    const defaultTypes: ActivityType[] = [
      { id: 'act-type-1', name: 'Strength Training', slug: 'strength_training', icon: 'Dumbbell', category: 'strength', is_active: true, created_at: new Date().toISOString() },
      { id: 'act-type-2', name: 'Badminton', slug: 'badminton', icon: 'Activity', category: 'sports', is_active: true, created_at: new Date().toISOString() },
      { id: 'act-type-3', name: 'Swimming', slug: 'swimming', icon: 'Waves', category: 'cardio', is_active: true, created_at: new Date().toISOString() },
      { id: 'act-type-4', name: 'Running', slug: 'running', icon: 'Timer', category: 'cardio', is_active: true, created_at: new Date().toISOString() },
      { id: 'act-type-5', name: 'Walking', slug: 'walking', icon: 'Footprints', category: 'cardio', is_active: true, created_at: new Date().toISOString() },
      { id: 'act-type-6', name: 'Yoga', slug: 'yoga', icon: 'Sparkles', category: 'flexibility', is_active: true, created_at: new Date().toISOString() }
    ];
    localStorage.setItem(KEYS.ACTIVITY_TYPES, JSON.stringify(defaultTypes));
  }

  // Seed actual fitness activities
  if (!localStorage.getItem(KEYS.FITNESS_ACTIVITIES)) {
    const today = new Date();
    const getOffsetDate = (daysAgo: number, timeStr = '19:00:00') => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      const datePart = d.toISOString().split('T')[0];
      return new Date(`${datePart}T${timeStr}`).toISOString();
    };

    const defaultActivities: FitnessActivity[] = [
      {
        id: 'act-fit-1',
        user_id: userId,
        activity_type_id: 'act-type-1',
        started_at: getOffsetDate(0, '19:30:00'),
        ended_at: getOffsetDate(0, '20:30:00'),
        duration_minutes: 60,
        distance: null,
        calories: 356,
        avg_heart_rate: 124,
        max_heart_rate: 152,
        steps: null,
        intensity: 'medium',
        notes: 'Upper body focus. Dumbbell presses felt stable today.',
        photos: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'act-fit-2',
        user_id: userId,
        activity_type_id: 'act-type-2',
        started_at: getOffsetDate(1, '19:00:00'),
        ended_at: getOffsetDate(1, '20:30:00'),
        duration_minutes: 90,
        distance: null,
        calories: 420,
        avg_heart_rate: 132,
        max_heart_rate: 168,
        steps: 8432,
        intensity: 'high',
        notes: 'Great match play session! Felt responsive and had solid court endurance.',
        photos: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'act-fit-3',
        user_id: userId,
        activity_type_id: 'act-type-3',
        started_at: getOffsetDate(2, '18:30:00'),
        ended_at: getOffsetDate(2, '19:15:00'),
        duration_minutes: 45,
        distance: 1000,
        calories: 280,
        avg_heart_rate: 128,
        max_heart_rate: 145,
        steps: null,
        intensity: 'medium',
        notes: 'Freestyle intervals. Smooth pacing, focusing on stroke recovery.',
        photos: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'act-fit-4',
        user_id: userId,
        activity_type_id: 'act-type-4',
        started_at: getOffsetDate(3, '07:15:00'),
        ended_at: getOffsetDate(3, '07:50:00'),
        duration_minutes: 35,
        distance: 5.2,
        calories: 320,
        avg_heart_rate: 142,
        max_heart_rate: 160,
        steps: 4210,
        intensity: 'high',
        notes: 'Outdoor road run. Steady cardio pace.',
        photos: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'act-fit-5',
        user_id: userId,
        activity_type_id: 'act-type-6',
        started_at: getOffsetDate(4, '09:00:00'),
        ended_at: getOffsetDate(4, '09:40:00'),
        duration_minutes: 40,
        distance: null,
        calories: 150,
        avg_heart_rate: 98,
        max_heart_rate: 115,
        steps: null,
        intensity: 'low',
        notes: 'Flexibility and stretching. Great restorative session.',
        photos: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.FITNESS_ACTIVITIES, JSON.stringify(defaultActivities));
  }

  // Seed weekly routines
  if (!localStorage.getItem(KEYS.FITNESS_ROUTINES)) {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    const mondayStr = monday.toISOString().split('T')[0];

    const defaultRoutine: FitnessRoutine = {
      id: 'routine-1',
      user_id: userId,
      week_start: mondayStr,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(KEYS.FITNESS_ROUTINES, JSON.stringify([defaultRoutine]));

    const defaultItems: RoutineItem[] = [
      { id: 'item-1', routine_id: 'routine-1', day_of_week: 1, activity_type_id: 'act-type-1', title: 'Upper Body Focus', duration_minutes: 60, notes: 'Target pushes & pulls', sort_order: 0, is_completed: true, completed_activity_id: 'act-fit-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'item-2', routine_id: 'routine-1', day_of_week: 2, activity_type_id: 'act-type-2', title: 'Match Play', duration_minutes: 90, notes: 'Singles match session', sort_order: 0, is_completed: true, completed_activity_id: 'act-fit-2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'item-3', routine_id: 'routine-1', day_of_week: 3, activity_type_id: 'act-type-3', title: 'Freestyle Intervals', duration_minutes: 45, notes: '1000m target lap', sort_order: 0, is_completed: true, completed_activity_id: 'act-fit-3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'item-4', routine_id: 'routine-1', day_of_week: 4, activity_type_id: 'act-type-1', title: 'Lower Body Focus', duration_minutes: 60, notes: 'Squats and lunges', sort_order: 0, is_completed: false, completed_activity_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'item-5', routine_id: 'routine-1', day_of_week: 5, activity_type_id: 'act-type-2', title: '🏸 Casual Games', duration_minutes: 90, notes: 'Doubles match with friends', sort_order: 0, is_completed: false, completed_activity_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'item-6', routine_id: 'routine-1', day_of_week: 6, activity_type_id: 'act-type-6', title: 'Flexibility Routine', duration_minutes: 45, notes: 'Vinyasa flow stretching', sort_order: 0, is_completed: false, completed_activity_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    localStorage.setItem(KEYS.ROUTINE_ITEMS, JSON.stringify(defaultItems));
  }

  // Seed strength plan
  if (!localStorage.getItem(KEYS.STRENGTH_PLANS)) {
    const defaultPlan: StrengthPlan = {
      id: 'plan-str-1',
      user_id: userId,
      name: 'Upper Body Focus',
      description: 'Dumbbell and bodyweight push/pull routine targeting chest, shoulders, back, and arms',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(KEYS.STRENGTH_PLANS, JSON.stringify([defaultPlan]));

    const defaultExercises: StrengthPlanExercise[] = [
      { id: 'exe-1', plan_id: 'plan-str-1', exercise_name: 'Push Ups', muscle_group: 'Chest & Triceps', sort_order: 0, target_sets: 4, target_reps: 12, target_weight: null, rest_seconds: 60, notes: 'Slow and controlled', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'exe-2', plan_id: 'plan-str-1', exercise_name: 'Dumbbell Bench Press', muscle_group: 'Chest & Shoulders', sort_order: 1, target_sets: 4, target_reps: 10, target_weight: 20, rest_seconds: 90, notes: 'Increase weight next time', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'exe-3', plan_id: 'plan-str-1', exercise_name: 'Shoulder Press', muscle_group: 'Shoulders', sort_order: 2, target_sets: 4, target_reps: 12, target_weight: 12, rest_seconds: 75, notes: 'Good form, avoid arching back', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'exe-4', plan_id: 'plan-str-1', exercise_name: 'Dumbbell Rows', muscle_group: 'Back', sort_order: 3, target_sets: 4, target_reps: 10, target_weight: 18, rest_seconds: 95, notes: 'Keep back straight', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'exe-5', plan_id: 'plan-str-1', exercise_name: 'Bicep Curls', muscle_group: 'Arms', sort_order: 4, target_sets: 3, target_reps: 12, target_weight: 10, rest_seconds: 60, notes: 'Squeeze at top', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'exe-6', plan_id: 'plan-str-1', exercise_name: 'Tricep Dips', muscle_group: 'Arms', sort_order: 5, target_sets: 3, target_reps: 12, target_weight: null, rest_seconds: 60, notes: 'Full range of motion', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    localStorage.setItem(KEYS.STRENGTH_PLAN_EXERCISES, JSON.stringify(defaultExercises));
  }

  // Seed strength sessions and sets
  if (!localStorage.getItem(KEYS.STRENGTH_SESSIONS)) {
    const today = new Date();
    const session1: StrengthSession = {
      id: 'session-str-1',
      user_id: userId,
      plan_id: 'plan-str-1',
      started_at: new Date(today.setHours(19, 30, 0)).toISOString(),
      completed_at: new Date(today.setHours(20, 30, 0)).toISOString(),
      notes: 'Felt strong today. Dumbbell bench presses felt very solid.',
      created_at: new Date().toISOString()
    };
    localStorage.setItem(KEYS.STRENGTH_SESSIONS, JSON.stringify([session1]));

    const defaultSets: StrengthSessionSet[] = [
      { id: 'set-1', session_id: 'session-str-1', exercise_name: 'Dumbbell Bench Press', set_number: 1, reps: 10, weight: 20, rpe: 8, notes: 'Controlled release', completed_at: new Date().toISOString() },
      { id: 'set-2', session_id: 'session-str-1', exercise_name: 'Dumbbell Bench Press', set_number: 2, reps: 10, weight: 20, rpe: 8, notes: 'Good reps', completed_at: new Date().toISOString() },
      { id: 'set-3', session_id: 'session-str-1', exercise_name: 'Dumbbell Bench Press', set_number: 3, reps: 10, weight: 22, rpe: 9, notes: 'Tough set but completed', completed_at: new Date().toISOString() },
      { id: 'set-4', session_id: 'session-str-1', exercise_name: 'Dumbbell Bench Press', set_number: 4, reps: 8, weight: 22, rpe: 10, notes: 'Could only manage 8 reps on final set', completed_at: new Date().toISOString() },
      { id: 'set-5', session_id: 'session-str-1', exercise_name: 'Push Ups', set_number: 1, reps: 12, weight: 0, rpe: 7, notes: 'Warmup', completed_at: new Date().toISOString() },
      { id: 'set-6', session_id: 'session-str-1', exercise_name: 'Push Ups', set_number: 2, reps: 12, weight: 0, rpe: 7, notes: 'Steady', completed_at: new Date().toISOString() },
      { id: 'set-7', session_id: 'session-str-1', exercise_name: 'Push Ups', set_number: 3, reps: 12, weight: 0, rpe: 8, notes: 'Burn', completed_at: new Date().toISOString() }
    ];
    localStorage.setItem(KEYS.STRENGTH_SESSION_SETS, JSON.stringify(defaultSets));
  }

  // Seed body measurements
  if (!localStorage.getItem(KEYS.BODY_MEASUREMENTS)) {
    const today = new Date();
    const getOffsetDate = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      return d.toISOString();
    };

    const defaultMeasurements: BodyMeasurement[] = [
      { id: 'bm-w-1', user_id: userId, recorded_at: getOffsetDate(31), metric_type: 'weight', value: 73.1, unit: 'kg', source: 'cultfit_scale', notes: null, created_at: new Date().toISOString() },
      { id: 'bm-w-2', user_id: userId, recorded_at: getOffsetDate(24), metric_type: 'weight', value: 72.8, unit: 'kg', source: 'cultfit_scale', notes: null, created_at: new Date().toISOString() },
      { id: 'bm-w-3', user_id: userId, recorded_at: getOffsetDate(17), metric_type: 'weight', value: 72.9, unit: 'kg', source: 'cultfit_scale', notes: null, created_at: new Date().toISOString() },
      { id: 'bm-w-4', user_id: userId, recorded_at: getOffsetDate(10), metric_type: 'weight', value: 72.5, unit: 'kg', source: 'cultfit_scale', notes: null, created_at: new Date().toISOString() },
      { id: 'bm-w-5', user_id: userId, recorded_at: getOffsetDate(0), metric_type: 'weight', value: 72.5, unit: 'kg', source: 'cultfit_scale', notes: 'Stable weight trends', created_at: new Date().toISOString() },
      
      { id: 'bm-b-1', user_id: userId, recorded_at: getOffsetDate(0), metric_type: 'BMI', value: 23.4, unit: 'index', source: 'cultfit_scale', notes: 'Normal range', created_at: new Date().toISOString() },
      { id: 'bm-f-1', user_id: userId, recorded_at: getOffsetDate(0), metric_type: 'body_fat', value: 16.2, unit: '%', source: 'cultfit_scale', notes: 'Good range', created_at: new Date().toISOString() },
      { id: 'bm-m-1', user_id: userId, recorded_at: getOffsetDate(0), metric_type: 'muscle_mass', value: 56.3, unit: 'kg', source: 'cultfit_scale', notes: 'Targeting muscle gain', created_at: new Date().toISOString() },
      { id: 'bm-wa-1', user_id: userId, recorded_at: getOffsetDate(0), metric_type: 'water', value: 54.1, unit: '%', source: 'cultfit_scale', notes: null, created_at: new Date().toISOString() },
      { id: 'bm-bo-1', user_id: userId, recorded_at: getOffsetDate(0), metric_type: 'bone_mass', value: 2.8, unit: 'kg', source: 'cultfit_scale', notes: null, created_at: new Date().toISOString() },
      { id: 'bm-v-1', user_id: userId, recorded_at: getOffsetDate(0), metric_type: 'visceral_fat', value: 7, unit: 'index', source: 'cultfit_scale', notes: null, created_at: new Date().toISOString() },
      { id: 'bm-bmr-1', user_id: userId, recorded_at: getOffsetDate(0), metric_type: 'BMR', value: 1680, unit: 'kcal/day', source: 'cultfit_scale', notes: null, created_at: new Date().toISOString() }
    ];
    localStorage.setItem(KEYS.BODY_MEASUREMENTS, JSON.stringify(defaultMeasurements));
  }

  // Seed flashcards
  if (!localStorage.getItem(KEYS.FLASHCARDS)) {
    const defaultFlashcards: Flashcard[] = [
      {
        id: 'fc-1',
        topic_id: 'topic-1',
        user_id: userId,
        question: 'What is the main difference between val and var in Kotlin?',
        answer: 'val declares a read-only (immutable) variable that can only be assigned once. var declares a mutable variable that can be reassigned multiple times.',
        difficulty: 'easy',
        last_reviewed_at: null,
        next_review_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fc-2',
        topic_id: 'topic-1',
        user_id: userId,
        question: 'How do you declare a nullable variable type in Kotlin?',
        answer: 'Append a question mark (?) to the type name. e.g. val name: String? = null',
        difficulty: 'medium',
        last_reviewed_at: null,
        next_review_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(defaultFlashcards));
  }

  // Seed finance categories
  if (!localStorage.getItem(KEYS.FINANCE_CATEGORIES)) {
    const defaultFinanceCategories: FinanceCategory[] = [
      { id: 'fcat-food', user_id: userId, name: 'Food', type: 'expense', icon: 'Utensils', color: '#EF4444', sort_order: 0 },
      { id: 'fcat-transport', user_id: userId, name: 'Transport', type: 'expense', icon: 'Car', color: '#3B82F6', sort_order: 1 },
      { id: 'fcat-shopping', user_id: userId, name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', sort_order: 2 },
      { id: 'fcat-entertainment', user_id: userId, name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8B5CF6', sort_order: 3 },
      { id: 'fcat-health', user_id: userId, name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#10B981', sort_order: 4 },
      { id: 'fcat-bills', user_id: userId, name: 'Bills & Utilities', type: 'expense', icon: 'FileText', color: '#F59E0B', sort_order: 5 },
      { id: 'fcat-travel', user_id: userId, name: 'Travel', type: 'expense', icon: 'Plane', color: '#14B8A6', sort_order: 6 },
      { id: 'fcat-education', user_id: userId, name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#6366F1', sort_order: 7 },
      { id: 'fcat-salary', user_id: userId, name: 'Salary', type: 'income', icon: 'DollarSign', color: '#10B981', sort_order: 8 },
      { id: 'fcat-freelance', user_id: userId, name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#06B6D4', sort_order: 9 },
      { id: 'fcat-interest', user_id: userId, name: 'Interest', type: 'income', icon: 'TrendingUp', color: '#F59E0B', sort_order: 10 },
      { id: 'fcat-other', user_id: userId, name: 'Other', type: 'income', icon: 'Coins', color: '#6B7280', sort_order: 11 }
    ];
    localStorage.setItem(KEYS.FINANCE_CATEGORIES, JSON.stringify(defaultFinanceCategories));
  }

  // Seed finance accounts
  if (!localStorage.getItem(KEYS.FINANCE_ACCOUNTS)) {
    const defaultAccounts: FinanceAccount[] = [
      {
        id: 'facc-hdfc',
        user_id: userId,
        name: 'HDFC Salary Account',
        type: 'bank',
        institution: 'HDFC Bank',
        currency: 'INR',
        opening_balance: 76250,
        current_balance: 76250,
        credit_limit: null,
        billing_cycle_day: null,
        payment_due_day: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'facc-sbi',
        user_id: userId,
        name: 'SBI Savings Account',
        type: 'savings',
        institution: 'State Bank of India',
        currency: 'INR',
        opening_balance: 120000,
        current_balance: 120000,
        credit_limit: null,
        billing_cycle_day: null,
        payment_due_day: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'facc-cash',
        user_id: userId,
        name: 'Cash',
        type: 'cash',
        institution: null,
        currency: 'INR',
        opening_balance: 4200,
        current_balance: 4200,
        credit_limit: null,
        billing_cycle_day: null,
        payment_due_day: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'facc-icici',
        user_id: userId,
        name: 'ICICI Credit Card',
        type: 'credit_card',
        institution: 'ICICI Bank',
        currency: 'INR',
        opening_balance: -12450,
        current_balance: -12450,
        credit_limit: 100000,
        billing_cycle_day: 15,
        payment_due_day: 5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.FINANCE_ACCOUNTS, JSON.stringify(defaultAccounts));
  }

  // Seed transactions
  if (!localStorage.getItem(KEYS.FINANCE_TRANSACTIONS)) {
    const today = new Date();
    const getOffsetDate = (daysAgo: number, hour = 12, min = 0) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      d.setHours(hour, min, 0, 0);
      return d.toISOString();
    };

    const defaultTransactions: FinanceTransaction[] = [
      // Income
      {
        id: 'ftx-1',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'income',
        amount: 85000,
        currency: 'INR',
        merchant: 'Salary',
        category_id: 'fcat-salary',
        transaction_date: getOffsetDate(0, 9, 30),
        description: 'Monthly Salary',
        notes: null,
        is_recurring: true,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-2',
        user_id: userId,
        account_id: 'facc-sbi',
        type: 'income',
        amount: 12000,
        currency: 'INR',
        category_id: 'fcat-freelance',
        transaction_date: getOffsetDate(5, 11, 45),
        merchant: 'Freelance Work',
        notes: null,
        description: 'Website build milestone',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-3',
        user_id: userId,
        account_id: 'facc-sbi',
        type: 'income',
        amount: 1200,
        currency: 'INR',
        category_id: 'fcat-interest',
        transaction_date: getOffsetDate(10, 10, 0),
        merchant: 'SBI Interest',
        notes: null,
        description: 'Quarterly interest deposit',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-4',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'income',
        amount: 500,
        currency: 'INR',
        category_id: 'fcat-other',
        transaction_date: getOffsetDate(15, 18, 0),
        merchant: 'Friend refund',
        notes: 'Lunch split',
        description: 'Settlement for lunch',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Expenses (Food)
      {
        id: 'ftx-food-1',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 420,
        currency: 'INR',
        merchant: 'Swiggy',
        category_id: 'fcat-food',
        transaction_date: getOffsetDate(0, 13, 15),
        description: 'Office lunch order',
        notes: 'Lunch',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-food-2',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 842,
        currency: 'INR',
        merchant: 'Blinkit',
        category_id: 'fcat-food',
        transaction_date: getOffsetDate(5, 18, 20),
        description: 'Blinkit Groceries run',
        notes: 'Groceries',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-food-3',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 356,
        currency: 'INR',
        merchant: 'Zomato',
        category_id: 'fcat-food',
        transaction_date: getOffsetDate(6, 21, 10),
        description: 'Dinner order',
        notes: 'Dinner',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-food-4',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 6582,
        currency: 'INR',
        merchant: 'Supermarket',
        category_id: 'fcat-food',
        transaction_date: getOffsetDate(17, 15, 0),
        description: 'Monthly grocery list supplies',
        notes: 'Groceries',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Expenses (Transport)
      {
        id: 'ftx-trans-1',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 280,
        currency: 'INR',
        merchant: 'Uber',
        category_id: 'fcat-transport',
        transaction_date: getOffsetDate(1, 8, 45),
        description: 'Commute to client office',
        notes: 'Uber Transport',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-trans-2',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 2120,
        currency: 'INR',
        merchant: 'Shell',
        category_id: 'fcat-transport',
        transaction_date: getOffsetDate(14, 11, 0),
        description: 'Car fuel refill',
        notes: 'Fuel',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-trans-3',
        user_id: userId,
        account_id: 'facc-sbi',
        type: 'expense',
        amount: 3000,
        currency: 'INR',
        merchant: 'Scooter rental',
        category_id: 'fcat-transport',
        transaction_date: getOffsetDate(20, 10, 0),
        description: 'Scooter rentals',
        notes: 'Goa Transport',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Expenses (Shopping)
      {
        id: 'ftx-shop-1',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 1499,
        currency: 'INR',
        merchant: 'Amazon',
        category_id: 'fcat-shopping',
        transaction_date: getOffsetDate(0, 19, 32),
        description: 'Keyboard & stand buy',
        notes: 'Office accessories',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-shop-2',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 8001,
        currency: 'INR',
        merchant: 'Electronics Store',
        category_id: 'fcat-shopping',
        transaction_date: getOffsetDate(13, 14, 0),
        description: 'Noise cancelling headphones',
        notes: 'Shopping',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Expenses (Entertainment)
      {
        id: 'ftx-ent-1',
        user_id: userId,
        account_id: 'facc-icici',
        type: 'expense',
        amount: 649,
        currency: 'INR',
        merchant: 'Netflix',
        category_id: 'fcat-entertainment',
        transaction_date: getOffsetDate(1, 19, 12),
        description: 'Netflix subscription renewal',
        notes: 'Entertainment',
        is_recurring: true,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-ent-2',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 2551,
        currency: 'INR',
        merchant: 'BookMyShow',
        category_id: 'fcat-entertainment',
        transaction_date: getOffsetDate(7, 20, 0),
        description: 'Concert movie tickets',
        notes: 'Events',
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Expenses (Bills)
      {
        id: 'ftx-bill-1',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 2350,
        currency: 'INR',
        merchant: 'BESCOM',
        category_id: 'fcat-bills',
        transaction_date: getOffsetDate(10, 10, 30),
        description: 'Electricity bill payment',
        notes: 'Bills & Utilities',
        is_recurring: true,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-bill-2',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 999,
        currency: 'INR',
        merchant: 'Jio Fiber',
        category_id: 'fcat-bills',
        transaction_date: getOffsetDate(17, 11, 0),
        description: 'Broadband internet bill',
        notes: 'Internet',
        is_recurring: true,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-bill-3',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 451,
        currency: 'INR',
        merchant: 'Airtel Mobile',
        category_id: 'fcat-bills',
        transaction_date: getOffsetDate(20, 16, 0),
        description: 'Mobile postpaid recharge',
        notes: 'Phone bill',
        is_recurring: true,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-bill-4',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 4000,
        currency: 'INR',
        merchant: 'Water Board',
        category_id: 'fcat-bills',
        transaction_date: getOffsetDate(24, 12, 0),
        description: 'Water supplier payment',
        notes: 'Utilities',
        is_recurring: true,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Expenses (Other / Large ones)
      {
        id: 'ftx-other-1',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 20000,
        currency: 'INR',
        merchant: 'Landlord',
        category_id: 'fcat-other',
        transaction_date: getOffsetDate(24, 9, 0),
        description: 'Monthly flat rent transfer',
        notes: 'Rent',
        is_recurring: true,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-other-2',
        user_id: userId,
        account_id: 'facc-icici',
        type: 'expense',
        amount: 7900,
        currency: 'INR',
        merchant: 'Credit Card EMI',
        category_id: 'fcat-other',
        transaction_date: getOffsetDate(15, 10, 0),
        description: 'Laptop purchase EMI installment',
        notes: 'Bills',
        is_recurring: true,
        transfer_group_id: null,
        shared_space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.FINANCE_TRANSACTIONS, JSON.stringify(defaultTransactions));
  }

  // Seed budgets
  if (!localStorage.getItem(KEYS.FINANCE_BUDGETS)) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

    const defaultBudgets: FinanceBudget[] = [
      { id: 'fbd-food', user_id: userId, category_id: 'fcat-food', name: 'Food Budget', period_type: 'monthly', amount: 10000, carryover_enabled: false, start_date: startOfMonth, end_date: endOfMonth },
      { id: 'fbd-trans', user_id: userId, category_id: 'fcat-transport', name: 'Transport Budget', period_type: 'monthly', amount: 6000, carryover_enabled: false, start_date: startOfMonth, end_date: endOfMonth },
      { id: 'fbd-shop', user_id: userId, category_id: 'fcat-shopping', name: 'Shopping Budget', period_type: 'monthly', amount: 10000, carryover_enabled: false, start_date: startOfMonth, end_date: endOfMonth },
      { id: 'fbd-ent', user_id: userId, category_id: 'fcat-entertainment', name: 'Entertainment Budget', period_type: 'monthly', amount: 4000, carryover_enabled: false, start_date: startOfMonth, end_date: endOfMonth },
      { id: 'fbd-bills', user_id: userId, category_id: 'fcat-bills', name: 'Bills Budget', period_type: 'monthly', amount: 12000, carryover_enabled: false, start_date: startOfMonth, end_date: endOfMonth }
    ];
    localStorage.setItem(KEYS.FINANCE_BUDGETS, JSON.stringify(defaultBudgets));
  }

  // Seed goals
  if (!localStorage.getItem(KEYS.FINANCE_GOALS)) {
    const defaultGoals: FinanceGoal[] = [
      { id: 'fgl-mac', user_id: userId, name: 'MacBook', target_amount: 150000, current_amount: 75000, target_date: '2026-12-31T00:00:00Z', icon: 'Laptop', color: '#8B5CF6', notes: 'Saving for M4 MacBook Pro' },
      { id: 'fgl-emg', user_id: userId, name: 'Emergency Fund', target_amount: 150000, current_amount: 50000, target_date: '2027-03-31T00:00:00Z', icon: 'Shield', color: '#10B981', notes: '6 months emergency reserves' }
    ];
    localStorage.setItem(KEYS.FINANCE_GOALS, JSON.stringify(defaultGoals));
  }

  // Seed subscriptions
  if (!localStorage.getItem(KEYS.FINANCE_SUBSCRIPTIONS)) {
    const defaultSubscriptions: FinanceSubscription[] = [
      { id: 'fsub-netflix', user_id: userId, account_id: 'facc-icici', category_id: 'fcat-entertainment', name: 'Netflix', amount: 649, frequency: 'monthly', next_payment: '2026-09-02T00:00:00Z', status: 'active', start_date: '2025-01-01T00:00:00Z', end_date: null, cancelled_date: null, notes: 'Premium UHD plan' },
      { id: 'fsub-internet', user_id: userId, account_id: 'facc-hdfc', category_id: 'fcat-bills', name: 'Internet Bill', amount: 999, frequency: 'monthly', next_payment: '2026-09-08T00:00:00Z', status: 'active', start_date: '2025-01-01T00:00:00Z', end_date: null, cancelled_date: null, notes: 'Jio Fiber 150Mbps' },
      { id: 'fsub-cc', user_id: userId, account_id: 'facc-hdfc', category_id: 'fcat-bills', name: 'Credit Card Payment', amount: 12500, frequency: 'monthly', next_payment: '2026-09-10T00:00:00Z', status: 'active', start_date: '2025-01-01T00:00:00Z', end_date: null, cancelled_date: null, notes: 'ICICI Autopay' },
      { id: 'fsub-elec', user_id: userId, account_id: 'facc-hdfc', category_id: 'fcat-bills', name: 'Electricity Bill', amount: 2350, frequency: 'monthly', next_payment: '2026-09-15T00:00:00Z', status: 'active', start_date: '2025-01-01T00:00:00Z', end_date: null, cancelled_date: null, notes: 'BESCOM bill estimation' }
    ];
    localStorage.setItem(KEYS.FINANCE_SUBSCRIPTIONS, JSON.stringify(defaultSubscriptions));
  }

  // Seed shared spaces
  if (!localStorage.getItem(KEYS.FINANCE_SHARED_SPACES)) {
    const today = new Date();
    const getOffsetDate = (daysAgo: number, hour = 12, min = 0) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      d.setHours(hour, min, 0, 0);
      return d.toISOString();
    };

    const defaultSpaces: FinanceSharedSpace[] = [
      { id: 'fsp-goa', owner_id: userId, name: 'Vacation — Goa', description: 'Splits for Goa trip with group' }
    ];
    localStorage.setItem(KEYS.FINANCE_SHARED_SPACES, JSON.stringify(defaultSpaces));

    const defaultMembers: FinanceSharedMember[] = [
      { id: 'fsm-1', space_id: 'fsp-goa', user_id: userId, role: 'owner' },
      { id: 'fsm-2', space_id: 'fsp-goa', user_id: 'usr-rahul', role: 'member' },
      { id: 'fsm-3', space_id: 'fsp-goa', user_id: 'usr-aakash', role: 'member' }
    ];
    localStorage.setItem(KEYS.FINANCE_SHARED_MEMBERS, JSON.stringify(defaultMembers));
    
    const mockUsersProfile = [
      { id: userId, display_name: 'Anirudh', email: 'anirudh@lifeos.com' },
      { id: 'usr-rahul', display_name: 'Rahul', email: 'rahul@lifeos.com' },
      { id: 'usr-aakash', display_name: 'Aakash', email: 'aakash@lifeos.com' }
    ];
    localStorage.setItem('life_os_mock_profiles_cache', JSON.stringify(mockUsersProfile));

    const defaultSharedTransactions: FinanceTransaction[] = [
      {
        id: 'ftx-sh-1',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 6000,
        currency: 'INR',
        merchant: 'Hotel Booking',
        category_id: 'fcat-travel',
        transaction_date: getOffsetDate(4, 14, 0),
        description: 'Goa Villa reservation',
        notes: null,
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: 'fsp-goa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-sh-2',
        user_id: 'usr-rahul',
        account_id: 'facc-cash',
        type: 'expense',
        amount: 3000,
        currency: 'INR',
        merchant: 'Dinner at Beach Shack',
        category_id: 'fcat-food',
        transaction_date: getOffsetDate(3, 21, 30),
        description: 'Group dinner',
        notes: null,
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: 'fsp-goa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-sh-3',
        user_id: userId,
        account_id: 'facc-hdfc',
        type: 'expense',
        amount: 2250,
        currency: 'INR',
        merchant: 'Scooter Rental',
        category_id: 'fcat-transport',
        transaction_date: getOffsetDate(2, 11, 0),
        description: 'Scooter rentals',
        notes: null,
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: 'fsp-goa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-sh-4',
        user_id: 'usr-aakash',
        account_id: 'facc-cash',
        type: 'expense',
        amount: 2500,
        currency: 'INR',
        merchant: 'Beach Activities',
        category_id: 'fcat-entertainment',
        transaction_date: getOffsetDate(2, 16, 0),
        description: 'Water sports',
        notes: null,
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: 'fsp-goa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ftx-sh-5',
        user_id: 'usr-rahul',
        account_id: 'facc-cash',
        type: 'expense',
        amount: 1000,
        currency: 'INR',
        merchant: 'Snacks & Drinks',
        category_id: 'fcat-food',
        transaction_date: getOffsetDate(1, 17, 30),
        description: 'Snacks on road',
        notes: null,
        is_recurring: false,
        transfer_group_id: null,
        shared_space_id: 'fsp-goa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const mainTxStr = localStorage.getItem(KEYS.FINANCE_TRANSACTIONS);
    const mainTx = mainTxStr ? JSON.parse(mainTxStr) : [];
    localStorage.setItem(KEYS.FINANCE_TRANSACTIONS, JSON.stringify([...mainTx, ...defaultSharedTransactions]));

    const defaultSplits: FinanceExpenseSplit[] = [
      { id: 'fsp-s-1', transaction_id: 'ftx-sh-1', user_id: userId, owed_amount: 2000 },
      { id: 'fsp-s-2', transaction_id: 'ftx-sh-1', user_id: 'usr-rahul', owed_amount: 2000 },
      { id: 'fsp-s-3', transaction_id: 'ftx-sh-1', user_id: 'usr-aakash', owed_amount: 2000 },
      { id: 'fsp-s-4', transaction_id: 'ftx-sh-2', user_id: userId, owed_amount: 1000 },
      { id: 'fsp-s-5', transaction_id: 'ftx-sh-2', user_id: 'usr-rahul', owed_amount: 1000 },
      { id: 'fsp-s-6', transaction_id: 'ftx-sh-2', user_id: 'usr-aakash', owed_amount: 1000 },
      { id: 'fsp-s-7', transaction_id: 'ftx-sh-3', user_id: userId, owed_amount: 750 },
      { id: 'fsp-s-8', transaction_id: 'ftx-sh-3', user_id: 'usr-rahul', owed_amount: 750 },
      { id: 'fsp-s-9', transaction_id: 'ftx-sh-3', user_id: 'usr-aakash', owed_amount: 750 },
      { id: 'fsp-s-10', transaction_id: 'ftx-sh-4', user_id: userId, owed_amount: 833.33 },
      { id: 'fsp-s-11', transaction_id: 'ftx-sh-4', user_id: 'usr-rahul', owed_amount: 833.33 },
      { id: 'fsp-s-12', transaction_id: 'ftx-sh-4', user_id: 'usr-aakash', owed_amount: 833.33 },
      { id: 'fsp-s-13', transaction_id: 'ftx-sh-5', user_id: userId, owed_amount: 333.33 },
      { id: 'fsp-s-14', transaction_id: 'ftx-sh-5', user_id: 'usr-rahul', owed_amount: 333.33 },
      { id: 'fsp-s-15', transaction_id: 'ftx-sh-5', user_id: 'usr-aakash', owed_amount: 333.33 }
    ];
    localStorage.setItem(KEYS.FINANCE_EXPENSE_SPLITS, JSON.stringify(defaultSplits));
    localStorage.setItem(KEYS.FINANCE_SETTLEMENTS, JSON.stringify([]));
  }
}

// Service Layer Database Methods
export const dbService = {
  // Profiles
  async getProfile(userId: string): Promise<Profile> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.PROFILE);
      if (cached) return JSON.parse(cached);
      const newProfile: Profile = {
        id: userId,
        display_name: 'Anirudh',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(newProfile));
      return newProfile;
    }

    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, profile: Partial<Profile>): Promise<Profile> {
    if (isMockEnabled) {
      const current = await this.getProfile(userId);
      const updated = { ...current, ...profile, updated_at: new Date().toISOString() };
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(updated));
      return updated;
    }

    const { data, error } = await supabase!
      .from('profiles')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const list = localStorage.getItem(KEYS.CATEGORIES);
      return list ? JSON.parse(list) : [];
    }

    const { data, error } = await supabase!
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    if (isMockEnabled) {
      const list = await this.getCategories(category.user_id);
      const newCat: Category = {
        ...category,
        id: 'cat-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify([...list, newCat]));
      return newCat;
    }

    const { data, error } = await supabase!
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCategory(userId: string, categoryId: string, category: Partial<Category>): Promise<Category> {
    if (isMockEnabled) {
      const list = await this.getCategories(userId);
      const index = list.findIndex(c => c.id === categoryId);
      if (index === -1) throw new Error('Category not found');
      const updated = { ...list[index], ...category, updated_at: new Date().toISOString() };
      list[index] = updated;
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(list));
      return updated;
    }

    const { data, error } = await supabase!
      .from('categories')
      .update(category)
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    if (isMockEnabled) {
      const list = await this.getCategories(userId);
      const filtered = list.filter(c => c.id !== categoryId);
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(filtered));

      // Cascade delete topics
      const topics = localStorage.getItem(KEYS.TOPICS);
      if (topics) {
        const topicList: Topic[] = JSON.parse(topics);
        const filteredTopics = topicList.filter(t => t.category_id !== categoryId);
        localStorage.setItem(KEYS.TOPICS, JSON.stringify(filteredTopics));
      }
      return;
    }

    const { error } = await supabase!
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Topics
  async getTopics(userId: string): Promise<Topic[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const list = localStorage.getItem(KEYS.TOPICS);
      return list ? JSON.parse(list) : [];
    }

    const { data, error } = await supabase!
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createTopic(topic: Omit<Topic, 'id' | 'created_at' | 'updated_at'>): Promise<Topic> {
    if (isMockEnabled) {
      const list = await this.getTopics(topic.user_id);
      const newTopic: Topic = {
        ...topic,
        id: 'topic-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(KEYS.TOPICS, JSON.stringify([...list, newTopic]));
      
      // Log activity
      await this.logActivity(topic.user_id, newTopic.id, 'topic_created');

      return newTopic;
    }

    const { data, error } = await supabase!
      .from('topics')
      .insert(topic)
      .select()
      .single();

    if (error) throw error;

    await this.logActivity(topic.user_id, data.id, 'topic_created');
    return data;
  },

  async updateTopic(userId: string, topicId: string, topic: Partial<Topic>): Promise<Topic> {
    if (isMockEnabled) {
      const list = await this.getTopics(userId);
      const index = list.findIndex(t => t.id === topicId);
      if (index === -1) throw new Error('Topic not found');

      const wasCompleted = list[index].is_completed;
      const isCompletedNow = topic.is_completed !== undefined ? topic.is_completed : wasCompleted;
      const completed_at = isCompletedNow && !wasCompleted 
        ? new Date().toISOString() 
        : (!isCompletedNow ? null : list[index].completed_at);

      const updated = { 
        ...list[index], 
        ...topic, 
        completed_at,
        updated_at: new Date().toISOString() 
      };
      list[index] = updated;
      localStorage.setItem(KEYS.TOPICS, JSON.stringify(list));

      if (isCompletedNow && !wasCompleted) {
        await this.logActivity(userId, topicId, 'topic_completed');
      }
      return updated;
    }

    const wasCompletedQuery = await supabase!
      .from('topics')
      .select('is_completed')
      .eq('id', topicId)
      .single();

    const wasCompleted = wasCompletedQuery.data?.is_completed || false;
    const isCompletedNow = topic.is_completed !== undefined ? topic.is_completed : wasCompleted;
    
    const payload = {
      ...topic,
      completed_at: isCompletedNow && !wasCompleted 
        ? new Date().toISOString() 
        : (!isCompletedNow ? null : undefined)
    };

    const { data, error } = await supabase!
      .from('topics')
      .update(payload)
      .eq('id', topicId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (isCompletedNow && !wasCompleted) {
      await this.logActivity(userId, topicId, 'topic_completed');
    }
    return data;
  },

  async deleteTopic(userId: string, topicId: string): Promise<void> {
    if (isMockEnabled) {
      const list = await this.getTopics(userId);
      const filtered = list.filter(t => t.id !== topicId);
      localStorage.setItem(KEYS.TOPICS, JSON.stringify(filtered));

      // Cascade delete flashcards
      const fcs = localStorage.getItem(KEYS.FLASHCARDS);
      if (fcs) {
        const fcList: Flashcard[] = JSON.parse(fcs);
        const filteredFcs = fcList.filter(f => f.topic_id !== topicId);
        localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(filteredFcs));
      }
      return;
    }

    const { error } = await supabase!
      .from('topics')
      .delete()
      .eq('id', topicId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Flashcards
  async getFlashcards(userId: string, topicId?: string): Promise<Flashcard[]> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FLASHCARDS);
      const all: Flashcard[] = cached ? JSON.parse(cached) : [];
      const userCards = all.filter(f => f.user_id === userId);
      return topicId ? userCards.filter(f => f.topic_id === topicId) : userCards;
    }

    let query = supabase!
      .from('flashcards')
      .select('*')
      .eq('user_id', userId);

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createFlashcard(flashcard: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>): Promise<Flashcard> {
    if (isMockEnabled) {
      const all = await this.getFlashcards(flashcard.user_id);
      const newFc: Flashcard = {
        ...flashcard,
        id: 'fc-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify([...all, newFc]));
      await this.logActivity(flashcard.user_id, flashcard.topic_id, 'flashcard_created');
      return newFc;
    }

    const { data, error } = await supabase!
      .from('flashcards')
      .insert(flashcard)
      .select()
      .single();

    if (error) throw error;
    await this.logActivity(flashcard.user_id, flashcard.topic_id, 'flashcard_created');
    return data;
  },

  async updateFlashcard(userId: string, cardId: string, flashcard: Partial<Flashcard>): Promise<Flashcard> {
    if (isMockEnabled) {
      const all = await this.getFlashcards(userId);
      const index = all.findIndex(f => f.id === cardId);
      if (index === -1) throw new Error('Flashcard not found');
      const updated = { ...all[index], ...flashcard, updated_at: new Date().toISOString() };
      all[index] = updated;
      localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(all));
      return updated;
    }

    const { data, error } = await supabase!
      .from('flashcards')
      .update(flashcard)
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFlashcard(userId: string, cardId: string): Promise<void> {
    if (isMockEnabled) {
      const all = await this.getFlashcards(userId);
      const filtered = all.filter(f => f.id !== cardId);
      localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(filtered));
      return;
    }

    const { error } = await supabase!
      .from('flashcards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Activities and Streaks
  async getActivities(userId: string, limit = 15): Promise<LearningActivity[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.ACTIVITIES);
      const all: LearningActivity[] = cached ? JSON.parse(cached) : [];
      
      // Sort desc
      const sorted = all
        .filter(a => a.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      return sorted;
    }

    const { data, error } = await supabase!
      .from('learning_activity')
      .select(`
        id,
        user_id,
        topic_id,
        activity_type,
        created_at,
        topics (
          title,
          categories (
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      topic_id: row.topic_id,
      activity_type: row.activity_type,
      created_at: row.created_at,
      topic_title: row.topics?.title,
      category_name: row.topics?.categories?.name,
    }));
  },

  async logActivity(userId: string, topicId: string | null, type: string): Promise<void> {
    const activityRow: Omit<LearningActivity, 'id'> = {
      user_id: userId,
      topic_id: topicId,
      activity_type: type,
      created_at: new Date().toISOString(),
    };

    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.ACTIVITIES);
      const all: LearningActivity[] = cached ? JSON.parse(cached) : [];
      
      // Look up topic details for rich log
      let topic_title = undefined;
      let category_name = undefined;
      if (topicId) {
        const topicsCached = localStorage.getItem(KEYS.TOPICS);
        const catsCached = localStorage.getItem(KEYS.CATEGORIES);
        if (topicsCached) {
          const topic = JSON.parse(topicsCached).find((t: any) => t.id === topicId);
          if (topic) {
            topic_title = topic.title;
            if (catsCached) {
              const cat = JSON.parse(catsCached).find((c: any) => c.id === topic.category_id);
              if (cat) {
                category_name = cat.name;
              }
            }
          }
        }
      }

      const newAct: LearningActivity = {
        ...activityRow,
        id: 'act-' + Math.random().toString(36).substr(2, 9),
        topic_title,
        category_name,
      };

      localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify([...all, newAct]));
      return;
    }

    await supabase!.from('learning_activity').insert(activityRow);
  },

  async getStreaks(userId: string): Promise<{ current: number; best: number }> {
    // To calculate streaks, fetch all completed topic activities
    const activities = await this.getActivities(userId, 100);
    const completedDays = new Set<string>();

    activities.forEach(act => {
      if (act.activity_type === 'topic_completed' || act.activity_type === 'flashcard_reviewed') {
        const dayStr = act.created_at.split('T')[0]; // YYYY-MM-DD
        completedDays.add(dayStr);
      }
    });

    const sortedDays = Array.from(completedDays).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedDays.length === 0) {
      return { current: 24, best: 45 }; // Default mockup value
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (sortedDays.includes(todayStr) || sortedDays.includes(yesterdayStr)) {
      let checkDate = new Date(sortedDays.includes(todayStr) ? today : yesterday);
      currentStreak = 1;
      
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkStr = checkDate.toISOString().split('T')[0];
        if (sortedDays.includes(checkStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    let expectedDate: Date | null = null;

    const ascDays = Array.from(completedDays).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    ascDays.forEach(dayStr => {
      const date = new Date(dayStr);
      if (expectedDate === null) {
        tempStreak = 1;
      } else {
        const diffTime = date.getTime() - expectedDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          tempStreak++;
        } else {
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }
      expectedDate = date;
    });

    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }

    // If mock, ensure they get a nice default instead of 0 if they haven't done much
    if (isMockEnabled && completedDays.size <= 2) {
      return { current: 24, best: 45 };
    }

    return { current: currentStreak, best: bestStreak };
  },

  // ========================================================
  // TASKS MODULE SERVICE METHODS
  // ========================================================

  // Get tasks for a user in a specific workspace
  async getTasks(userId: string, workspace: 'personal' | 'work'): Promise<Task[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.TASKS) || '[]';
      const all: Task[] = JSON.parse(cached);
      const workspaceTasks = all.filter(t => t.user_id === userId && t.workspace === workspace);
      
      // Load details dynamically for mock tasks
      for (const t of workspaceTasks) {
        const steps = await this.getTaskSteps(userId, t.id);
        t.steps_count = steps.length;
        t.completed_steps_count = steps.filter(s => s.is_completed).length;

        const files = await this.getTaskFiles(userId, t.id);
        t.files_count = files.length;

        t.flow = await this.getTaskFlow(userId, t.id);
      }
      return workspaceTasks;
    }

    const { data, error } = await supabase!
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace', workspace)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const tasks: Task[] = data || [];

    // Hydrate counts and flows in parallel
    for (const t of tasks) {
      const [{ count: stepsCount }, { count: compStepsCount }, { count: filesCount }, flow] = await Promise.all([
        supabase!.from('task_steps').select('*', { count: 'exact', head: true }).eq('task_id', t.id),
        supabase!.from('task_steps').select('*', { count: 'exact', head: true }).eq('task_id', t.id).eq('is_completed', true),
        supabase!.from('task_files').select('*', { count: 'exact', head: true }).eq('task_id', t.id),
        this.getTaskFlow(userId, t.id)
      ]);

      t.steps_count = stepsCount || 0;
      t.completed_steps_count = compStepsCount || 0;
      t.files_count = filesCount || 0;
      t.flow = flow;
    }

    return tasks;
  },

  // Create a new task
  async createTask(task: Omit<Task, 'id' | 'is_completed' | 'is_important' | 'is_in_today' | 'completed_at' | 'created_at' | 'updated_at'>): Promise<Task> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASKS) || '[]';
      const all: Task[] = JSON.parse(cached);
      const newTask: Task = {
        ...task,
        id: 'task-' + Math.random().toString(36).substr(2, 9),
        is_completed: false,
        is_important: false,
        is_in_today: false,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        steps_count: 0,
        completed_steps_count: 0,
        files_count: 0,
        flow: null,
        tags: []
      };
      localStorage.setItem(KEYS.TASKS, JSON.stringify([newTask, ...all]));
      return newTask;
    }

    const { data, error } = await supabase!
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      steps_count: 0,
      completed_steps_count: 0,
      files_count: 0,
      flow: null,
      tags: []
    };
  },

  // Update an existing task
  async updateTask(userId: string, taskId: string, fields: Partial<Task>): Promise<Task> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASKS) || '[]';
      const all: Task[] = JSON.parse(cached);
      const index = all.findIndex(t => t.id === taskId && t.user_id === userId);
      if (index === -1) throw new Error('Task not found');

      // Set completed_at if completed state is toggling
      let completed_at = all[index].completed_at;
      if (fields.is_completed !== undefined) {
        completed_at = fields.is_completed ? new Date().toISOString() : null;
      }

      const updatedTask = {
        ...all[index],
        ...fields,
        completed_at,
        updated_at: new Date().toISOString()
      };
      all[index] = updatedTask;
      localStorage.setItem(KEYS.TASKS, JSON.stringify(all));
      return updatedTask;
    }

    let completed_at = undefined;
    if (fields.is_completed !== undefined) {
      completed_at = fields.is_completed ? new Date().toISOString() : null;
    }

    const payload = {
      ...fields,
      ...(completed_at !== undefined ? { completed_at } : {})
    };

    // Filter out dynamic fields from payload
    const { steps_count, completed_steps_count, files_count, flow, ...dbFields } = payload as any;

    const { data, error } = await supabase!
      .from('tasks')
      .update(dbFields)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a task
  async deleteTask(userId: string, taskId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASKS) || '[]';
      const all: Task[] = JSON.parse(cached);
      const filtered = all.filter(t => !(t.id === taskId && t.user_id === userId));
      localStorage.setItem(KEYS.TASKS, JSON.stringify(filtered));

      // Cascade deletes for steps, files, flows
      const steps = localStorage.getItem(KEYS.TASK_STEPS) || '[]';
      localStorage.setItem(KEYS.TASK_STEPS, JSON.stringify(JSON.parse(steps).filter((s: any) => s.task_id !== taskId)));

      const files = localStorage.getItem(KEYS.TASK_FILES) || '[]';
      localStorage.setItem(KEYS.TASK_FILES, JSON.stringify(JSON.parse(files).filter((f: any) => f.task_id !== taskId)));

      const flows = localStorage.getItem(KEYS.TASK_FLOWS) || '[]';
      localStorage.setItem(KEYS.TASK_FLOWS, JSON.stringify(JSON.parse(flows).filter((f: any) => f.task_id !== taskId)));
      return;
    }

    const { error } = await supabase!
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Task Steps CRUD
  async getTaskSteps(userId: string, taskId: string): Promise<TaskStep[]> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_STEPS) || '[]';
      const all: TaskStep[] = JSON.parse(cached);
      return all
        .filter(s => s.task_id === taskId && s.user_id === userId)
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    const { data, error } = await supabase!
      .from('task_steps')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createTaskStep(step: Omit<TaskStep, 'id' | 'is_completed' | 'created_at' | 'updated_at'>): Promise<TaskStep> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_STEPS) || '[]';
      const all: TaskStep[] = JSON.parse(cached);
      const newStep: TaskStep = {
        ...step,
        id: 'step-' + Math.random().toString(36).substr(2, 9),
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(KEYS.TASK_STEPS, JSON.stringify([...all, newStep]));
      return newStep;
    }

    const { data, error } = await supabase!
      .from('task_steps')
      .insert(step)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTaskStep(userId: string, stepId: string, fields: Partial<TaskStep>): Promise<TaskStep> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_STEPS) || '[]';
      const all: TaskStep[] = JSON.parse(cached);
      const index = all.findIndex(s => s.id === stepId && s.user_id === userId);
      if (index === -1) throw new Error('Step not found');
      const updated = {
        ...all[index],
        ...fields,
        updated_at: new Date().toISOString()
      };
      all[index] = updated;
      localStorage.setItem(KEYS.TASK_STEPS, JSON.stringify(all));
      return updated;
    }

    const { data, error } = await supabase!
      .from('task_steps')
      .update(fields)
      .eq('id', stepId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTaskStep(userId: string, stepId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_STEPS) || '[]';
      const all: TaskStep[] = JSON.parse(cached);
      const filtered = all.filter(s => !(s.id === stepId && s.user_id === userId));
      localStorage.setItem(KEYS.TASK_STEPS, JSON.stringify(filtered));
      return;
    }

    const { error } = await supabase!
      .from('task_steps')
      .delete()
      .eq('id', stepId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Task Files (Attachments)
  async getTaskFiles(userId: string, taskId: string): Promise<TaskFile[]> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_FILES) || '[]';
      const all: TaskFile[] = JSON.parse(cached);
      return all.filter(f => f.task_id === taskId && f.user_id === userId);
    }

    const { data, error } = await supabase!
      .from('task_files')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async createTaskFile(fileMeta: Omit<TaskFile, 'id' | 'created_at'>): Promise<TaskFile> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_FILES) || '[]';
      const all: TaskFile[] = JSON.parse(cached);
      const newFile: TaskFile = {
        ...fileMeta,
        id: 'file-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      localStorage.setItem(KEYS.TASK_FILES, JSON.stringify([...all, newFile]));
      return newFile;
    }

    const { data, error } = await supabase!
      .from('task_files')
      .insert(fileMeta)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTaskFile(userId: string, fileId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_FILES) || '[]';
      const all: TaskFile[] = JSON.parse(cached);
      const filtered = all.filter(f => !(f.id === fileId && f.user_id === userId));
      localStorage.setItem(KEYS.TASK_FILES, JSON.stringify(filtered));
      return;
    }

    // Load path to delete in storage first
    const { data: fileData, error: loadError } = await supabase!
      .from('task_files')
      .select('storage_path')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (loadError) throw loadError;

    // Delete in storage bucket
    if (fileData?.storage_path) {
      await supabase!.storage
        .from('task_attachments')
        .remove([fileData.storage_path]);
    }

    // Delete db reference
    const { error } = await supabase!
      .from('task_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async uploadFileToStorage(userId: string, file: File): Promise<{ storagePath: string }> {
    if (isMockEnabled) {
      // Mock upload delay
      await new Promise(resolve => setTimeout(resolve, 600));
      return { storagePath: `${userId}/${Date.now()}_${file.name}` };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
    const storagePath = `${userId}/${fileName}`;

    const { error } = await supabase!.storage
      .from('task_attachments')
      .upload(storagePath, file);

    if (error) throw error;
    return { storagePath };
  },

  getFileDownloadUrl(storagePath: string): string {
    if (isMockEnabled) {
      return '#mock-download';
    }
    const { data } = supabase!.storage
      .from('task_attachments')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  },

  // Task Flows (Workflow Tracker)
  async getTaskFlow(userId: string, taskId: string): Promise<TaskFlow | null> {
    if (isMockEnabled) {
      const flowsCached = localStorage.getItem(KEYS.TASK_FLOWS) || '[]';
      const flows: TaskFlow[] = JSON.parse(flowsCached);
      const matchedFlow = flows.find(f => f.task_id === taskId && f.user_id === userId);
      
      if (!matchedFlow) return null;

      // Hydrate stages
      const stagesCached = localStorage.getItem(KEYS.TASK_FLOW_STAGES) || '[]';
      const stages: TaskFlowStage[] = JSON.parse(stagesCached);
      matchedFlow.stages = stages
        .filter(s => s.flow_id === matchedFlow.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      return matchedFlow;
    }

    const { data: flowData, error: flowError } = await supabase!
      .from('task_flows')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .maybeSingle();

    if (flowError) throw flowError;
    if (!flowData) return null;

    // Load stages
    const { data: stagesData, error: stagesError } = await supabase!
      .from('task_flow_stages')
      .select('*')
      .eq('flow_id', flowData.id)
      .order('sort_order', { ascending: true });

    if (stagesError) throw stagesError;
    
    const flow: TaskFlow = {
      ...flowData,
      stages: stagesData || []
    };

    return flow;
  },

  async createTaskFlow(userId: string, taskId: string, name: string, stageNames: string[]): Promise<TaskFlow> {
    if (isMockEnabled) {
      const flowsCached = localStorage.getItem(KEYS.TASK_FLOWS) || '[]';
      const flows: TaskFlow[] = JSON.parse(flowsCached);
      const newFlow: TaskFlow = {
        id: 'flow-' + Math.random().toString(36).substr(2, 9),
        task_id: taskId,
        user_id: userId,
        name,
        is_completed: false,
        current_stage_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save stages
      const stagesCached = localStorage.getItem(KEYS.TASK_FLOW_STAGES) || '[]';
      const stagesList: TaskFlowStage[] = JSON.parse(stagesCached);
      const newStages: TaskFlowStage[] = stageNames.map((stName, idx) => ({
        id: `stage-${Math.random().toString(36).substr(2, 9)}`,
        flow_id: newFlow.id,
        name: stName,
        sort_order: idx,
        is_completed: idx === 0, // Mark first stage completed initially
        completed_at: idx === 0 ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      newFlow.current_stage_id = newStages[0].id;
      localStorage.setItem(KEYS.TASK_FLOWS, JSON.stringify([...flows, newFlow]));
      localStorage.setItem(KEYS.TASK_FLOW_STAGES, JSON.stringify([...stagesList, ...newStages]));
      
      newFlow.stages = newStages;
      return newFlow;
    }

    const { data: flowData, error: flowError } = await supabase!
      .from('task_flows')
      .insert({ task_id: taskId, user_id: userId, name })
      .select()
      .single();

    if (flowError) throw flowError;

    // Create Stages
    const stagesPayload = stageNames.map((stName, idx) => ({
      flow_id: flowData.id,
      name: stName,
      sort_order: idx,
      is_completed: idx === 0,
      completed_at: idx === 0 ? new Date().toISOString() : null
    }));

    const { data: stagesData, error: stagesError } = await supabase!
      .from('task_flow_stages')
      .insert(stagesPayload)
      .select();

    if (stagesError) throw stagesError;

    // Set first stage as current
    const sortedStages = (stagesData || []).sort((a, b) => a.sort_order - b.sort_order);
    const firstStageId = sortedStages[0]?.id;

    if (firstStageId) {
      await supabase!
        .from('task_flows')
        .update({ current_stage_id: firstStageId })
        .eq('id', flowData.id);
      flowData.current_stage_id = firstStageId;
    }

    return {
      ...flowData,
      stages: sortedStages
    };
  },

  async updateTaskFlow(userId: string, flowId: string, fields: Partial<TaskFlow>): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_FLOWS) || '[]';
      const all: TaskFlow[] = JSON.parse(cached);
      const index = all.findIndex(f => f.id === flowId && f.user_id === userId);
      if (index === -1) return;
      
      const { stages, ...fieldsToUpdate } = fields as any;
      all[index] = { ...all[index], ...fieldsToUpdate, updated_at: new Date().toISOString() };
      localStorage.setItem(KEYS.TASK_FLOWS, JSON.stringify(all));
      return;
    }

    const { stages, ...fieldsToUpdate } = fields as any;
    const { error } = await supabase!
      .from('task_flows')
      .update(fieldsToUpdate)
      .eq('id', flowId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteTaskFlow(userId: string, flowId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TASK_FLOWS) || '[]';
      const all: TaskFlow[] = JSON.parse(cached).filter((f: any) => f.id !== flowId);
      localStorage.setItem(KEYS.TASK_FLOWS, JSON.stringify(all));

      const stages = localStorage.getItem(KEYS.TASK_FLOW_STAGES) || '[]';
      localStorage.setItem(KEYS.TASK_FLOW_STAGES, JSON.stringify(JSON.parse(stages).filter((s: any) => s.flow_id !== flowId)));

      const hist = localStorage.getItem(KEYS.TASK_FLOW_HISTORY) || '[]';
      localStorage.setItem(KEYS.TASK_FLOW_HISTORY, JSON.stringify(JSON.parse(hist).filter((h: any) => h.flow_id !== flowId)));
      return;
    }

    const { error } = await supabase!
      .from('task_flows')
      .delete()
      .eq('id', flowId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // Transition flow stage and log history
  async transitionFlowStage(
    userId: string,
    flowId: string,
    fromStageId: string | null,
    toStageId: string,
    stagesUpdates: { id: string; is_completed: boolean; completed_at: string | null }[]
  ): Promise<void> {
    if (isMockEnabled) {
      // Update task flow current stage
      const flows = localStorage.getItem(KEYS.TASK_FLOWS) || '[]';
      const flowsList: TaskFlow[] = JSON.parse(flows);
      const flowIdx = flowsList.findIndex(f => f.id === flowId && f.user_id === userId);
      if (flowIdx !== -1) {
        flowsList[flowIdx].current_stage_id = toStageId;
        
        // If transitioning to the last stage, check if it completes flow
        const stagesCached = localStorage.getItem(KEYS.TASK_FLOW_STAGES) || '[]';
        const stagesList: TaskFlowStage[] = JSON.parse(stagesCached);
        const flowStages = stagesList.filter(s => s.flow_id === flowId).sort((a, b) => a.sort_order - b.sort_order);
        if (flowStages[flowStages.length - 1].id === toStageId) {
          flowsList[flowIdx].is_completed = true;
        } else {
          flowsList[flowIdx].is_completed = false;
        }

        localStorage.setItem(KEYS.TASK_FLOWS, JSON.stringify(flowsList));
      }

      // Update stages completion details
      const stages = localStorage.getItem(KEYS.TASK_FLOW_STAGES) || '[]';
      let stagesList: TaskFlowStage[] = JSON.parse(stages);
      
      stagesUpdates.forEach(upd => {
        const idx = stagesList.findIndex(s => s.id === upd.id);
        if (idx !== -1) {
          stagesList[idx].is_completed = upd.is_completed;
          stagesList[idx].completed_at = upd.completed_at;
          stagesList[idx].updated_at = new Date().toISOString();
        }
      });
      localStorage.setItem(KEYS.TASK_FLOW_STAGES, JSON.stringify(stagesList));

      // Append to transition history log
      const hist = localStorage.getItem(KEYS.TASK_FLOW_HISTORY) || '[]';
      const histList: TaskFlowHistory[] = JSON.parse(hist);
      const newHist: TaskFlowHistory = {
        id: 'hist-' + Math.random().toString(36).substr(2, 9),
        flow_id: flowId,
        from_stage_id: fromStageId,
        to_stage_id: toStageId,
        changed_at: new Date().toISOString()
      };
      localStorage.setItem(KEYS.TASK_FLOW_HISTORY, JSON.stringify([...histList, newHist]));
      return;
    }

    // 1. Log transition history
    const { error: histError } = await supabase!
      .from('task_flow_history')
      .insert({
        flow_id: flowId,
        from_stage_id: fromStageId,
        to_stage_id: toStageId
      });
    if (histError) throw histError;

    // 2. Batch update stage completion states
    for (const step of stagesUpdates) {
      await supabase!
        .from('task_flow_stages')
        .update({
          is_completed: step.is_completed,
          completed_at: step.completed_at
        })
        .eq('id', step.id);
    }

    // 3. Check if final stage is complete
    const { data: stagesData } = await supabase!
      .from('task_flow_stages')
      .select('*')
      .eq('flow_id', flowId)
      .order('sort_order', { ascending: true });

    const sorted = stagesData || [];
    const isLastStageActive = sorted[sorted.length - 1]?.id === toStageId;

    // 4. Update parent flow pointer
    await supabase!
      .from('task_flows')
      .update({
        current_stage_id: toStageId,
        is_completed: isLastStageActive
      })
      .eq('id', flowId);
  },

  async getFlowHistory(_userId: string, flowId: string): Promise<TaskFlowHistory[]> {
    if (isMockEnabled) {
      const hist = localStorage.getItem(KEYS.TASK_FLOW_HISTORY) || '[]';
      const histList: TaskFlowHistory[] = JSON.parse(hist).filter((h: any) => h.flow_id === flowId);
      
      const stagesCached = localStorage.getItem(KEYS.TASK_FLOW_STAGES) || '[]';
      const stages: TaskFlowStage[] = JSON.parse(stagesCached);
      const stageMap = new Map(stages.map(s => [s.id, s.name]));

      return histList
        .map(h => ({
          ...h,
          from_stage_name: h.from_stage_id ? stageMap.get(h.from_stage_id) : 'Creation',
          to_stage_name: h.to_stage_id ? stageMap.get(h.to_stage_id) : 'Completion'
        }))
        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
    }

    const { data, error } = await supabase!
      .from('task_flow_history')
      .select(`
        id,
        flow_id,
        from_stage_id,
        to_stage_id,
        changed_at,
        from_stage:task_flow_stages!task_flow_history_from_stage_id_fkey(name),
        to_stage:task_flow_stages!task_flow_history_to_stage_id_fkey(name)
      `)
      .eq('flow_id', flowId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      flow_id: row.flow_id,
      from_stage_id: row.from_stage_id,
      to_stage_id: row.to_stage_id,
      changed_at: row.changed_at,
      from_stage_name: row.from_stage?.name || 'Creation',
      to_stage_name: row.to_stage?.name
    }));
  },

  // ========================================================
  // FITNESS MODULE SERVICE METHODS
  // ========================================================

  async getActivityTypes(): Promise<ActivityType[]> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.ACTIVITY_TYPES) || '[]';
      return JSON.parse(cached);
    }
    const { data, error } = await supabase!
      .from('activity_types')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getFitnessActivities(userId: string): Promise<FitnessActivity[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.FITNESS_ACTIVITIES) || '[]';
      const all: FitnessActivity[] = JSON.parse(cached);
      const userActivities = all.filter(a => a.user_id === userId);
      
      const types = await this.getActivityTypes();
      const typeMap = new Map(types.map(t => [t.id, t]));
      
      const hydrated = userActivities.map(act => ({
        ...act,
        activity_type: typeMap.get(act.activity_type_id)
      }));

      return hydrated.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }

    const { data, error } = await supabase!
      .from('fitness_activities')
      .select('*, activity_types(*)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      activity_type: row.activity_types
    }));
  },

  async createFitnessActivity(activity: Omit<FitnessActivity, 'id' | 'created_at' | 'updated_at'>): Promise<FitnessActivity> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FITNESS_ACTIVITIES) || '[]';
      const all: FitnessActivity[] = JSON.parse(cached);
      const newAct: FitnessActivity = {
        ...activity,
        id: 'act-fit-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(KEYS.FITNESS_ACTIVITIES, JSON.stringify([newAct, ...all]));
      
      const types = await this.getActivityTypes();
      newAct.activity_type = types.find(t => t.id === activity.activity_type_id);
      return newAct;
    }

    const { data, error } = await supabase!
      .from('fitness_activities')
      .insert(activity)
      .select('*, activity_types(*)')
      .single();

    if (error) throw error;
    return {
      ...data,
      activity_type: data.activity_types
    };
  },

  async updateFitnessActivity(userId: string, activityId: string, fields: Partial<FitnessActivity>): Promise<FitnessActivity> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FITNESS_ACTIVITIES) || '[]';
      const all: FitnessActivity[] = JSON.parse(cached);
      const index = all.findIndex(a => a.id === activityId && a.user_id === userId);
      if (index === -1) throw new Error('Activity not found');

      const updated = {
        ...all[index],
        ...fields,
        updated_at: new Date().toISOString()
      };
      all[index] = updated;
      localStorage.setItem(KEYS.FITNESS_ACTIVITIES, JSON.stringify(all));
      
      const types = await this.getActivityTypes();
      updated.activity_type = types.find(t => t.id === updated.activity_type_id);
      return updated;
    }

    const { activity_type, ...dbFields } = fields as any;
    const { data, error } = await supabase!
      .from('fitness_activities')
      .update(dbFields)
      .eq('id', activityId)
      .eq('user_id', userId)
      .select('*, activity_types(*)')
      .single();

    if (error) throw error;
    return {
      ...data,
      activity_type: data.activity_types
    };
  },

  async deleteFitnessActivity(userId: string, activityId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FITNESS_ACTIVITIES) || '[]';
      const all: FitnessActivity[] = JSON.parse(cached);
      const filtered = all.filter(a => !(a.id === activityId && a.user_id === userId));
      localStorage.setItem(KEYS.FITNESS_ACTIVITIES, JSON.stringify(filtered));
      return;
    }

    const { error } = await supabase!
      .from('fitness_activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getFitnessStreak(userId: string): Promise<{ current: number; best: number }> {
    const activities = await this.getFitnessActivities(userId);
    if (activities.length === 0) {
      return { current: 12, best: 28 };
    }

    const activeDates = new Set<string>();
    activities.forEach(act => {
      activeDates.add(act.started_at.split('T')[0]);
    });

    const sortedDates = Array.from(activeDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    let startCheckStr = checkDate.toISOString().split('T')[0];
    if (!activeDates.has(startCheckStr)) {
      const yesterday = new Date(checkDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (activeDates.has(yesterdayStr)) {
        startCheckStr = yesterdayStr;
      }
    }

    let checkPtr = new Date(startCheckStr);
    let streakActive = true;

    while (streakActive) {
      const dateStr = checkPtr.toISOString().split('T')[0];
      const isWeekend = checkPtr.getDay() === 0 || checkPtr.getDay() === 6;

      if (activeDates.has(dateStr)) {
        currentStreak++;
      } else {
        if (!isWeekend) {
          streakActive = false;
          break;
        }
      }
      checkPtr.setDate(checkPtr.getDate() - 1);

      if (new Date(dateStr) < new Date(sortedDates[sortedDates.length - 1])) {
        break;
      }
    }

    let bestStreak = currentStreak;
    if (isMockEnabled) {
      bestStreak = Math.max(currentStreak, 28);
    } else {
      let tempStreak = 0;
      let maxStreak = 0;
      const scanDate = new Date(sortedDates[sortedDates.length - 1]);
      const endDate = new Date();
      
      while (scanDate <= endDate) {
        const dateStr = scanDate.toISOString().split('T')[0];
        const isWeekend = scanDate.getDay() === 0 || scanDate.getDay() === 6;

        if (activeDates.has(dateStr)) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
          if (!isWeekend) {
            tempStreak = 0;
          }
        }
        scanDate.setDate(scanDate.getDate() + 1);
      }
      bestStreak = Math.max(maxStreak, currentStreak);
    }

    return { current: currentStreak, best: bestStreak };
  },

  async getOrCreateWeeklyRoutine(userId: string, weekStart: string): Promise<FitnessRoutine> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.FITNESS_ROUTINES) || '[]';
      const routines: FitnessRoutine[] = JSON.parse(cached);
      let routine = routines.find(r => r.week_start === weekStart && r.user_id === userId);

      if (!routine) {
        const newRoutine: FitnessRoutine = {
          id: 'routine-' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
          week_start: weekStart,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        routines.push(newRoutine);
        localStorage.setItem(KEYS.FITNESS_ROUTINES, JSON.stringify(routines));

        const types = await this.getActivityTypes();
        const strType = types.find(t => t.slug === 'strength_training');
        const badType = types.find(t => t.slug === 'badminton');
        const swType = types.find(t => t.slug === 'swimming');
        const yogaType = types.find(t => t.slug === 'yoga');

        const defaultItems: Omit<RoutineItem, 'id' | 'created_at' | 'updated_at'>[] = [
          { routine_id: newRoutine.id, day_of_week: 1, activity_type_id: strType?.id || '', title: 'Upper Body Focus', duration_minutes: 60, notes: 'Target pushes & pulls', sort_order: 0, is_completed: false, completed_activity_id: null },
          { routine_id: newRoutine.id, day_of_week: 2, activity_type_id: badType?.id || '', title: 'Match Play', duration_minutes: 90, notes: 'Singles game', sort_order: 0, is_completed: false, completed_activity_id: null },
          { routine_id: newRoutine.id, day_of_week: 3, activity_type_id: swType?.id || '', title: 'Freestyle Swimming', duration_minutes: 45, notes: 'Target laps', sort_order: 0, is_completed: false, completed_activity_id: null },
          { routine_id: newRoutine.id, day_of_week: 4, activity_type_id: strType?.id || '', title: 'Lower Body Focus', duration_minutes: 60, notes: 'Squats and legs', sort_order: 0, is_completed: false, completed_activity_id: null },
          { routine_id: newRoutine.id, day_of_week: 6, activity_type_id: yogaType?.id || '', title: 'Flexibility Vinyasa', duration_minutes: 45, notes: 'Restorative yoga stretch', sort_order: 0, is_completed: false, completed_activity_id: null }
        ];

        const itemsCached = localStorage.getItem(KEYS.ROUTINE_ITEMS) || '[]';
        const itemsList: RoutineItem[] = JSON.parse(itemsCached);
        const newItems: RoutineItem[] = defaultItems.map(item => ({
          ...item,
          id: 'item-' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        localStorage.setItem(KEYS.ROUTINE_ITEMS, JSON.stringify([...itemsList, ...newItems]));
        newRoutine.items = newItems;
        routine = newRoutine;
      } else {
        const itemsCached = localStorage.getItem(KEYS.ROUTINE_ITEMS) || '[]';
        const items: RoutineItem[] = JSON.parse(itemsCached);
        routine.items = items.filter(i => i.routine_id === routine!.id);
      }

      const activeRoutine = routine!;
      const types = await this.getActivityTypes();
      const typeMap = new Map(types.map(t => [t.id, t]));
      activeRoutine.items = (activeRoutine.items || []).map(i => ({
        ...i,
        activity_type: typeMap.get(i.activity_type_id)
      }));

      return activeRoutine;
    }

    let { data: routine, error } = await supabase!
      .from('fitness_routines')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (error) throw error;

    if (!routine) {
      const { data: newR, error: errC } = await supabase!
        .from('fitness_routines')
        .insert({ user_id: userId, week_start: weekStart })
        .select()
        .single();

      if (errC) throw errC;
      routine = newR;

      const types = await this.getActivityTypes();
      const strType = types.find(t => t.slug === 'strength_training');
      const badType = types.find(t => t.slug === 'badminton');
      const swType = types.find(t => t.slug === 'swimming');
      const yogaType = types.find(t => t.slug === 'yoga');

      const defaultItems = [
        { routine_id: routine.id, day_of_week: 1, activity_type_id: strType?.id, title: 'Upper Body Focus', duration_minutes: 60, notes: 'Target pushes & pulls' },
        { routine_id: routine.id, day_of_week: 2, activity_type_id: badType?.id, title: 'Match Play', duration_minutes: 90, notes: 'Singles game' },
        { routine_id: routine.id, day_of_week: 3, activity_type_id: swType?.id, title: 'Freestyle Swimming', duration_minutes: 45, notes: 'Target laps' },
        { routine_id: routine.id, day_of_week: 4, activity_type_id: strType?.id, title: 'Lower Body Focus', duration_minutes: 60, notes: 'Squats and legs' },
        { routine_id: routine.id, day_of_week: 6, activity_type_id: yogaType?.id, title: 'Flexibility Vinyasa', duration_minutes: 45, notes: 'Restorative yoga stretch' }
      ].filter(item => item.activity_type_id !== undefined);

      await supabase!.from('routine_items').insert(defaultItems);
    }

    const { data: items, error: errI } = await supabase!
      .from('routine_items')
      .select('*, activity_types(*)')
      .eq('routine_id', routine.id)
      .order('sort_order', { ascending: true });

    if (errI) throw errI;

    return {
      ...routine,
      items: (items || []).map((row: any) => ({
        ...row,
        activity_type: row.activity_types
      }))
    };
  },

  async createRoutineItem(item: Omit<RoutineItem, 'id' | 'is_completed' | 'completed_activity_id' | 'created_at' | 'updated_at'>): Promise<RoutineItem> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.ROUTINE_ITEMS) || '[]';
      const all: RoutineItem[] = JSON.parse(cached);
      const newItem: RoutineItem = {
        ...item,
        id: 'item-' + Math.random().toString(36).substr(2, 9),
        is_completed: false,
        completed_activity_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(KEYS.ROUTINE_ITEMS, JSON.stringify([...all, newItem]));
      
      const types = await this.getActivityTypes();
      newItem.activity_type = types.find(t => t.id === newItem.activity_type_id);
      return newItem;
    }

    const { data, error } = await supabase!
      .from('routine_items')
      .insert(item)
      .select('*, activity_types(*)')
      .single();

    if (error) throw error;
    return {
      ...data,
      activity_type: data.activity_types
    };
  },

  async updateRoutineItem(_userId: string, itemId: string, fields: Partial<RoutineItem>): Promise<RoutineItem> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.ROUTINE_ITEMS) || '[]';
      const all: RoutineItem[] = JSON.parse(cached);
      const index = all.findIndex(i => i.id === itemId);
      if (index === -1) throw new Error('Routine item not found');

      const updated = {
        ...all[index],
        ...fields,
        updated_at: new Date().toISOString()
      };
      all[index] = updated;
      localStorage.setItem(KEYS.ROUTINE_ITEMS, JSON.stringify(all));

      const types = await this.getActivityTypes();
      updated.activity_type = types.find(t => t.id === updated.activity_type_id);
      return updated;
    }

    const { activity_type, ...dbFields } = fields as any;
    const { data, error } = await supabase!
      .from('routine_items')
      .update(dbFields)
      .eq('id', itemId)
      .select('*, activity_types(*)')
      .single();

    if (error) throw error;
    return {
      ...data,
      activity_type: data.activity_types
    };
  },

  async deleteRoutineItem(_userId: string, itemId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.ROUTINE_ITEMS) || '[]';
      const all: RoutineItem[] = JSON.parse(cached);
      const filtered = all.filter(i => i.id !== itemId);
      localStorage.setItem(KEYS.ROUTINE_ITEMS, JSON.stringify(filtered));
      return;
    }

    const { data: item } = await supabase!
      .from('routine_items')
      .select('routine_id')
      .eq('id', itemId)
      .single();

    if (item?.routine_id) {
      const { error } = await supabase!
        .from('routine_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    }
  },

  // Strength Workout Plans
  async getStrengthPlans(userId: string): Promise<StrengthPlan[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.STRENGTH_PLANS) || '[]';
      const plans: StrengthPlan[] = JSON.parse(cached).filter((p: any) => p.user_id === userId);
      
      const exercisesCached = localStorage.getItem(KEYS.STRENGTH_PLAN_EXERCISES) || '[]';
      const exercises: StrengthPlanExercise[] = JSON.parse(exercisesCached);

      return plans.map(p => ({
        ...p,
        exercises: exercises.filter(e => e.plan_id === p.id).sort((a, b) => a.sort_order - b.sort_order)
      }));
    }

    const { data, error } = await supabase!
      .from('strength_plans')
      .select('*, strength_plan_exercises(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      exercises: (row.strength_plan_exercises || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
    }));
  },

  async createStrengthPlan(userId: string, planName: string, description: string, exercises: Omit<StrengthPlanExercise, 'id' | 'plan_id' | 'created_at' | 'updated_at'>[]): Promise<StrengthPlan> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.STRENGTH_PLANS) || '[]';
      const plansList: StrengthPlan[] = JSON.parse(cached);
      const newPlan: StrengthPlan = {
        id: 'plan-str-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        name: planName,
        description,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const exercisesCached = localStorage.getItem(KEYS.STRENGTH_PLAN_EXERCISES) || '[]';
      const exercisesList: StrengthPlanExercise[] = JSON.parse(exercisesCached);
      const newExercises: StrengthPlanExercise[] = exercises.map((exe, idx) => ({
        ...exe,
        id: 'exe-' + Math.random().toString(36).substr(2, 9),
        plan_id: newPlan.id,
        sort_order: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      localStorage.setItem(KEYS.STRENGTH_PLANS, JSON.stringify([...plansList, newPlan]));
      localStorage.setItem(KEYS.STRENGTH_PLAN_EXERCISES, JSON.stringify([...exercisesList, ...newExercises]));
      
      newPlan.exercises = newExercises;
      return newPlan;
    }

    const { data: plan, error: errP } = await supabase!
      .from('strength_plans')
      .insert({ user_id: userId, name: planName, description })
      .select()
      .single();

    if (errP) throw errP;

    const payload = exercises.map((exe, idx) => ({
      ...exe,
      plan_id: plan.id,
      sort_order: idx
    }));

    const { data: exes, error: errE } = await supabase!
      .from('strength_plan_exercises')
      .insert(payload)
      .select();

    if (errE) throw errE;
    plan.exercises = exes;
    return plan;
  },

  async updateStrengthPlan(userId: string, planId: string, planName: string, description: string, exercises: Omit<StrengthPlanExercise, 'id' | 'plan_id' | 'created_at' | 'updated_at'>[]): Promise<StrengthPlan> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.STRENGTH_PLANS) || '[]';
      const plansList: StrengthPlan[] = JSON.parse(cached);
      const planIdx = plansList.findIndex(p => p.id === planId && p.user_id === userId);
      if (planIdx === -1) throw new Error('Plan not found');

      plansList[planIdx] = {
        ...plansList[planIdx],
        name: planName,
        description,
        updated_at: new Date().toISOString()
      };

      // Filter out existing exercises for this plan
      const exercisesCached = localStorage.getItem(KEYS.STRENGTH_PLAN_EXERCISES) || '[]';
      const otherExercises = JSON.parse(exercisesCached).filter((e: any) => e.plan_id !== planId);

      const newExercises: StrengthPlanExercise[] = exercises.map((exe, idx) => ({
        ...exe,
        id: 'exe-' + Math.random().toString(36).substr(2, 9),
        plan_id: planId,
        sort_order: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      localStorage.setItem(KEYS.STRENGTH_PLANS, JSON.stringify(plansList));
      localStorage.setItem(KEYS.STRENGTH_PLAN_EXERCISES, JSON.stringify([...otherExercises, ...newExercises]));
      
      const updatedPlan = plansList[planIdx];
      updatedPlan.exercises = newExercises;
      return updatedPlan;
    }

    // Supabase update plan header
    const { data: plan, error: errP } = await supabase!
      .from('strength_plans')
      .update({ name: planName, description, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single();

    if (errP) throw errP;

    // Delete existing exercises
    const { error: errD } = await supabase!
      .from('strength_plan_exercises')
      .delete()
      .eq('plan_id', planId);

    if (errD) throw errD;

    // Insert new exercises
    const payload = exercises.map((exe, idx) => ({
      ...exe,
      plan_id: planId,
      sort_order: idx
    }));

    const { data: exes, error: errE } = await supabase!
      .from('strength_plan_exercises')
      .insert(payload)
      .select();

    if (errE) throw errE;
    plan.exercises = exes;
    return plan;
  },

  async deleteStrengthPlan(userId: string, planId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.STRENGTH_PLANS) || '[]';
      const filtered = JSON.parse(cached).filter((p: any) => !(p.id === planId && p.user_id === userId));
      localStorage.setItem(KEYS.STRENGTH_PLANS, JSON.stringify(filtered));

      const exes = localStorage.getItem(KEYS.STRENGTH_PLAN_EXERCISES) || '[]';
      localStorage.setItem(KEYS.STRENGTH_PLAN_EXERCISES, JSON.stringify(JSON.parse(exes).filter((e: any) => e.plan_id !== planId)));
      return;
    }

    const { error } = await supabase!
      .from('strength_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // Strength Sessions Logging
  async getStrengthSessions(userId: string): Promise<StrengthSession[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.STRENGTH_SESSIONS) || '[]';
      const all: StrengthSession[] = JSON.parse(cached).filter((s: any) => s.user_id === userId);
      
      const setsCached = localStorage.getItem(KEYS.STRENGTH_SESSION_SETS) || '[]';
      const sets: StrengthSessionSet[] = JSON.parse(setsCached);

      const plans = await this.getStrengthPlans(userId);
      const planMap = new Map(plans.map(p => [p.id, p.name]));

      const hydrated = all.map(session => ({
        ...session,
        plan_name: planMap.get(session.plan_id) || 'Workout Plan',
        sets: sets.filter(s => s.session_id === session.id)
      }));

      return hydrated.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }

    const { data, error } = await supabase!
      .from('strength_sessions')
      .select('*, strength_session_sets(*), strength_plans(name)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      plan_name: row.strength_plans?.name || 'Workout Plan',
      sets: row.strength_session_sets
    }));
  },

  async createStrengthSession(
    userId: string, 
    planId: string, 
    startedAt: string, 
    completedAt: string, 
    notes: string, 
    sets: Omit<StrengthSessionSet, 'id' | 'session_id' | 'completed_at'>[]
  ): Promise<StrengthSession> {
    const plans = await this.getStrengthPlans(userId);
    const plan = plans.find(p => p.id === planId);
    const planName = plan?.name || 'Strength Workout';

    const types = await this.getActivityTypes();
    const typeId = types.find(t => t.slug === 'strength_training')?.id || '';

    const activity = await this.createFitnessActivity({
      user_id: userId,
      activity_type_id: typeId,
      started_at: startedAt,
      ended_at: completedAt,
      duration_minutes: Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000),
      distance: null,
      calories: 300,
      avg_heart_rate: 110,
      max_heart_rate: 145,
      steps: null,
      intensity: 'medium',
      notes: `Strength Session: ${planName}. ${notes}`,
      photos: []
    });

    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.STRENGTH_SESSIONS) || '[]';
      const all: StrengthSession[] = JSON.parse(cached);
      const newSession: StrengthSession = {
        id: 'session-str-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        plan_id: planId,
        started_at: startedAt,
        completed_at: completedAt,
        notes: notes || null,
        created_at: new Date().toISOString()
      };
      
      const setsCached = localStorage.getItem(KEYS.STRENGTH_SESSION_SETS) || '[]';
      const setsList: StrengthSessionSet[] = JSON.parse(setsCached);
      const newSets: StrengthSessionSet[] = sets.map(set => ({
        ...set,
        id: 'set-' + Math.random().toString(36).substr(2, 9),
        session_id: newSession.id,
        completed_at: new Date().toISOString()
      }));

      localStorage.setItem(KEYS.STRENGTH_SESSIONS, JSON.stringify([...all, newSession]));
      localStorage.setItem(KEYS.STRENGTH_SESSION_SETS, JSON.stringify([...setsList, ...newSets]));
      
      newSession.sets = newSets;
      newSession.plan_name = planName;
      return newSession;
    }

    const { data: session, error: errS } = await supabase!
      .from('strength_sessions')
      .insert({ user_id: userId, plan_id: planId, started_at: startedAt, completed_at: completedAt, notes })
      .select()
      .single();

    if (errS) throw errS;

    const payloadSets = sets.map(set => ({
      session_id: session.id,
      ...set
    }));

    const { data: sessionSets, error: errSets } = await supabase!
      .from('strength_session_sets')
      .insert(payloadSets)
      .select();

    if (errSets) throw errSets;
    session.sets = sessionSets;
    session.plan_name = planName;

    try {
      const currentMonday = new Date();
      currentMonday.setDate(currentMonday.getDate() + (currentMonday.getDay() === 0 ? -6 : 1 - currentMonday.getDay()));
      const mondayStr = currentMonday.toISOString().split('T')[0];
      const routine = await this.getOrCreateWeeklyRoutine(userId, mondayStr);
      const todayDayOfWeek = new Date().getDay();
      const matchItem = routine.items?.find(i => i.day_of_week === todayDayOfWeek && i.activity_type?.slug === 'strength_training' && !i.is_completed);
      if (matchItem) {
        await this.updateRoutineItem(userId, matchItem.id, { is_completed: true, completed_activity_id: activity.id });
      }
    } catch (e) {
      console.warn('Failed to auto check weekly routine item', e);
    }

    return session;
  },

  async getStrengthExerciseHistory(userId: string, exerciseName: string): Promise<StrengthSessionSet[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const setsCached = localStorage.getItem(KEYS.STRENGTH_SESSION_SETS) || '[]';
      const sets: StrengthSessionSet[] = JSON.parse(setsCached);

      const sessionsCached = localStorage.getItem(KEYS.STRENGTH_SESSIONS) || '[]';
      const sessions: StrengthSession[] = JSON.parse(sessionsCached).filter((s: any) => s.user_id === userId);
      const sessionIds = new Set(sessions.map(s => s.id));

      return sets
        .filter(s => s.exercise_name.toLowerCase() === exerciseName.toLowerCase() && sessionIds.has(s.session_id))
        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
    }

    const sessionsQuery = await supabase!
      .from('strength_sessions')
      .select('id')
      .eq('user_id', userId);

    const sessionIds = (sessionsQuery.data || []).map(s => s.id);

    if (sessionIds.length === 0) return [];

    const { data, error } = await supabase!
      .from('strength_session_sets')
      .select('*')
      .in('session_id', sessionIds)
      .eq('exercise_name', exerciseName)
      .order('completed_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Body Measurements CRUD
  async getBodyMeasurements(userId: string, metricType?: string): Promise<BodyMeasurement[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.BODY_MEASUREMENTS) || '[]';
      const all: BodyMeasurement[] = JSON.parse(cached).filter((m: any) => m.user_id === userId);
      const filtered = metricType ? all.filter(m => m.metric_type === metricType) : all;
      return filtered.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    }

    let query = supabase!
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId);

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query.order('recorded_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createBodyMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'created_at'>): Promise<BodyMeasurement> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.BODY_MEASUREMENTS) || '[]';
      const all: BodyMeasurement[] = JSON.parse(cached);
      const newMs: BodyMeasurement = {
        ...measurement,
        id: 'bm-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      localStorage.setItem(KEYS.BODY_MEASUREMENTS, JSON.stringify([...all, newMs]));
      return newMs;
    }

    const { data, error } = await supabase!
      .from('body_measurements')
      .insert(measurement)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBodyMeasurement(userId: string, measurementId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.BODY_MEASUREMENTS) || '[]';
      const all: BodyMeasurement[] = JSON.parse(cached);
      const filtered = all.filter(m => !(m.id === measurementId && m.user_id === userId));
      localStorage.setItem(KEYS.BODY_MEASUREMENTS, JSON.stringify(filtered));
      return;
    }

    const { error } = await supabase!
      .from('body_measurements')
      .delete()
      .eq('id', measurementId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // ==========================================
  // FINANCE MODULE OPERATIONS
  // ==========================================

  _adjustMockBalance(userId: string, accountId: string, diff: number) {
    const cached = localStorage.getItem(KEYS.FINANCE_ACCOUNTS) || '[]';
    const all: FinanceAccount[] = JSON.parse(cached);
    const index = all.findIndex(a => a.id === accountId && a.user_id === userId);
    if (index !== -1) {
      all[index].current_balance += diff;
      all[index].updated_at = new Date().toISOString();
      localStorage.setItem(KEYS.FINANCE_ACCOUNTS, JSON.stringify(all));
    }
  },

  async getFinanceAccounts(userId: string): Promise<FinanceAccount[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.FINANCE_ACCOUNTS) || '[]';
      return JSON.parse(cached).filter((acc: any) => acc.user_id === userId);
    }
    const { data, error } = await supabase!
      .from('finance_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createFinanceAccount(account: Omit<FinanceAccount, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceAccount> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_ACCOUNTS) || '[]';
      const all: FinanceAccount[] = JSON.parse(cached);
      const newAcc: FinanceAccount = {
        ...account,
        id: 'facc-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(KEYS.FINANCE_ACCOUNTS, JSON.stringify([...all, newAcc]));
      return newAcc;
    }
    const { data, error } = await supabase!
      .from('finance_accounts')
      .insert(account)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateFinanceAccount(userId: string, accountId: string, account: Partial<FinanceAccount>): Promise<FinanceAccount> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_ACCOUNTS) || '[]';
      const all: FinanceAccount[] = JSON.parse(cached);
      const index = all.findIndex(a => a.id === accountId && a.user_id === userId);
      if (index === -1) throw new Error('Account not found');
      const updated = { ...all[index], ...account, updated_at: new Date().toISOString() };
      all[index] = updated;
      localStorage.setItem(KEYS.FINANCE_ACCOUNTS, JSON.stringify(all));
      return updated;
    }
    const { data, error } = await supabase!
      .from('finance_accounts')
      .update(account)
      .eq('id', accountId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFinanceAccount(userId: string, accountId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_ACCOUNTS) || '[]';
      const all: FinanceAccount[] = JSON.parse(cached);
      const filtered = all.filter(a => !(a.id === accountId && a.user_id === userId));
      localStorage.setItem(KEYS.FINANCE_ACCOUNTS, JSON.stringify(filtered));
      return;
    }
    const { error } = await supabase!
      .from('finance_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getFinanceCategories(userId: string): Promise<FinanceCategory[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.FINANCE_CATEGORIES) || '[]';
      return JSON.parse(cached).filter((cat: any) => cat.user_id === userId);
    }
    const { data, error } = await supabase!
      .from('finance_categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async createFinanceCategory(category: Omit<FinanceCategory, 'id'>): Promise<FinanceCategory> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_CATEGORIES) || '[]';
      const all: FinanceCategory[] = JSON.parse(cached);
      const newCat: FinanceCategory = {
        ...category,
        id: 'fcat-' + Math.random().toString(36).substr(2, 9)
      };
      localStorage.setItem(KEYS.FINANCE_CATEGORIES, JSON.stringify([...all, newCat]));
      return newCat;
    }
    const { data, error } = await supabase!
      .from('finance_categories')
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateFinanceCategory(userId: string, categoryId: string, category: Partial<FinanceCategory>): Promise<FinanceCategory> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_CATEGORIES) || '[]';
      const all: FinanceCategory[] = JSON.parse(cached);
      const index = all.findIndex(c => c.id === categoryId && c.user_id === userId);
      if (index === -1) throw new Error('Category not found');
      const updated = { ...all[index], ...category };
      all[index] = updated;
      localStorage.setItem(KEYS.FINANCE_CATEGORIES, JSON.stringify(all));
      return updated;
    }
    const { data, error } = await supabase!
      .from('finance_categories')
      .update(category)
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFinanceCategory(userId: string, categoryId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_CATEGORIES) || '[]';
      const all: FinanceCategory[] = JSON.parse(cached);
      const filtered = all.filter(c => !(c.id === categoryId && c.user_id === userId));
      localStorage.setItem(KEYS.FINANCE_CATEGORIES, JSON.stringify(filtered));
      return;
    }
    const { error } = await supabase!
      .from('finance_categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getFinanceTransactions(userId: string, filters?: {
    accountId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    type?: 'expense' | 'income' | 'transfer';
    search?: string;
    sharedSpaceId?: string;
  }): Promise<FinanceTransaction[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const txCached = localStorage.getItem(KEYS.FINANCE_TRANSACTIONS) || '[]';
      let txs: FinanceTransaction[] = JSON.parse(txCached);
      
      const accCached = localStorage.getItem(KEYS.FINANCE_ACCOUNTS) || '[]';
      const accounts: FinanceAccount[] = JSON.parse(accCached).filter((a: any) => a.user_id === userId || txs.some(t => t.account_id === a.id));
      const catCached = localStorage.getItem(KEYS.FINANCE_CATEGORIES) || '[]';
      const categories: FinanceCategory[] = JSON.parse(catCached).filter((c: any) => c.user_id === userId);
      const profilesCache = JSON.parse(localStorage.getItem('life_os_mock_profiles_cache') || '[]');

      txs = txs.filter((t: any) => {
        const hasAccess = t.user_id === userId || (t.shared_space_id && txs.some(ot => ot.shared_space_id === t.shared_space_id && ot.user_id === userId));
        if (!hasAccess) return false;
        
        if (filters?.accountId && t.account_id !== filters.accountId) return false;
        if (filters?.categoryId && t.category_id !== filters.categoryId) return false;
        if (filters?.type && t.type !== filters.type) return false;
        if (filters?.sharedSpaceId && t.shared_space_id !== filters.sharedSpaceId) return false;
        
        if (filters?.startDate && new Date(t.transaction_date) < new Date(filters.startDate)) return false;
        if (filters?.endDate && new Date(t.transaction_date) > new Date(filters.endDate)) return false;
        
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          const matchMerchant = t.merchant && t.merchant.toLowerCase().includes(s);
          const matchDesc = t.description && t.description.toLowerCase().includes(s);
          const matchNotes = t.notes && t.notes.toLowerCase().includes(s);
          if (!matchMerchant && !matchDesc && !matchNotes) return false;
        }
        return true;
      });

      txs = txs.map(t => {
        const acc = accounts.find(a => a.id === t.account_id);
        const cat = categories.find(c => c.id === t.category_id);
        let creatorName = 'You';
        if (t.user_id !== userId) {
          const profile = profilesCache.find((p: any) => p.id === t.user_id);
          creatorName = profile ? profile.display_name : 'Member';
        }
        return {
          ...t,
          account_name: acc ? acc.name : 'Unknown Account',
          category_name: cat ? cat.name : (t.type === 'transfer' ? 'Transfer' : 'Uncategorized'),
          category_color: cat ? cat.color : '#9CA3AF',
          category_icon: cat ? cat.icon : 'HelpCircle',
          description: creatorName !== 'You' ? `${creatorName} paid` : t.description
        };
      });

      return txs.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    }

    let query = supabase!
      .from('finance_transactions')
      .select(`
        *,
        account:finance_accounts(name),
        category:finance_categories(name, color, icon)
      `);

    if (filters?.sharedSpaceId) {
      query = query.eq('shared_space_id', filters.sharedSpaceId);
    } else {
      query = query.eq('user_id', userId);
    }

    if (filters?.accountId) query = query.eq('account_id', filters.accountId);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.startDate) query = query.gte('transaction_date', filters.startDate);
    if (filters?.endDate) query = query.lte('transaction_date', filters.endDate);

    if (filters?.search) {
      query = query.or(`merchant.ilike.%${filters.search}%,description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('transaction_date', { ascending: false });
    if (error) throw error;

    return (data || []).map((t: any) => ({
      ...t,
      account_name: t.account?.name,
      category_name: t.category?.name,
      category_color: t.category?.color,
      category_icon: t.category?.icon
    }));
  },

  async createFinanceTransaction(transaction: Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'>, splits?: Omit<FinanceExpenseSplit, 'id' | 'transaction_id'>[]): Promise<FinanceTransaction> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_TRANSACTIONS) || '[]';
      const all: FinanceTransaction[] = JSON.parse(cached);
      
      const newTx: FinanceTransaction = {
        ...transaction,
        id: 'ftx-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      all.push(newTx);
      localStorage.setItem(KEYS.FINANCE_TRANSACTIONS, JSON.stringify(all));

      if (newTx.type === 'expense') {
        this._adjustMockBalance(newTx.user_id, newTx.account_id, -newTx.amount);
      } else if (newTx.type === 'income') {
        this._adjustMockBalance(newTx.user_id, newTx.account_id, newTx.amount);
      } else if (newTx.type === 'transfer' && newTx.transfer_group_id) {
        const destAccId = newTx.transfer_group_id;
        this._adjustMockBalance(newTx.user_id, newTx.account_id, -newTx.amount);
        this._adjustMockBalance(newTx.user_id, destAccId, newTx.amount);
        
        const matchingTx: FinanceTransaction = {
          ...newTx,
          id: 'ftx-' + Math.random().toString(36).substr(2, 9),
          account_id: destAccId,
          type: 'transfer',
          amount: newTx.amount,
          transfer_group_id: newTx.account_id,
          merchant: `Transfer from ${newTx.account_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        all.push(matchingTx);
        localStorage.setItem(KEYS.FINANCE_TRANSACTIONS, JSON.stringify(all));
      }

      if (splits && splits.length > 0) {
        const splitsCached = localStorage.getItem(KEYS.FINANCE_EXPENSE_SPLITS) || '[]';
        const allSplits: FinanceExpenseSplit[] = JSON.parse(splitsCached);
        const newSplits = splits.map(s => ({
          ...s,
          id: 'fspl-' + Math.random().toString(36).substr(2, 9),
          transaction_id: newTx.id,
          created_at: new Date().toISOString()
        }));
        localStorage.setItem(KEYS.FINANCE_EXPENSE_SPLITS, JSON.stringify([...allSplits, ...newSplits]));
      }

      return newTx;
    }

    const { data, error } = await supabase!
      .from('finance_transactions')
      .insert(transaction)
      .select()
      .single();
    if (error) throw error;

    if (splits && splits.length > 0) {
      const splitsPayload = splits.map(s => ({ ...s, transaction_id: data.id }));
      await supabase!.from('finance_expense_splits').insert(splitsPayload);
    }

    return data;
  },

  async updateFinanceTransaction(userId: string, transactionId: string, transaction: Partial<FinanceTransaction>): Promise<FinanceTransaction> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_TRANSACTIONS) || '[]';
      const all: FinanceTransaction[] = JSON.parse(cached);
      const index = all.findIndex(t => t.id === transactionId && t.user_id === userId);
      if (index === -1) throw new Error('Transaction not found');
      
      const oldTx = all[index];
      const updated = { ...oldTx, ...transaction, updated_at: new Date().toISOString() };
      all[index] = updated;
      localStorage.setItem(KEYS.FINANCE_TRANSACTIONS, JSON.stringify(all));

      if (oldTx.type === 'expense') {
        this._adjustMockBalance(userId, oldTx.account_id, oldTx.amount);
      } else if (oldTx.type === 'income') {
        this._adjustMockBalance(userId, oldTx.account_id, -oldTx.amount);
      } else if (oldTx.type === 'transfer' && oldTx.transfer_group_id) {
        this._adjustMockBalance(userId, oldTx.account_id, oldTx.amount);
        this._adjustMockBalance(userId, oldTx.transfer_group_id, -oldTx.amount);
      }

      if (updated.type === 'expense') {
        this._adjustMockBalance(userId, updated.account_id, -updated.amount);
      } else if (updated.type === 'income') {
        this._adjustMockBalance(userId, updated.account_id, updated.amount);
      } else if (updated.type === 'transfer' && updated.transfer_group_id) {
        this._adjustMockBalance(userId, updated.account_id, -updated.amount);
        this._adjustMockBalance(userId, updated.transfer_group_id, updated.amount);
      }

      return updated;
    }

    const { data, error } = await supabase!
      .from('finance_transactions')
      .update(transaction)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFinanceTransaction(userId: string, transactionId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_TRANSACTIONS) || '[]';
      const all: FinanceTransaction[] = JSON.parse(cached);
      const tx = all.find(t => t.id === transactionId && t.user_id === userId);
      if (!tx) return;

      const filtered = all.filter(t => t.id !== transactionId);
      localStorage.setItem(KEYS.FINANCE_TRANSACTIONS, JSON.stringify(filtered));

      if (tx.type === 'expense') {
        this._adjustMockBalance(userId, tx.account_id, tx.amount);
      } else if (tx.type === 'income') {
        this._adjustMockBalance(userId, tx.account_id, -tx.amount);
      } else if (tx.type === 'transfer' && tx.transfer_group_id) {
        this._adjustMockBalance(userId, tx.account_id, tx.amount);
        this._adjustMockBalance(userId, tx.transfer_group_id, -tx.amount);
      }
      return;
    }

    const { error } = await supabase!
      .from('finance_transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getFinanceBudgets(userId: string): Promise<FinanceBudget[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.FINANCE_BUDGETS) || '[]';
      const budgets: FinanceBudget[] = JSON.parse(cached).filter((b: any) => b.user_id === userId);
      
      const catCached = localStorage.getItem(KEYS.FINANCE_CATEGORIES) || '[]';
      const categories: FinanceCategory[] = JSON.parse(catCached).filter((c: any) => c.user_id === userId);
      
      return budgets.map(b => {
        const cat = categories.find(c => c.id === b.category_id);
        return {
          ...b,
          category_name: cat ? cat.name : 'Overall',
          category_color: cat ? cat.color : '#6B7280'
        };
      });
    }
    const { data, error } = await supabase!
      .from('finance_budgets')
      .select('*, category:finance_categories(name, color)')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((b: any) => ({
      ...b,
      category_name: b.category?.name,
      category_color: b.category?.color
    }));
  },

  async createFinanceBudget(budget: Omit<FinanceBudget, 'id'>): Promise<FinanceBudget> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_BUDGETS) || '[]';
      const all: FinanceBudget[] = JSON.parse(cached);
      const newBudget: FinanceBudget = {
        ...budget,
        id: 'fbd-' + Math.random().toString(36).substr(2, 9)
      };
      localStorage.setItem(KEYS.FINANCE_BUDGETS, JSON.stringify([...all, newBudget]));
      return newBudget;
    }
    const { data, error } = await supabase!
      .from('finance_budgets')
      .insert(budget)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateFinanceBudget(userId: string, budgetId: string, budget: Partial<FinanceBudget>): Promise<FinanceBudget> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_BUDGETS) || '[]';
      const all: FinanceBudget[] = JSON.parse(cached);
      const index = all.findIndex(b => b.id === budgetId && b.user_id === userId);
      if (index === -1) throw new Error('Budget not found');
      const updated = { ...all[index], ...budget };
      all[index] = updated;
      localStorage.setItem(KEYS.FINANCE_BUDGETS, JSON.stringify(all));
      return updated;
    }
    const { data, error } = await supabase!
      .from('finance_budgets')
      .update(budget)
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFinanceBudget(userId: string, budgetId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_BUDGETS) || '[]';
      const all: FinanceBudget[] = JSON.parse(cached);
      const filtered = all.filter(b => !(b.id === budgetId && b.user_id === userId));
      localStorage.setItem(KEYS.FINANCE_BUDGETS, JSON.stringify(filtered));
      return;
    }
    const { error } = await supabase!
      .from('finance_budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getFinanceGoals(userId: string): Promise<FinanceGoal[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.FINANCE_GOALS) || '[]';
      return JSON.parse(cached).filter((g: any) => g.user_id === userId);
    }
    const { data, error } = await supabase!
      .from('finance_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async createFinanceGoal(goal: Omit<FinanceGoal, 'id'>): Promise<FinanceGoal> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_GOALS) || '[]';
      const all: FinanceGoal[] = JSON.parse(cached);
      const newGoal: FinanceGoal = {
        ...goal,
        id: 'fgl-' + Math.random().toString(36).substr(2, 9)
      };
      localStorage.setItem(KEYS.FINANCE_GOALS, JSON.stringify([...all, newGoal]));
      return newGoal;
    }
    const { data, error } = await supabase!
      .from('finance_goals')
      .insert(goal)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateFinanceGoal(userId: string, goalId: string, goal: Partial<FinanceGoal>): Promise<FinanceGoal> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_GOALS) || '[]';
      const all: FinanceGoal[] = JSON.parse(cached);
      const index = all.findIndex(g => g.id === goalId && g.user_id === userId);
      if (index === -1) throw new Error('Goal not found');
      const updated = { ...all[index], ...goal };
      all[index] = updated;
      localStorage.setItem(KEYS.FINANCE_GOALS, JSON.stringify(all));
      return updated;
    }
    const { data, error } = await supabase!
      .from('finance_goals')
      .update(goal)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFinanceGoal(userId: string, goalId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_GOALS) || '[]';
      const all: FinanceGoal[] = JSON.parse(cached);
      const filtered = all.filter(g => !(g.id === goalId && g.user_id === userId));
      localStorage.setItem(KEYS.FINANCE_GOALS, JSON.stringify(filtered));
      return;
    }
    const { error } = await supabase!
      .from('finance_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getFinanceSubscriptions(userId: string): Promise<FinanceSubscription[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const subCached = localStorage.getItem(KEYS.FINANCE_SUBSCRIPTIONS) || '[]';
      const subs: FinanceSubscription[] = JSON.parse(subCached).filter((s: any) => s.user_id === userId);
      
      const accCached = localStorage.getItem(KEYS.FINANCE_ACCOUNTS) || '[]';
      const accounts: FinanceAccount[] = JSON.parse(accCached).filter((a: any) => a.user_id === userId);
      
      const catCached = localStorage.getItem(KEYS.FINANCE_CATEGORIES) || '[]';
      const categories: FinanceCategory[] = JSON.parse(catCached).filter((c: any) => c.user_id === userId);

      return subs.map(s => {
        const acc = accounts.find(a => a.id === s.account_id);
        const cat = categories.find(c => c.id === s.category_id);
        return {
          ...s,
          account_name: acc ? acc.name : 'Unknown Account',
          category_name: cat ? cat.name : 'Uncategorized',
          category_color: cat ? cat.color : '#6B7280'
        };
      });
    }
    const { data, error } = await supabase!
      .from('finance_subscriptions')
      .select('*, account:finance_accounts(name), category:finance_categories(name, color)')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((s: any) => ({
      ...s,
      account_name: s.account?.name,
      category_name: s.category?.name,
      category_color: s.category?.color
    }));
  },

  async createFinanceSubscription(subscription: Omit<FinanceSubscription, 'id'>): Promise<FinanceSubscription> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_SUBSCRIPTIONS) || '[]';
      const all: FinanceSubscription[] = JSON.parse(cached);
      const newSub: FinanceSubscription = {
        ...subscription,
        id: 'fsub-' + Math.random().toString(36).substr(2, 9)
      };
      localStorage.setItem(KEYS.FINANCE_SUBSCRIPTIONS, JSON.stringify([...all, newSub]));
      return newSub;
    }
    const { data, error } = await supabase!
      .from('finance_subscriptions')
      .insert(subscription)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateFinanceSubscription(userId: string, subscriptionId: string, subscription: Partial<FinanceSubscription>): Promise<FinanceSubscription> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_SUBSCRIPTIONS) || '[]';
      const all: FinanceSubscription[] = JSON.parse(cached);
      const index = all.findIndex(s => s.id === subscriptionId && s.user_id === userId);
      if (index === -1) throw new Error('Subscription not found');
      const updated = { ...all[index], ...subscription };
      all[index] = updated;
      localStorage.setItem(KEYS.FINANCE_SUBSCRIPTIONS, JSON.stringify(all));
      return updated;
    }
    const { data, error } = await supabase!
      .from('finance_subscriptions')
      .update(subscription)
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFinanceSubscription(userId: string, subscriptionId: string): Promise<void> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_SUBSCRIPTIONS) || '[]';
      const all: FinanceSubscription[] = JSON.parse(cached);
      const filtered = all.filter(s => !(s.id === subscriptionId && s.user_id === userId));
      localStorage.setItem(KEYS.FINANCE_SUBSCRIPTIONS, JSON.stringify(filtered));
      return;
    }
    const { error } = await supabase!
      .from('finance_subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getFinanceSharedSpaces(userId: string): Promise<FinanceSharedSpace[]> {
    if (isMockEnabled) {
      initMockDB(userId);
      const cached = localStorage.getItem(KEYS.FINANCE_SHARED_SPACES) || '[]';
      return JSON.parse(cached).filter((s: any) => s.owner_id === userId || s.id === 'fsp-goa');
    }
    const { data, error } = await supabase!
      .from('finance_shared_spaces')
      .select('*')
      .or(`owner_id.eq.${userId},id.in.(select space_id from finance_shared_members where user_id = '${userId}')`);
    if (error) throw error;
    return data || [];
  },

  async createFinanceSharedSpace(space: Omit<FinanceSharedSpace, 'id'>, members: Omit<FinanceSharedMember, 'id' | 'space_id'>[]): Promise<FinanceSharedSpace> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_SHARED_SPACES) || '[]';
      const all: FinanceSharedSpace[] = JSON.parse(cached);
      const newSpace: FinanceSharedSpace = {
        ...space,
        id: 'fsp-' + Math.random().toString(36).substr(2, 9)
      };
      localStorage.setItem(KEYS.FINANCE_SHARED_SPACES, JSON.stringify([...all, newSpace]));

      const memCached = localStorage.getItem(KEYS.FINANCE_SHARED_MEMBERS) || '[]';
      const allM: FinanceSharedMember[] = JSON.parse(memCached);
      const newM = members.map(m => ({
        ...m,
        id: 'fsm-' + Math.random().toString(36).substr(2, 9),
        space_id: newSpace.id
      }));
      localStorage.setItem(KEYS.FINANCE_SHARED_MEMBERS, JSON.stringify([...allM, ...newM]));

      return newSpace;
    }
    const { data, error } = await supabase!
      .from('finance_shared_spaces')
      .insert(space)
      .select()
      .single();
    if (error) throw error;

    const membersPayload = members.map(m => ({ ...m, space_id: data.id }));
    await supabase!.from('finance_shared_members').insert(membersPayload);

    return data;
  },

  async getFinanceSharedMembers(spaceId: string): Promise<FinanceSharedMember[]> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_SHARED_MEMBERS) || '[]';
      const members: FinanceSharedMember[] = JSON.parse(cached).filter((m: any) => m.space_id === spaceId);
      const profilesCache = JSON.parse(localStorage.getItem('life_os_mock_profiles_cache') || '[]');
      return members.map(m => {
        const profile = profilesCache.find((p: any) => p.id === m.user_id);
        return {
          ...m,
          display_name: profile ? profile.display_name : 'Group Member',
          email: profile ? profile.email : ''
        };
      });
    }
    const { data, error } = await supabase!
      .from('finance_shared_members')
      .select(`
        *,
        profile:profiles(display_name, email)
      `)
      .eq('space_id', spaceId);
    if (error) throw error;
    return (data || []).map((m: any) => ({
      ...m,
      display_name: m.profile?.display_name,
      email: m.profile?.email
    }));
  },

  async getFinanceExpenseSplits(transactionId: string): Promise<FinanceExpenseSplit[]> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_EXPENSE_SPLITS) || '[]';
      const splits: FinanceExpenseSplit[] = JSON.parse(cached).filter((s: any) => s.transaction_id === transactionId);
      const profilesCache = JSON.parse(localStorage.getItem('life_os_mock_profiles_cache') || '[]');
      return splits.map(s => {
        const profile = profilesCache.find((p: any) => p.id === s.user_id);
        return {
          ...s,
          display_name: profile ? profile.display_name : 'Member'
        };
      });
    }
    const { data, error } = await supabase!
      .from('finance_expense_splits')
      .select('*, profile:profiles(display_name)')
      .eq('transaction_id', transactionId);
    if (error) throw error;
    return (data || []).map((s: any) => ({
      ...s,
      display_name: s.profile?.display_name
    }));
  },

  async getFinanceSettlements(spaceId: string): Promise<FinanceSettlement[]> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_SETTLEMENTS) || '[]';
      const sets: FinanceSettlement[] = JSON.parse(cached).filter((s: any) => s.space_id === spaceId);
      const profilesCache = JSON.parse(localStorage.getItem('life_os_mock_profiles_cache') || '[]');
      return sets.map(s => {
        const p1 = profilesCache.find((p: any) => p.id === s.payer_id);
        const p2 = profilesCache.find((p: any) => p.id === s.payee_id);
        return {
          ...s,
          payer_name: p1 ? p1.display_name : 'Payer',
          payee_name: p2 ? p2.display_name : 'Payee'
        };
      });
    }
    const { data, error } = await supabase!
      .from('finance_settlements')
      .select(`
        *,
        payer:profiles!payer_id(display_name),
        payee:profiles!payee_id(display_name)
      `)
      .eq('space_id', spaceId);
    if (error) throw error;
    return (data || []).map((s: any) => ({
      ...s,
      payer_name: s.payer?.display_name,
      payee_name: s.payee?.display_name
    }));
  },

  async createFinanceSettlement(settlement: Omit<FinanceSettlement, 'id' | 'settled_date'>): Promise<FinanceSettlement> {
    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.FINANCE_SETTLEMENTS) || '[]';
      const all: FinanceSettlement[] = JSON.parse(cached);
      const newS: FinanceSettlement = {
        ...settlement,
        id: 'fst-' + Math.random().toString(36).substr(2, 9),
        settled_date: new Date().toISOString()
      };
      all.push(newS);
      localStorage.setItem(KEYS.FINANCE_SETTLEMENTS, JSON.stringify(all));
      return newS;
    }
    const { data, error } = await supabase!
      .from('finance_settlements')
      .insert(settlement)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // END OF FINANCE MODULE OPERATIONS
  // ==========================================

  async seedKotlinSyllabusIfEmpty(userId: string): Promise<void> {
    const categories = await this.getCategories(userId);
    const kotlinCat = categories.find(c => c.name.toLowerCase() === 'kotlin');
    
    if (kotlinCat) {
      return;
    }

    console.log('[Life-OS] Seeding Kotlin programming syllabus to database...');

    let kotlinCatId = '';
    if (isMockEnabled) {
      kotlinCatId = 'cat-kotlin';
      const newCat: Category = {
        id: kotlinCatId,
        user_id: userId,
        name: 'Kotlin',
        description: 'Kotlin Learning Syllabus',
        icon: 'Code2',
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      categories.push(newCat);
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    } else {
      const { data, error } = await supabase!
        .from('categories')
        .insert({
          user_id: userId,
          name: 'Kotlin',
          description: 'Kotlin Learning Syllabus',
          icon: 'Code2',
          sort_order: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      kotlinCatId = data.id;
    }

    if (isMockEnabled) {
      const cached = localStorage.getItem(KEYS.TOPICS);
      const topicsList: Topic[] = cached ? JSON.parse(cached) : [];
      
      const newTopics: Topic[] = KOTLIN_SYLLABUS.map((item, idx) => ({
        id: `topic-kotlin-${idx}`,
        category_id: kotlinCatId,
        user_id: userId,
        title: item.title,
        description: item.description,
        notes: item.notes,
        is_completed: false,
        completed_at: null,
        sort_order: item.sort_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      localStorage.setItem(KEYS.TOPICS, JSON.stringify([...topicsList, ...newTopics]));
    } else {
      const insertPayload = KOTLIN_SYLLABUS.map(item => ({
        category_id: kotlinCatId,
        user_id: userId,
        title: item.title,
        description: item.description,
        notes: item.notes,
        is_completed: false,
        sort_order: item.sort_order
      }));

      const { error } = await supabase!
        .from('topics')
        .insert(insertPayload);
      
      if (error) throw error;
    }

    console.log('[Life-OS] Seeding finished successfully.');
  }
};
