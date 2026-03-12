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
  archived: boolean;
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

class ProductivityDB extends Dexie {
  dailyEntries!: EntityTable<DailyEntry, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: EntityTable<HabitLog, 'id'>;
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
