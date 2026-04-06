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

export async function syncFromCloudToLocal(userId: string): Promise<'restored' | 'empty' | 'pushed_local'> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('user_backups')
    .select('payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle<BackupRow>();

  if (error) throw error;
  
  const lastSync = getLastSync(userId);
  
  // If cloud data exists and we have a sync history, check if cloud is actually newer
  if (data?.updated_at && lastSync) {
    const cloudTime = new Date(data.updated_at).getTime();
    const localTime = new Date(lastSync).getTime();
    
    // If the cloud hasn't been updated since our last sync, we likely have local changes
    // that failed to push. Instead of overwriting local data, let's push it!
    if (cloudTime <= localTime) {
      await pushUserBackup(userId);
      return 'pushed_local';
    }
  }

  const backup = data?.payload;
  if (!backup) {
    if (!lastSync) {
      await clearLocalData();
    }
    return 'empty';
  }

  if (data.updated_at) {
    setLastSync(userId, data.updated_at);
  }

  const payloadData = backup.data;
  await clearLocalData();

  if (payloadData.dailyEntries.length) await db.dailyEntries.bulkPut(payloadData.dailyEntries as never[]);
  if (payloadData.tasks.length) await db.tasks.bulkPut(payloadData.tasks as never[]);
  if (payloadData.habits.length) await db.habits.bulkPut(payloadData.habits as never[]);
  if (payloadData.habitLogs.length) await db.habitLogs.bulkPut(payloadData.habitLogs as never[]);
  if (payloadData.goals.length) await db.goals.bulkPut(payloadData.goals as never[]);
  if (payloadData.projects.length) await db.projects.bulkPut(payloadData.projects as never[]);
  if (payloadData.projectTasks.length) await db.projectTasks.bulkPut(payloadData.projectTasks as never[]);
  if (payloadData.journalEntries.length) await db.journalEntries.bulkPut(payloadData.journalEntries as never[]);
  if (payloadData.weeklyReviews.length) await db.weeklyReviews.bulkPut(payloadData.weeklyReviews as never[]);
  if (payloadData.learningSessions.length) await db.learningSessions.bulkPut(payloadData.learningSessions as never[]);
  if (payloadData.learningTracks.length) await db.learningTracks.bulkPut(payloadData.learningTracks as never[]);
  if (payloadData.focusSessions.length) await db.focusSessions.bulkPut(payloadData.focusSessions as never[]);
  if (payloadData.monthlyLetters.length) await db.monthlyLetters.bulkPut(payloadData.monthlyLetters as never[]);
  if (payloadData.annualLetters.length) await db.annualLetters.bulkPut(payloadData.annualLetters as never[]);
  if (payloadData.settings.length) await db.settings.bulkPut(payloadData.settings as never[]);

  return 'restored';
}
