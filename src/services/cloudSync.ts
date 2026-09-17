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
    events: unknown[];
    categories: unknown[];
    notes: unknown[];
    folders: unknown[];
    tags: unknown[];
    templates: unknown[];
    notifications: unknown[];
    trades: unknown[];
    holdings: unknown[];
    dividends: unknown[];
    ipoApplications: unknown[];
    incomeEntries: unknown[];
    incomeStreams: unknown[];
    expenses: unknown[];
    expenseCategories: unknown[];
    recurringExpenses: unknown[];
    netWorthSnapshots: unknown[];
    savingsGoals: unknown[];
    assets: unknown[];
    liabilities: unknown[];
  };
};

const SYNC_PREFIX = 'cloud:lastSyncAt:';

type TableName = keyof BackupPayload['data'];
type DbTable = {
  clear(): Promise<void>;
  count(): Promise<number>;
  toArray(): Promise<unknown[]>;
  bulkPut(items: unknown[]): Promise<unknown>;
  destroy?: never;
};

function asDbTable(table: unknown): DbTable {
  return table as DbTable;
}

const BACKUP_TABLES: Partial<Record<TableName, DbTable>> = {
  dailyEntries: asDbTable(db.dailyEntries),
  tasks: asDbTable(db.tasks),
  habits: asDbTable(db.habits),
  habitLogs: asDbTable(db.habitLogs),
  goals: asDbTable(db.goals),
  projects: asDbTable(db.projects),
  projectTasks: asDbTable(db.projectTasks),
  journalEntries: asDbTable(db.journalEntries),
  weeklyReviews: asDbTable(db.weeklyReviews),
  learningSessions: asDbTable(db.learningSessions),
  learningTracks: asDbTable(db.learningTracks),
  focusSessions: asDbTable(db.focusSessions),
  monthlyLetters: asDbTable(db.monthlyLetters),
  annualLetters: asDbTable(db.annualLetters),
  settings: asDbTable(db.settings),
  events: asDbTable(db.events),
  categories: asDbTable(db.categories),
  notes: asDbTable(db.notes),
  folders: asDbTable(db.folders),
  tags: asDbTable(db.tags),
  templates: asDbTable(db.templates),
  notifications: asDbTable(db.notifications),
  trades: asDbTable(db.trades),
  holdings: asDbTable(db.holdings),
  dividends: asDbTable(db.dividends),
  ipoApplications: asDbTable(db.ipoApplications),
  incomeEntries: asDbTable(db.incomeEntries),
  incomeStreams: asDbTable(db.incomeStreams),
  expenses: asDbTable(db.expenses),
  expenseCategories: asDbTable(db.expenseCategories),
  recurringExpenses: asDbTable(db.recurringExpenses),
  netWorthSnapshots: asDbTable(db.netWorthSnapshots),
  savingsGoals: asDbTable(db.savingsGoals),
  assets: asDbTable(db.assets),
  liabilities: asDbTable(db.liabilities),
};

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
    
    const payloadData = data.payload;
    await restoreFromPayload(payloadData);
    
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

export async function serializeLocalData(): Promise<BackupPayload> {
  const entries = Object.entries(BACKUP_TABLES) as [TableName, DbTable][];
  const rows = await Promise.all(entries.map(([, table]) => table.toArray()));
  const data = {} as BackupPayload['data'];
  entries.forEach(([name], i) => {
    (data as Record<TableName, unknown[]>)[name] = rows[i];
  });
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Restore a payload into local DB. Only clears + writes tables that the payload
 * actually contains, so a legacy backup (missing newer tables) never wipes data.
 */
async function restoreFromPayload(payload: BackupPayload): Promise<void> {
  const entries = Object.entries(BACKUP_TABLES) as [TableName, DbTable][];
  const present = entries.filter(([name]) => Array.isArray(payload.data[name]));
  await db.transaction('rw', present.map(([, t]) => t) as never, async () => {
    for (const [name, table] of present) {
      await table.clear();
      const rows = payload.data[name];
      if (rows.length) await table.bulkPut(rows);
    }
  });
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
  const tables = Object.values(BACKUP_TABLES).filter((t): t is DbTable => Boolean(t));
  const counts = await Promise.all(tables.map(t => t.count()));
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

  // Safe to clear and restore only the tables present in the backup
  await restoreFromPayload(backup);

  return 'restored';
}

export async function importLocalBackup(backup: BackupPayload): Promise<void> {
  if (!backup?.data || !isValidBackupPayload(backup)) throw new Error('Invalid backup format');
  await restoreFromPayload(backup);
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
