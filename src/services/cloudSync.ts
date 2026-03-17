import { db } from '../db/db';
import { supabase } from '../lib/supabase';

type BackupPayload = {
  version: number;
  savedAt: string;
  data: {
    dailyEntries: unknown[];
    tasks: unknown[];
    habits: unknown[];
    habitLogs: unknown[];
    goals: unknown[];
    projects: unknown[];
    projectTasks: unknown[];
    journalEntries: unknown[];
    weeklyReviews: unknown[];
    learningSessions: unknown[];
    learningTracks: unknown[];
    focusSessions: unknown[];
    monthlyLetters: unknown[];
    annualLetters: unknown[];
    settings: unknown[];
  };
};

const SYNC_PREFIX = 'cloud:lastSyncAt:';

function syncKey(userId: string) {
  return `${SYNC_PREFIX}${userId}`;
}

function setLastSync(userId: string, isoDate: string) {
  localStorage.setItem(syncKey(userId), isoDate);
}

export function getLastSync(userId: string): string | null {
  return localStorage.getItem(syncKey(userId));
}

export async function clearLocalData() {
  const tables = [
    db.dailyEntries,
    db.tasks,
    db.habits,
    db.habitLogs,
    db.goals,
    db.projects,
    db.projectTasks,
    db.journalEntries,
    db.weeklyReviews,
    db.learningSessions,
    db.learningTracks,
    db.focusSessions,
    db.monthlyLetters,
    db.annualLetters,
    db.settings,
  ];

  await db.transaction('rw', tables, async () => {
    await db.dailyEntries.clear();
    await db.tasks.clear();
    await db.habits.clear();
    await db.habitLogs.clear();
    await db.goals.clear();
    await db.projects.clear();
    await db.projectTasks.clear();
    await db.journalEntries.clear();
    await db.weeklyReviews.clear();
    await db.learningSessions.clear();
    await db.learningTracks.clear();
    await db.focusSessions.clear();
    await db.monthlyLetters.clear();
    await db.annualLetters.clear();
    await db.settings.clear();
  });
}

async function serializeLocalData(): Promise<BackupPayload> {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    data: {
      dailyEntries: await db.dailyEntries.toArray(),
      tasks: await db.tasks.toArray(),
      habits: await db.habits.toArray(),
      habitLogs: await db.habitLogs.toArray(),
      goals: await db.goals.toArray(),
      projects: await db.projects.toArray(),
      projectTasks: await db.projectTasks.toArray(),
      journalEntries: await db.journalEntries.toArray(),
      weeklyReviews: await db.weeklyReviews.toArray(),
      learningSessions: await db.learningSessions.toArray(),
      learningTracks: await db.learningTracks.toArray(),
      focusSessions: await db.focusSessions.toArray(),
      monthlyLetters: await db.monthlyLetters.toArray(),
      annualLetters: await db.annualLetters.toArray(),
      settings: await db.settings.toArray(),
    },
  };
}

export async function pushUserBackup(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload = await serializeLocalData();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('user_backups')
    .upsert({ user_id: userId, payload, updated_at: now }, { onConflict: 'user_id' });

  if (error) throw error;
  setLastSync(userId, now);
}

type BackupRow = {
  payload: BackupPayload | null;
  updated_at: string | null;
};

export async function pullUserBackup(userId: string): Promise<BackupPayload | null> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('user_backups')
    .select('payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle<BackupRow>();

  if (error) throw error;
  if (!data?.payload) return null;

  if (data.updated_at) {
    setLastSync(userId, data.updated_at);
  }

  return data.payload;
}

export async function syncFromCloudToLocal(userId: string): Promise<'restored' | 'empty'> {
  const backup = await pullUserBackup(userId);
  if (!backup) {
    await clearLocalData();
    return 'empty';
  }

  const { data } = backup;
  await clearLocalData();

  if (data.dailyEntries.length) await db.dailyEntries.bulkPut(data.dailyEntries as never[]);
  if (data.tasks.length) await db.tasks.bulkPut(data.tasks as never[]);
  if (data.habits.length) await db.habits.bulkPut(data.habits as never[]);
  if (data.habitLogs.length) await db.habitLogs.bulkPut(data.habitLogs as never[]);
  if (data.goals.length) await db.goals.bulkPut(data.goals as never[]);
  if (data.projects.length) await db.projects.bulkPut(data.projects as never[]);
  if (data.projectTasks.length) await db.projectTasks.bulkPut(data.projectTasks as never[]);
  if (data.journalEntries.length) await db.journalEntries.bulkPut(data.journalEntries as never[]);
  if (data.weeklyReviews.length) await db.weeklyReviews.bulkPut(data.weeklyReviews as never[]);
  if (data.learningSessions.length) await db.learningSessions.bulkPut(data.learningSessions as never[]);
  if (data.learningTracks.length) await db.learningTracks.bulkPut(data.learningTracks as never[]);
  if (data.focusSessions.length) await db.focusSessions.bulkPut(data.focusSessions as never[]);
  if (data.monthlyLetters.length) await db.monthlyLetters.bulkPut(data.monthlyLetters as never[]);
  if (data.annualLetters.length) await db.annualLetters.bulkPut(data.annualLetters as never[]);
  if (data.settings.length) await db.settings.bulkPut(data.settings as never[]);

  return 'restored';
}
