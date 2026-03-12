import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useApp } from '../../context/AppContext';
import { clearAllData, seedSampleData } from '../../db/sampleData';
import { calculateLifePercentage } from '../../utils/dateUtils';
import ConfirmDialog from '../common/ConfirmDialog';
import { format } from 'date-fns';

export default function SettingsSection() {
  const { showToast } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userName: '', birthdate: '' });

  const allSettings = useLiveQuery(() => db.settings.toArray(), []);
  const habitsCount = useLiveQuery(() => db.habits.count(), []);
  const tasksCount = useLiveQuery(() => db.tasks.count(), []);
  const journalCount = useLiveQuery(() => db.journalEntries.count(), []);
  const sessionsCount = useLiveQuery(() => db.learningSessions.count(), []);

  useEffect(() => {
    if (allSettings) {
      const map: Record<string, string> = {};
      allSettings.forEach(s => { if (s.name_val) map[s.name_val] = String(s.value ?? ''); });
      setForm({ userName: map.userName ?? '', birthdate: map.birthdate ?? '' });
    }
  }, [allSettings?.length]);

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

  const handleSeed = async () => {
    await seedSampleData();
    showToast('Sample data loaded!', 'success');
    setShowSeedConfirm(false);
  };

  return (
    <div className="section-content" style={{ maxWidth: 620 }}>
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

      {/* Data */}
      <div className="stagger-3 card" style={{ padding: '24px', marginBottom: 20 }}>
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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowSeedConfirm(true)} className="btn btn-secondary" style={{ fontSize: 13 }}>
            Load Sample Data
          </button>
          <button onClick={() => setShowClearConfirm(true)} className="btn btn-danger" style={{ fontSize: 13 }}>
            Clear All Data
          </button>
        </div>
      </div>

      {/* About */}
      <div className="stagger-4 card" style={{ padding: '24px' }}>
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
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>100% local · IndexedDB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Built with</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>React · Vite · Dexie.js</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: 'var(--muted)' }}>Privacy</span>
            <span style={{ color: 'var(--sage)', fontWeight: 600 }}>Nothing leaves your device</span>
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.05em' }}>
            crafted with ♥ by Suchan — {new Date().getFullYear()}
          </div>
        </div>
      </div>

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
        isOpen={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        onConfirm={handleSeed}
        title="Load Sample Data"
        message="This will add sample habits, goals, journal entries, and tasks to demonstrate the app. Your existing data will remain."
        confirmLabel="Load Sample Data"
      />
    </div>
  );
}
