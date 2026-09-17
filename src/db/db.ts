import Dexie, { type EntityTable } from 'dexie';

export type Priority = 'high' | 'medium' | 'low';
export type MoodType = 'excellent' | 'good' | 'neutral' | 'difficult' | 'rough';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';
export type ProjectStatus = 'not-started' | 'in-progress' | 'blocked' | 'done';
export type ResourceType = 'book' | 'course' | 'video' | 'article' | 'podcast';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  targetDate?: string;
}

export interface DailyEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  morningMIT: string;
  morningBlocker: string;
  morningGratitude: string;
  morningEnergy: number; // 1-5
  eveningReflection: string;
  eveningEnergy: number; // 1-5
  eveningWentWell: string;
  eveningTomorrow: string;
  mitCompleted: 'yes' | 'partial' | 'no' | '';
  dailyScore: number;
  focusSessionsCount: number;
}

export interface Task {
  id?: number;
  title: string;
  date: string;
  projectId?: number;
  priority: Priority;
  estimatedMinutes?: number;
  completed: boolean;
  completedAt?: string;
  carriedOver: boolean;
  createdAt: string;
  sortOrder?: number;
}

export interface Habit {
  id?: number;
  name: string;
  why: string;
  category: string;
  frequency: HabitFrequency;
  bestTime: string;
  color: string;
  emoji: string;
  linkedGoalId?: number;
  createdAt: string;
  archived: 0 | 1;
}

export interface HabitLog {
  id?: number;
  habitId: number;
  date: string;
  completed: boolean;
  note?: string;
}

export interface Goal {
  id?: number;
  title: string;
  why: string;
  targetDate: string;
  category: string;
  successMetric: string;
  status: GoalStatus;
  milestones: Milestone[];
  color: string;
  createdAt: string;
}

export interface Project {
  id?: number;
  goalId?: number;
  title: string;
  description: string;
  status: ProjectStatus;
  notes: string;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id?: number;
  projectId: number;
  title: string;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface JournalEntry {
  id?: number;
  date: string;
  mood: MoodType;
  energy: number; // 1-5
  tags: string[];
  body: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReview {
  id?: number;
  weekStartDate: string; // YYYY-MM-DD of Monday
  weekEndDate: string;
  weekStart?: string; // legacy
  weekNumber?: number;
  highlight?: string;
  learned?: string;
  challenge?: string;
  gratitude?: string;
  improvement?: string;
  nextWeekGoal?: string;
  wins?: string[];
  notDone?: string;
  drainer?: string;
  energizer?: string;
  different?: string;
  rating: number; // 1-10
  oneWord?: string;
  nextPriority?: string;
  dayIntentions?: Record<string, string>;
  focusHabits?: number[];
  tasksCompleted?: number;
  totalTasks?: number;
  avgDailyScore?: number;
  habitsCompleted?: number;
  createdAt: string;
}

export interface LearningTrack {
  id?: number;
  name: string;
  description?: string;
  subject?: string; // legacy
  why?: string;
  category: string;
  currentResource?: string;
  resourceType?: ResourceType;
  progress?: number; // 0-100
  totalHours: number;
  targetHours?: number;
  goal?: string;
  targetDate?: string;
  lastSession?: string;
  color?: string;
  status?: 'active' | 'paused' | 'completed';
  startDate?: string;
  createdAt: string;
}

export interface LearningSession {
  id?: number;
  trackId?: number;
  date: string;
  duration: number; // minutes
  durationMinutes?: number; // legacy
  keyInsight?: string;
  clarityRating?: number; // 1-5
  source?: string;
  questions?: string;
  createdAt: string;
}

export interface FocusSession {
  id?: number;
  date: string;
  durationMinutes: number;
  taskId?: number;
  completed: boolean;
  createdAt: string;
}

export interface MonthlyLetter {
  id?: number;
  date: string;
  content: string;
  targetDate: string;
}

export interface AnnualLetter {
  id?: number;
  year: number;
  content: string;
  createdAt: string;
}

export interface Settings {
  name?: string;
  name_val?: string; // primary key workaround
  birthdate?: string;
  reviewDay?: number; // 0=Sun, 0-6
  quoteStyle?: string;
  reminderTime?: string;
  setupComplete?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export type EventType = 'event' | 'task' | 'reminder' | 'time-block' | 'habit' | 'milestone';

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  color: string;
  categoryId: string;
  priority: Priority | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  recurrence: any | null; // Placeholder for RecurrenceRule
  reminders: any[]; // Placeholder for ReminderConfig
  tags: string[];
  linkedNoteId: string | null;
  timeEstimate: number | null;
  actualTime: number | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
}

export interface Note {
  id: string;
  type: 'note' | 'daily' | 'journal' | 'learnt' | 'template';
  title: string;
  content: string;
  contentPlainText: string;
  tags: string[];
  folderId: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  color: string | null;
  coverImage: string | null;
  linkedNoteIds: string[];
  linkedEventId: string | null;
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: number;
  updatedAt: number;
  viewedAt: number;
  dailyDate: string | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  order: number;
  isSmartFolder?: boolean;
  filterRules?: any[];
  createdAt?: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt?: number;
}

export interface NotificationRecord {
  id: string;
  eventId: string;
  scheduledAt: number;
  status: string;
}

export interface Trade {
  id?: number;
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  date: string;
  fees: number;
  notes?: string;
  accountId?: string;
  createdAt: number;
}

export interface Holding {
  id?: number;
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice?: number;
  lastUpdated?: number;
}

export interface IncomeEntry {
  id?: string;
  streamId: string;
  date: string;
  amount: number;
  description: string;
  isRecurring: boolean;
  taxDeducted: number;
  netAmount: number;
  createdAt: number;
}

export interface IncomeStream {
  id?: string;
  name: string;
  type: 'salary' | 'freelance' | 'dividend' | 'other';
  isActive: boolean;
  frequency?: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';
  expectedAmount?: number;
  createdAt: number;
}

export interface Expense {
  id?: number;
  categoryId: number;
  amount: number;
  date: string;
  merchant?: string;
  notes?: string;
  isSubscription?: boolean;
  needsReview?: boolean;
  createdAt: number;
}

export interface ExpenseCategory {
  id?: number;
  name: string;
  icon: string;
  color: string;
  parentId?: number;
  budget?: number;
  isDefault?: boolean;
}

export interface RecurringExpense {
  id?: number;
  categoryId: number;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  isActive: boolean;
  createdAt: number;
}

export interface NetWorthSnapshot {
  id?: number;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  notes?: string;
}

export interface Asset {
  id?: number;
  name: string;
  category: 'cash' | 'investments' | 'real_estate' | 'crypto' | 'other';
  value: number;
  lastUpdated: string;
  notes?: string;
}

export interface Liability {
  id?: number;
  name: string;
  category: 'mortgage' | 'loan' | 'credit_card' | 'other';
  amount: number;
  interestRate?: number;
  lastUpdated: string;
  notes?: string;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  notes?: string;
  createdAt: number;
}

export interface Dividend {
  id?: number;
  symbol: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: number;
}

export interface IpoApplication {
  id?: number;
  companyName: string;
  symbol?: string;
  kittaApplied: number;
  amount: number;
  status: 'applied' | 'allotted' | 'not_allotted' | 'refunded';
  kittaAllotted?: number;
  applyDate: string;
  resultDate?: string;
  notes?: string;
  createdAt: number;
}

class ProductivityDB extends Dexie {
  dailyEntries!: EntityTable<DailyEntry, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: EntityTable<HabitLog, 'id'>;
  events!: EntityTable<CalendarEvent, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  folders!: EntityTable<Folder, 'id'>;
  tags!: EntityTable<Tag, 'id'>;
  templates!: EntityTable<Template, 'id'>;
  notifications!: EntityTable<NotificationRecord, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  projects!: EntityTable<Project, 'id'>;
  projectTasks!: EntityTable<ProjectTask, 'id'>;
  journalEntries!: EntityTable<JournalEntry, 'id'>;
  weeklyReviews!: EntityTable<WeeklyReview, 'id'>;
  learningSessions!: EntityTable<LearningSession, 'id'>;
  learningTracks!: EntityTable<LearningTrack, 'id'>;
  focusSessions!: EntityTable<FocusSession, 'id'>;
  monthlyLetters!: EntityTable<MonthlyLetter, 'id'>;
  annualLetters!: EntityTable<AnnualLetter, 'id'>;
  settings!: EntityTable<Settings, 'name_val'>;

  // Finance Module
  trades!: EntityTable<Trade, 'id'>;
  holdings!: EntityTable<Holding, 'id'>;
  incomeEntries!: EntityTable<IncomeEntry, 'id'>;
  incomeStreams!: EntityTable<IncomeStream, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  expenseCategories!: EntityTable<ExpenseCategory, 'id'>;
  recurringExpenses!: EntityTable<RecurringExpense, 'id'>;
  netWorthSnapshots!: EntityTable<NetWorthSnapshot, 'id'>;
  assets!: EntityTable<Asset, 'id'>;
  liabilities!: EntityTable<Liability, 'id'>;
  savingsGoals!: EntityTable<SavingsGoal, 'id'>;
  dividends!: EntityTable<Dividend, 'id'>;
  ipoApplications!: EntityTable<IpoApplication, 'id'>;

  constructor() {
    super('ProductivityApp');
    this.version(1).stores({
      dailyEntries: '++id, date',
      tasks: '++id, date, projectId, completed',
      habits: '++id, category, archived',
      habitLogs: '++id, habitId, date',
      goals: '++id, status, category',
      projects: '++id, goalId, status',
      projectTasks: '++id, projectId, completed',
      journalEntries: '++id, date, mood',
      weeklyReviews: '++id, weekStart, weekNumber',
      learningSessions: '++id, trackId, date',
      learningTracks: '++id, status, category',
      focusSessions: '++id, date, completed',
      monthlyLetters: '++id, date',
      annualLetters: '++id, year',
      settings: 'name_val',
    });
    this.version(2).stores({
      weeklyReviews: '++id, weekStart, weekStartDate, weekNumber',
      learningTracks: '++id, status, category, name',
      learningSessions: '++id, trackId, date',
    });
    this.version(3).upgrade(async tx => {
      await tx.table('habits').toCollection().modify((habit: { archived?: boolean | number | null }) => {
        if (habit.archived === true) habit.archived = 1;
        else if (habit.archived === false || habit.archived == null) habit.archived = 0;
      });
    });
    this.version(4).stores({
      events: 'id, type, startTime, endTime, allDay, categoryId, status, [type+startTime]',
      categories: 'id, name, isDefault',
      notes: 'id, type, folderId, dailyDate, updatedAt, [type+updatedAt], *tags',
      folders: 'id, parentId, order',
      tags: 'id, name',
      templates: 'id, name, type',
      notifications: 'id, eventId, scheduledAt, status'
    }).upgrade(async tx => {
      await tx.table('categories').bulkAdd([
        { id: 'cat-work', name: 'Work', color: '#3B82F6', icon: '💼', isDefault: true },
        { id: 'cat-personal', name: 'Personal', color: '#10B981', icon: '🏠', isDefault: true },
        { id: 'cat-health', name: 'Health', color: '#F59E0B', icon: '💪', isDefault: true },
        { id: 'cat-learning', name: 'Learning', color: '#8B5CF6', icon: '📚', isDefault: true },
        { id: 'cat-finance', name: 'Finance', color: '#EC4899', icon: '💰', isDefault: true },
        { id: 'cat-social', name: 'Social', color: '#06B6D4', icon: '👥', isDefault: true },
      ]);
      await tx.table('settings').bulkAdd([
        { name_val: 'theme', theme: 'system' },
        { name_val: 'accentColor', accentColor: '#3B82F6' },
        { name_val: 'calendarDefaultView', calendarDefaultView: 'week' },
        { name_val: 'weekStartsOn', weekStartsOn: 0 },
        { name_val: 'timeFormat', timeFormat: '12h' },
        { name_val: 'workingHoursStart', workingHoursStart: '09:00' },
        { name_val: 'workingHoursEnd', workingHoursEnd: '18:00' },
        { name_val: 'dailyNoteAutoCreate', dailyNoteAutoCreate: true },
        { name_val: 'defaultReminderOffset', defaultReminderOffset: 15 },
        { name_val: 'notificationsEnabled', notificationsEnabled: true },
      ]);
      await tx.table('folders').bulkAdd([
        { id: 'folder-personal', name: 'Personal', icon: '🏠', color: '#10B981', parentId: null, order: 0 },
        { id: 'folder-work', name: 'Work', icon: '💼', color: '#3B82F6', parentId: null, order: 1 },
        { id: 'folder-learning', name: 'Learning', icon: '📚', color: '#8B5CF6', parentId: null, order: 2 },
        { id: 'folder-finance', name: 'NEPSE & Finance', icon: '📈', color: '#EC4899', parentId: null, order: 3 },
      ]);
      await tx.table('templates').add({
        id: 'template-daily',
        name: 'Daily Note',
        type: 'daily',
        content: `# {{date}}\n\n## 🌅 Morning Intention\nToday I want to...\n\n## ✅ Today's Top 3\n- [ ] \n- [ ] \n- [ ] \n\n## 🧠 Things I Learned Today\n\n\n## 📝 Notes & Thoughts\n\n\n## 🌙 Evening Reflection\n**What went well:**\n\n**What could improve:**\n\n**Gratitude:**\n`,
        createdAt: Date.now(),
      });
    });

    this.version(5).stores({
      trades: '++id, symbol, type, date, [symbol+date]',
      holdings: '++id, symbol',
      dividends: '++id, symbol, date, type',
      ipoApplications: '++id, symbol, date, status',
      incomeEntries: '++id, streamId, date, [streamId+date]',
      incomeStreams: '++id, name, type',
      expenses: '++id, categoryId, date, paymentMethod, isRecurring, [categoryId+date]',
      expenseCategories: '++id, name',
      recurringExpenses: '++id, categoryId, frequency',
      netWorthSnapshots: '++id, date',
      savingsGoals: '++id, name, status',
      assets: '++id, type, name',
      liabilities: '++id, type, name'
    }).upgrade(async tx => {
      await tx.table('expenseCategories').bulkAdd([
        { name: 'Food & Dining',     icon: '🍜', color: '#F59E0B', budgetMonthly: 8000  },
        { name: 'Transport',         icon: '🚌', color: '#3B82F6', budgetMonthly: 3000  },
        { name: 'Rent & Housing',    icon: '🏠', color: '#8B5CF6', budgetMonthly: 12000 },
        { name: 'Learning & Books',  icon: '📚', color: '#10B981', budgetMonthly: 2000  },
        { name: 'Entertainment',     icon: '🎬', color: '#EC4899', budgetMonthly: 2000  },
        { name: 'Health',            icon: '💊', color: '#EF4444', budgetMonthly: 1500  },
        { name: 'Clothing',          icon: '👕', color: '#06B6D4', budgetMonthly: 2000  },
        { name: 'Subscriptions',     icon: '📱', color: '#6B7280', budgetMonthly: 1000  },
        { name: 'Miscellaneous',     icon: '📦', color: '#9CA3AF', budgetMonthly: 3000  },
      ]);
      await tx.table('incomeStreams').bulkAdd([
        { name: 'IMS Software Salary', type: 'salary',   color: '#3B82F6', icon: '💼' },
        { name: 'Freelance',           type: 'freelance', color: '#10B981', icon: '💻' },
        { name: 'NEPSE Dividends',     type: 'dividend',  color: '#F59E0B', icon: '📈' },
        { name: 'Other Income',        type: 'other',     color: '#8B5CF6', icon: '💰' },
      ]);
    });
  }
}

export const db = new ProductivityDB();

// Helper to get/set settings
export async function getSetting(key: string): Promise<string | number | boolean | undefined> {
  const row = await db.settings.get(key);
  return row?.[key];
}

export async function setSetting(key: string, value: string | number | boolean): Promise<void> {
  await db.settings.put({ name_val: key, [key]: value });
}

export async function getAllSettings(): Promise<Record<string, string | number | boolean>> {
  const rows = await db.settings.toArray();
  const result: Record<string, string | number | boolean> = {};
  rows.forEach(row => {
    const key = row.name_val!;
    if (row[key] !== undefined) result[key] = row[key] as string | number | boolean;
  });
  return result;
}
