export interface UserRecord {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export type AuthUser = UserRecord;

export interface ExerciseRecord {
  id: string;
  name: string;
  category: string;
  equipment?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GoalRecord {
  id: string;
  title: string;
  description?: string;
  targetDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MonthlyPlanRecord {
  id: string;
  month: string;
  goals: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WeeklyPlanRecord {
  id: string;
  weekStart: number;
  tasks: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DailyTaskRecord {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ActivityRecord {
  id: string;
  title: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutRecord {
  id: string;
  title: string;
  exercises: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MeasurementRecord {
  id: string;
  type: string;
  value: number;
  recordedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface JournalRecord {
  id: string;
  entry: string;
  mood?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RewardRecord {
  id: string;
  title: string;
  redeemed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface SharedGoalRecord {
  id: string;
  ownerId: string;
  collaboratorIds: string[];
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface SharedActivityRecord {
  id: string;
  ownerId: string;
  collaboratorIds: string[];
  title: string;
  createdAt: number;
  updatedAt: number;
}
