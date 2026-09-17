import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { clearAllData } from '../../db/sampleData';
import { calculateLifePercentage } from '../../utils/dateUtils';
import ConfirmDialog from '../common/ConfirmDialog';
import { format } from 'date-fns';
import { getLastSync, serializeLocalData, importLocalBackup, getBackupStatus, forceSyncNow, getBackupHistory, attemptDataRecovery } from '../../services/cloudSync';
import { requestNotificationPermission } from '../../services/notificationService';
import { isCurrentUserAdmin, listAccessRequests, setAccessRequestStatus, type AccessRequestRow } from '../../services/accessApproval';

export default function SettingsSection() {
  const { showToast } = useApp();
  const { user, signOut } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<AccessRequestRow[]>([]);
  const [form, setForm] = useState({ userName: '', birthdate: '' });
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [loadingBackupStatus, setLoadingBackupStatus] = useState(false);
  const [backupHistory, setBackupHistory] = useState<Array<any>>([]);
  const [showHistoryExpanded, setShowHistoryExpanded] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);

  const allSettings = useLiveQuery(() => db.settings.toArray(), []);
  const habitsCount = useLiveQuery(() => db.habits.count(), []);
  const tasksCount = useLiveQuery(() => db.tasks.count(), []);
  const journalCount = useLiveQuery(() => db.journalEntries.count(), []);
  const sessionsCount = useLiveQuery(() => db.learningSessions.count(), []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);


  useEffect(() => {
    if (allSettings) {
      const map: Record<string, string> = {};
      allSettings.forEach(s => { if (s.name_val) map[s.name_val] = String(s.value ?? ''); });
      setForm({ userName: map.userName ?? '', birthdate: map.birthdate ?? '' });
    }
  }, [allSettings?.length]);

  useEffect(() => {
    if (!user?.id) {
      setLastSync(null);
      setBackupStatus(null);
      setBackupHistory([]);
      return;
    }
    setLastSync(getLastSync(user.id));
    
    // Load backup status and history
    setLoadingBackupStatus(true);
    Promise.all([
      getBackupStatus(user.id),
      new Promise(resolve => {
        const history = getBackupHistory(user.id);
        setBackupHistory(history);
        resolve(history);
      })
    ])
      .then(([status]) => setBackupStatus(status))
      .catch(err => {
        console.error('Failed to get backup status', err);
        setBackupStatus(null);
      })
      .finally(() => setLoadingBackupStatus(false));
  }, [user?.id]);

  const loadPendingRequests = async () => {
    if (!user?.id) return;
    setAdminLoading(true);
    try {
      const admin = await isCurrentUserAdmin(user.id);
      setIsAdmin(admin);
      if (!admin) {
        setPendingRequests([]);
        return;
      }
      const pending = await listAccessRequests('pending');
      setPendingRequests(pending);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, [user?.id]);

  const save = async () => {
    setSaving(true);
    await db.settings.put({ name_val: 'userName', value: form.userName });
    await db.settings.put({ name_val: 'birthdate', value: form.birthdate });
    setSaving(false);
    showToast('Settings saved!', 'success');
  };

  const lifePercent = form.birthdate ? calculateLifePercentage(form.birthdate) : null;

  const handleClear = async () => {
    await clearAllData();
    showToast('All data cleared.', 'success');
    setShowClearConfirm(false);
  };

  const handleExport = async () => {
    try {
      const data = await serializeLocalData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suchanspace-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data exported successfully', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export data', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data || !backup.version) throw new Error('Invalid backup format');
      // Prompt user specifically? In this case, we have a note. Replace directly
      await importLocalBackup(backup);
      showToast('Data imported successfully!', 'success');
      // Reload UI or depend on live queries
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      showToast('Failed to import data', 'error');
    }
  };

  const handleSyncNow = async () => {
    if (!user?.id) return;
    setSyncing(true);
    try {
      const result = await forceSyncNow(user.id);
      const now = new Date().toISOString();
      setLastSync(now);
      
      // Reload backup status
      const status = await getBackupStatus(user.id);
      setBackupStatus(status);
      
      const messages: Record<string, string> = {
        'restored': 'Cloud data restored successfully.',
        'pushed_local': 'Local data pushed to cloud.',
        'preserved_local': 'Local data preserved and synced.',
        'empty': 'Cloud backup created.'
      };
      showToast(messages[result] || 'Cloud sync completed.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Cloud sync failed. Check Supabase setup.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out successfully.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to sign out.', 'error');
    }
  };

  const handleDecision = async (requestUserId: string, status: 'approved' | 'denied') => {
    const ok = await setAccessRequestStatus(requestUserId, status);
    if (ok) {
      showToast(status === 'approved' ? 'User approved.' : 'User denied.', 'success');
      await loadPendingRequests();
    } else {
      showToast('Failed to update request.', 'error');
    }
  };

  const handleRecoverData = async () => {
    if (!user?.id) return;
    setRecovering(true);
    try {
      const recovered = await attemptDataRecovery(user.id);
      if (recovered) {
        showToast('Data recovered successfully from cloud!', 'success');
        setShowRecoveryConfirm(false);
        // Reload to reflect recovered data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('No valid cloud backup found to recover from.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to recover data. Check your connection.', 'error');
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div className="section-content" style={{ maxWidth: 1200 }}>
      <div className="stagger-1">
        <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>Customize your SuchanSpace experience</p>
      </div>

      {/* Profile */}
      <div className="stagger-2 card" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Profile
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Your Name</label>
            <input
              value={form.userName}
              onChange={e => setForm(f => ({ ...f, userName: e.target.value }))}
              placeholder="Your first name"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 15, background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Birthdate</label>
            <input
              type="date"
              value={form.birthdate}
              onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))}
              max={format(new Date(), 'yyyy-MM-dd')}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          {/* Life percentage widget */}
          {lifePercent !== null && (
            <div style={{ padding: '16px', background: 'var(--highlight)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                Life Progress (80yr estimate)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span className="font-mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--green)' }}>
                  {lifePercent.percentage.toFixed(1)}%
                </span>
                <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>of your journey</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${lifePercent.percentage}%` }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
                {100 - lifePercent.percentage > 0 ? `${(100 - lifePercent.percentage).toFixed(1)}% of adventure still ahead` : ''}
              </div>
            </div>
          )}

          <button onClick={save} disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="stagger-3 card" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Notifications & Reminders
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
          Enable push notifications and desktop reminders to make sure you never miss a daily MIT or important habit log.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg)', borderRadius: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Desktop Notifications</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Status: <span style={{ fontWeight: 600, color: notificationStatus === 'granted' ? 'var(--green)' : 'inherit' }}>{notificationStatus}</span></div>
          </div>
          <button 
            className={`btn ${notificationStatus === 'granted' ? 'btn-secondary' : 'btn-primary'}`} 
            style={{ fontSize: 13 }}
            onClick={async () => {
              const granted = await requestNotificationPermission();
              setNotificationStatus(granted ? 'granted' : 'denied');
              if (granted) showToast('Notifications enabled!', 'success');
            }}
            disabled={notificationStatus === 'granted' || notificationStatus === 'denied'}
          >
            {notificationStatus === 'granted' ? 'Enabled' : notificationStatus === 'denied' ? 'Blocked' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="stagger-4 card" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Your Data
        </div>
        <div className="rg-4-2" style={{ gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Habits', value: habitsCount ?? 0 },
            { label: 'Tasks', value: tasksCount ?? 0 },
            { label: 'Journal', value: journalCount ?? 0 },
            { label: 'Sessions', value: sessionsCount ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg)', borderRadius: 10 }}>
              <div className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
          Export your local data as a JSON file, or restore from a previous JSON backup. Warning: importing a backup will overwrite your current local data.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleExport} className="btn btn-secondary" style={{ fontSize: 13 }}>
            Export JSON
          </button>
          
          <label className="btn btn-secondary" style={{ fontSize: 13, cursor: 'pointer', margin: 0 }}>
            Import JSON
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImport}
            />
          </label>

          <button onClick={() => setShowClearConfirm(true)} className="btn btn-danger" style={{ fontSize: 13 }}>
            Clear All Data
          </button>
        </div>
      </div>

      {/* Backup Diagnostics */}
      <div className="stagger-4 card" style={{ padding: '24px', marginBottom: 20, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Backup Diagnostics
        </div>
        
        {loadingBackupStatus ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: '20px' }}>
            Loading backup status...
          </div>
        ) : backupStatus ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Local Data</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{backupStatus.localDataCount}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>items</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cloud Backup</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: backupStatus.cloudBackupExists ? 'var(--green)' : 'var(--orange)' }}>
                  {backupStatus.cloudDataCount}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>items</div>
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: backupStatus.isInSync ? 'var(--green)' : (backupStatus.cloudBackupExists ? 'var(--orange)' : 'var(--sage)')
              }}>
                {backupStatus.isInSync ? '✓ In Sync' : (backupStatus.cloudBackupExists ? '⚠ Out of Sync' : '• No Cloud Backup')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {backupStatus.isInSync 
                  ? 'Local and cloud data match'
                  : (backupStatus.cloudBackupExists
                    ? 'Cloud data differs from local'
                    : 'No backup in cloud yet'
                  )
                }
              </div>
            </div>

            {backupStatus.lastLocalSyncTime && (
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Sync</div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                  {format(new Date(backupStatus.lastLocalSyncTime), 'PPpp')}
                </div>
              </div>
            )}

            {backupStatus.cloudUpdatedAt && (
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cloud Last Updated</div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                  {format(new Date(backupStatus.cloudUpdatedAt), 'PPpp')}
                </div>
              </div>
            )}

            {/* Backup History */}
            {backupHistory.length > 0 && (
              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setShowHistoryExpanded(!showHistoryExpanded)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--sage)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  {showHistoryExpanded ? '▼' : '▶'} Backup History ({backupHistory.length} attempts)
                </button>

                {showHistoryExpanded && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {backupHistory.slice().reverse().map((attempt, idx) => (
                      <div key={idx} style={{ padding: '10px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{
                            fontWeight: 600,
                            color: attempt.status === 'success' ? 'var(--green)' : 'var(--danger)'
                          }}>
                            {attempt.status === 'success' ? '✓' : '✗'} {attempt.itemCount} items
                          </span>
                          <span style={{ color: 'var(--muted)', fontSize: 10 }}>
                            {format(new Date(attempt.timestamp), 'pp')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ fontSize: 11, color: 'var(--muted)', padding: '12px', background: 'var(--highlight)', borderRadius: 8, border: '1px solid var(--border)', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
              💡 <strong>Tip:</strong> Click "Sync Now" to synchronize your local data with the cloud. If your data was lost, use the JSON import to restore from a previous backup file.
            </div>

            {/* Recovery Option */}
            <button
              onClick={() => setShowRecoveryConfirm(true)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--orange)',
                background: 'transparent',
                border: '1px solid var(--orange)',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              🔄 Recover Data from Cloud
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
            Unable to load backup status. Check your internet connection.
          </div>
        )}
      </div>

      {/* Account & Cloud */}
      <div className="stagger-4 card" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Account &amp; Cloud
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Signed in as</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{user?.email ?? 'Unknown user'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Last cloud sync</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{lastSync ? format(new Date(lastSync), 'PPpp') : 'Never'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleSyncNow} className="btn btn-secondary" disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button onClick={handleSignOut} className="btn btn-danger">
            Sign Out
          </button>
        </div>
      </div>

      {/* About */}
      <div className="stagger-5 card" style={{ padding: '24px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          About
        </div>

        {/* Branding block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: 'var(--highlight)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 24 }}>🌱</span>
          </div>
          <div>
            <div className="font-serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>SuchanSpace</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Your personal life operating system</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Designed &amp; built by</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Suchan</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Version</span>
            <span className="font-mono" style={{ color: 'var(--text)', fontSize: 12 }}>v1.0.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Data storage</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>IndexedDB + Supabase Cloud Sync</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Built with</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>React · Vite · Dexie.js · Supabase</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Privacy</span>
            <span style={{ color: 'var(--sage)', fontWeight: 600 }}>Data stays tied to your account</span>
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.05em' }}>
            crafted with ♥ by Suchan — {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="stagger-5 card" style={{ padding: '24px', marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
              Admin · Account Approvals
            </div>
            <button onClick={loadPendingRequests} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }}>
              Refresh
            </button>
          </div>

          {adminLoading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Loading requests...</div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>No pending requests.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingRequests.map(req => (
                <div key={req.user_id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px' }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                    <strong>{req.email ?? 'Unknown email'}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
                    Requested: {format(new Date(req.requested_at), 'PPpp')}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleDecision(req.user_id, 'approved')} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 10px' }}>
                      Approve
                    </button>
                    <button onClick={() => handleDecision(req.user_id, 'denied')} className="btn btn-danger" style={{ fontSize: 12, padding: '6px 10px' }}>
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear All Data"
        message="This will permanently delete all your habits, goals, journal entries, tasks, and everything else. This cannot be undone."
        confirmLabel="Yes, Clear Everything"
        danger
      />

      <ConfirmDialog
        isOpen={showRecoveryConfirm}
        onClose={() => setShowRecoveryConfirm(false)}
        onConfirm={handleRecoverData}
        title="Recover Data from Cloud"
        message="This will restore your local data from the latest cloud backup. Your current local data will be replaced. This is useful if your data was accidentally lost or deleted."
        confirmLabel={recovering ? 'Recovering...' : 'Yes, Recover Data'}
        danger={false}
      />
    </div>
  );
}
