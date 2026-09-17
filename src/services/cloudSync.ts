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

/**
 * Track backup attempts for debugging/recovery
 */
const BACKUP_HISTORY_KEY = 'cloud:backupHistory:';

function backupHistoryKey(userId: string) {
  return `${BACKUP_HISTORY_KEY}${userId}`;
}

export function getBackupHistory(userId: string) {
  const json = localStorage.getItem(backupHistoryKey(userId));
  if (!json) return [];
  try {
    return JSON.parse(json) as Array<{ timestamp: string; itemCount: number; status: 'success' | 'failed' }>;
  } catch {
    return [];
  }
}

function recordBackupAttempt(userId: string, status: 'success' | 'failed', itemCount: number) {
  const history = getBackupHistory(userId);
  history.push({ timestamp: new Date().toISOString(), itemCount, status });
  // Keep only last 20 backups
  if (history.length > 20) history.shift();
  localStorage.setItem(backupHistoryKey(userId), JSON.stringify(history));
}

/**
 * Detect if data loss is likely (e.g., sudden drop from previous syncs)
 */
export function detectDataLoss(userId: string, currentLocalCount: number): { dataLoss: boolean; lastKnownCount: number } {
  const history = getBackupHistory(userId);
  if (history.length < 2) return { dataLoss: false, lastKnownCount: 0 };
  
  // Find last successful backup
  const lastSuccess = history.reverse().find(h => h.status === 'success');
  if (!lastSuccess) return { dataLoss: false, lastKnownCount: 0 };
  
  // If current local count is less than 20% of previous and we had data before
  const threshold = Math.max(lastSuccess.itemCount * 0.2, 5);
  if (currentLocalCount < threshold && lastSuccess.itemCount > 10) {
    return { dataLoss: true, lastKnownCount: lastSuccess.itemCount };
  }
  
  return { dataLoss: false, lastKnownCount: lastSuccess.itemCount };
}

/**
 * Attempt to recover data from cloud if local data was lost
 */
export async function attemptDataRecovery(userId: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase is not configured.');
  
  try {
    const { data, error } = await supabase
      .from('user_backups')
      .select('payload, updated_at')
      .eq('user_id', userId)
      .maybeSingle<BackupRow>();
    
    if (error) throw error;
    if (!data?.payload || !isValidBackupPayload(data.payload)) {
      console.warn('[Recovery] No valid cloud backup found for recovery');
      return false;
    }
    
    const payloadData = data.payload.data;
    await clearLocalData();
    
    // Restore all data from cloud
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
    
if (data?.updated_at) {
    setLastSync(userId, data.updated_at);
  }
    
    console.log('[Recovery] Data recovery successful');
    return true;
  } catch (error) {
    console.error('[Recovery] Data recovery failed', error);
    return false;
  }
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

export async function serializeLocalData(): Promise<BackupPayload> {
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

  // PROTECTION: Get local data count before pushing
  const localCount = await getLocalDataCount();
  
  const payload = await serializeLocalData();
  const now = new Date().toISOString();
  
  try {
    const { error } = await supabase
      .from('user_backups')
      .upsert({ user_id: userId, payload, updated_at: now }, { onConflict: 'user_id' });

    if (error) throw error;
    setLastSync(userId, now);
    recordBackupAttempt(userId, 'success', localCount);
    
    console.log(`[Sync] Backup successful: ${localCount} data items saved`, { timestamp: now });
  } catch (pushError) {
    recordBackupAttempt(userId, 'failed', localCount);
    console.error('[Sync] Backup failed - local data preserved', pushError);
    // Always preserve local data on push failure
    throw pushError;
  }
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

/**
 * Validates that a backup payload has the expected structure
 */
function isValidBackupPayload(backup: BackupPayload | null | undefined): backup is BackupPayload {
  if (!backup || !backup.data) return false;
  
  // Check that it has at least one of the expected table arrays
  const { data } = backup;
  return Array.isArray(data.settings) || 
         Array.isArray(data.dailyEntries) ||
         Array.isArray(data.habits) ||
         Array.isArray(data.tasks) ||
         Array.isArray(data.goals);
}

/**
 * Get count of local data entries (quick health check)
 */
async function getLocalDataCount(): Promise<number> {
  const counts = await Promise.all([
    db.dailyEntries.count(),
    db.tasks.count(),
    db.habits.count(),
    db.goals.count(),
    db.journalEntries.count(),
  ]);
  return counts.reduce((a, b) => a + b, 0);
}

export async function syncFromCloudToLocal(userId: string): Promise<'restored' | 'empty' | 'pushed_local' | 'preserved_local'> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('user_backups')
    .select('payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle<BackupRow>();

  if (error) throw error;
  
  const lastSync = getLastSync(userId);
  const localDataCount = await getLocalDataCount();
  
  // CHECK FOR DATA LOSS: If local data suddenly dropped significantly, recover from cloud
  const { dataLoss, lastKnownCount } = detectDataLoss(userId, localDataCount);
  if (dataLoss && lastKnownCount > 0) {
    console.warn(`[Sync] Data loss detected! Local: ${localDataCount}, Previous: ${lastKnownCount}. Attempting recovery from cloud...`);
    const recovered = await attemptDataRecovery(userId);
    if (recovered) {
      console.log('[Sync] Successfully recovered data from cloud');
      return 'restored';
    }
  }
  
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

  // CRITICAL: Check if backup exists and is valid
  const backup = data?.payload;
  if (!isValidBackupPayload(backup)) {
    // No valid cloud backup found
    // NEVER auto-clear local data if user has content locally
    if (localDataCount > 0) {
      // User has local data, preserve it and try to push to cloud
      console.warn('[Sync] No valid cloud backup, but user has local data. Pushing local data...');
      try {
        await pushUserBackup(userId);
        return 'preserved_local';
      } catch (pushError) {
        console.error('[Sync] Failed to push local backup', pushError);
        // Still preserve local data - don't delete it
        return 'preserved_local';
      }
    }
    // Only clear if there's no local data and no previous sync history
    // This protects against accidental data loss from browser cache clear
    if (!lastSync) {
      console.warn('[Sync] First time setup: no cloud backup, no local data');
      // Even on first time, don't auto-clear - just start fresh
      return 'empty';
    }
    // Had a previous sync but cloud is gone - preserve local
    console.warn('[Sync] Cloud backup disappeared but we had a sync history. Preserving local data.');
    return 'preserved_local';
  }

  if (data?.updated_at) {
    setLastSync(userId, data.updated_at);
  }

  // Now safe to restore from valid backup
  const payloadData = backup.data;
  
  // PROTECTION: Verify backup has content before clearing
  const backupContentCount = Object.values(payloadData).reduce((sum, arr) => {
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);
  
  if (backupContentCount === 0 && localDataCount > 0) {
    // Cloud backup is empty but we have local data - don't overwrite
    console.warn('[Sync] Cloud backup is empty but has local data. Pushing local...');
    await pushUserBackup(userId);
    return 'preserved_local';
  }

  // Safe to clear and restore
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

export async function importLocalBackup(backup: { data: any }): Promise<void> {
  const payloadData = backup.data;
  if (!payloadData) throw new Error('Invalid backup format');
  
  await clearLocalData();

  if (payloadData.dailyEntries?.length) await db.dailyEntries.bulkPut(payloadData.dailyEntries as never[]);
  if (payloadData.tasks?.length) await db.tasks.bulkPut(payloadData.tasks as never[]);
  if (payloadData.habits?.length) await db.habits.bulkPut(payloadData.habits as never[]);
  if (payloadData.habitLogs?.length) await db.habitLogs.bulkPut(payloadData.habitLogs as never[]);
  if (payloadData.goals?.length) await db.goals.bulkPut(payloadData.goals as never[]);
  if (payloadData.projects?.length) await db.projects.bulkPut(payloadData.projects as never[]);
  if (payloadData.projectTasks?.length) await db.projectTasks.bulkPut(payloadData.projectTasks as never[]);
  if (payloadData.journalEntries?.length) await db.journalEntries.bulkPut(payloadData.journalEntries as never[]);
  if (payloadData.weeklyReviews?.length) await db.weeklyReviews.bulkPut(payloadData.weeklyReviews as never[]);
  if (payloadData.learningSessions?.length) await db.learningSessions.bulkPut(payloadData.learningSessions as never[]);
  if (payloadData.learningTracks?.length) await db.learningTracks.bulkPut(payloadData.learningTracks as never[]);
  if (payloadData.focusSessions?.length) await db.focusSessions.bulkPut(payloadData.focusSessions as never[]);
  if (payloadData.monthlyLetters?.length) await db.monthlyLetters.bulkPut(payloadData.monthlyLetters as never[]);
  if (payloadData.annualLetters?.length) await db.annualLetters.bulkPut(payloadData.annualLetters as never[]);
  if (payloadData.settings?.length) await db.settings.bulkPut(payloadData.settings as never[]);
}

/**
 * Get current backup status for diagnostics
 */
export async function getBackupStatus(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  
  const localCount = await getLocalDataCount();
  const lastSyncTime = getLastSync(userId);
  
  try {
    const { data, error } = await supabase
      .from('user_backups')
      .select('updated_at, payload')
      .eq('user_id', userId)
      .maybeSingle<BackupRow>();
    
    if (error) throw error;
    
    const cloudBackupExists = isValidBackupPayload(data?.payload ?? null);
    const cloudDataCount = cloudBackupExists 
      ? Object.values(data!.payload!.data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
      : 0;
    
    return {
      localDataCount: localCount,
      cloudDataCount,
      cloudBackupExists,
      cloudUpdatedAt: data?.updated_at ?? null,
      lastLocalSyncTime: lastSyncTime,
      isInSync: cloudBackupExists && localCount === cloudDataCount,
      status: cloudBackupExists ? 'synced' : 'no-cloud-backup'
    };
  } catch (error) {
    console.error('[Sync] Failed to get backup status', error);
    return {
      localDataCount: localCount,
      cloudDataCount: 0,
      cloudBackupExists: false,
      cloudUpdatedAt: null,
      lastLocalSyncTime: lastSyncTime,
      isInSync: false,
      status: 'error'
    };
  }
}

/**
 * Force manual sync - pulls from cloud if available, otherwise pushes local
 */
export async function forceSyncNow(userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');
  
  try {
    console.log('[Sync] Starting forced sync...');
    const result = await syncFromCloudToLocal(userId);
    console.log('[Sync] Forced sync completed:', result);
    return result;
  } catch (error) {
    console.error('[Sync] Forced sync failed', error);
    throw error;
  }
}
