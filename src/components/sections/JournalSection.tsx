import { useState, useEffect, useRef, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JournalEntry, type MoodType } from '../../db/db';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getMoodColor, getMoodEmoji, getMoodLabel } from '../../utils/dateUtils';
import { Maximize2, Minimize2 } from 'lucide-react';

const MOODS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'excellent', label: 'Excellent', emoji: '✨' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'difficult', label: 'Difficult', emoji: '😔' },
  { value: 'rough', label: 'Rough', emoji: '😞' },
];

const MOOD_VALUES: Record<MoodType, number> = {
  excellent: 5, good: 4, neutral: 3, difficult: 2, rough: 1,
};

export default function JournalSection() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [focusMode, setFocusMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [view, setView] = useState<'editor' | 'calendar' | 'insights'>('editor');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const entry = useLiveQuery(
    () => db.journalEntries.where('date').equals(selectedDate).first(),
    [selectedDate]
  );
  const allEntries = useLiveQuery(() => db.journalEntries.orderBy('date').reverse().toArray(), []);

  const [form, setForm] = useState({ mood: 'good' as MoodType, energy: 3, tags: [] as string[], body: '' });

  useEffect(() => {
    if (entry) {
      setForm({ mood: entry.mood, energy: entry.energy, tags: entry.tags ?? [], body: entry.body });
    } else {
      setForm({ mood: 'good', energy: 3, tags: [], body: '' });
    }
  }, [entry?.id, selectedDate]);

  const autoSave = (updates: Partial<typeof form>) => {
    const merged = { ...form, ...updates };
    setForm(prev => ({ ...prev, ...updates }));
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const wordCount = merged.body.trim().split(/\s+/).filter(Boolean).length;
      const existing = await db.journalEntries.where('date').equals(selectedDate).first();
      if (existing?.id) {
        await db.journalEntries.update(existing.id, { ...merged, wordCount, updatedAt: new Date().toISOString() });
      } else if (merged.body.trim()) {
        await db.journalEntries.add({
          date: selectedDate,
          ...merged,
          wordCount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || form.tags.includes(tag)) return;
    const newTags = [...form.tags, tag];
    setTagInput('');
    autoSave({ tags: newTags });
  };

  const removeTag = (tag: string) => autoSave({ tags: form.tags.filter(t => t !== tag) });

  // Calendar view data
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const entryByDate = useMemo(() => {
    const map: Record<string, JournalEntry> = {};
    allEntries?.forEach(e => { map[e.date] = e; });
    return map;
  }, [allEntries]);

  // 30-day mood chart data
  const moodChartData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const e = entryByDate[date];
      data.push({
        date: format(subDays(new Date(), i), 'MMM d'),
        mood: e ? MOOD_VALUES[e.mood] : null,
        energy: e ? e.energy : null,
      });
    }
    return data;
  }, [entryByDate]);

  // Writing streak
  const writingStreak = useMemo(() => {
    let streak = 0;
    let d = new Date();
    while (streak < 365) {
      const key = format(d, 'yyyy-MM-dd');
      if (entryByDate[key]) { streak++; d = subDays(d, 1); }
      else break;
    }
    return streak;
  }, [entryByDate]);

  const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length;

  // On this day last year
  const oneYearAgoDate = format(subDays(new Date(), 365), 'yyyy-MM-dd');
  const oneYearAgoEntry = entryByDate[oneYearAgoDate];

  // All unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allEntries?.forEach(e => e.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [allEntries]);

  if (focusMode) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0A0A0A', zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="font-serif" style={{ fontSize: 24, color: 'rgba(255,255,255,0.9)' }}>
              {format(new Date(selectedDate), 'EEEE, MMMM d')}
            </div>
            <button
              onClick={() => setFocusMode(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Minimize2 size={14} /> Exit
            </button>
          </div>
          <textarea
            ref={bodyRef}
            value={form.body}
            onChange={e => autoSave({ body: e.target.value })}
            placeholder="Write freely..."
            style={{
              width: '100%',
              minHeight: '60vh',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 18,
              lineHeight: 1.9,
              resize: 'none',
              outline: 'none',
              padding: 0,
            }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="font-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {wordCount} words
            </span>
            <span style={{ fontSize: 12, color: saveStatus === 'saved' ? 'var(--sage)' : 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif" }}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : ''}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 32px' }}>
      {/* Header */}
      <div className="stagger-1" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Journal</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {writingStreak > 0 && (
              <span style={{ fontSize: 15, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                📝 <strong>{writingStreak}</strong> day writing streak
              </span>
            )}
            <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
              {allEntries?.length ?? 0} total entries
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['editor', 'calendar', 'insights'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={view === v ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '8px 16px', fontSize: 13, textTransform: 'capitalize' }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'editor' && (
        <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          {/* Main editor */}
          <div>
            {/* Date header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <h2 className="font-serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d')}
              </h2>
              <button
                onClick={() => setFocusMode(true)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
              >
                <Maximize2 size={12} /> Focus
              </button>
            </div>

            {/* Mood selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
                How are you feeling?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => autoSave({ mood: m.value })}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `2px solid ${form.mood === m.value ? getMoodColor(m.value) : 'var(--border)'}`,
                      background: form.mood === m.value ? getMoodColor(m.value) + '18' : 'var(--bg)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.emoji}</span>
                    <span style={{ fontSize: 10, color: form.mood === m.value ? getMoodColor(m.value) : 'var(--muted)', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>Energy</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map(e => (
                  <button
                    key={e}
                    onClick={() => autoSave({ energy: e })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: `2px solid ${form.energy >= e ? 'var(--green)' : 'var(--border)'}`,
                      background: form.energy >= e ? 'var(--green)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {form.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                      borderRadius: 99,
                      fontSize: 12,
                      background: 'var(--green)',
                      color: 'white',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    #{tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 0, display: 'flex', alignItems: 'center', lineHeight: 1, fontSize: 14 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="Add tag... (Enter)"
                  list="tag-suggestions"
                  style={{ padding: '6px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg)', color: 'var(--text)', width: 180 }}
                />
                <datalist id="tag-suggestions">
                  {allTags.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
            </div>

            {/* Body */}
            <div style={{ position: 'relative' }}>
              <textarea
                ref={bodyRef}
                value={form.body}
                onChange={e => autoSave({ body: e.target.value })}
                placeholder="Begin writing... Pour your thoughts here without judgment. This is a private space."
                rows={16}
                style={{
                  width: '100%',
                  padding: '20px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 16,
                  fontSize: 16,
                  background: 'var(--highlight)',
                  color: 'var(--text)',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  lineHeight: 1.85,
                  resize: 'vertical',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 16,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {wordCount} words
                </span>
                <span style={{ fontSize: 11, color: saveStatus === 'saved' ? 'var(--sage)' : 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  {saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? '✓ Saved' : ''}
                </span>
              </div>
            </div>

            {/* On This Day */}
            {oneYearAgoEntry && (
              <div
                style={{
                  marginTop: 20,
                  padding: '16px 20px',
                  background: 'var(--highlight)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--amber)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  On This Day · One Year Ago
                </div>
                <div style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.6 }}>
                  "{oneYearAgoEntry.body.slice(0, 200)}{oneYearAgoEntry.body.length > 200 ? '...' : ''}"
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  {getMoodEmoji(oneYearAgoEntry.mood)} {getMoodLabel(oneYearAgoEntry.mood)} · {oneYearAgoEntry.wordCount} words
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: recent entries */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
              Recent Entries
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allEntries?.slice(0, 15).map(e => (
                <button
                  key={e.id}
                  onClick={() => setSelectedDate(e.date)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: selectedDate === e.date ? `1.5px solid var(--green)` : '1.5px solid var(--border)',
                    background: selectedDate === e.date ? 'var(--highlight)' : 'var(--white)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                      {format(new Date(e.date + 'T12:00:00'), 'MMM d')}
                    </span>
                    <span style={{ fontSize: 14 }}>{getMoodEmoji(e.mood)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.body.slice(0, 50)}
                  </div>
                </button>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 10, fontSize: 13 }}
              onClick={() => setSelectedDate(today)}
            >
              Write Today's Entry
            </button>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div className="stagger-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="btn btn-secondary" style={{ padding: '8px 12px' }}>←</button>
            <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="btn btn-secondary" style={{ padding: '8px 12px' }}>→</button>
          </div>

          {/* Day of week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {/* Offset for first day */}
            {Array.from({ length: (monthDays[0].getDay() + 6) % 7 }).map((_, i) => <div key={`off-${i}`} />)}
            {monthDays.map(date => {
              const key = format(date, 'yyyy-MM-dd');
              const e = entryByDate[key];
              const isToday = key === format(new Date(), 'yyyy-MM-dd');
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  onClick={() => { setSelectedDate(key); setView('editor'); }}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 10,
                    border: isSelected ? '2px solid var(--green)' : isToday ? '2px solid var(--amber)' : 'none',
                    background: e ? getMoodColor(e.mood) + '25' : 'var(--bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    transition: 'all 150ms ease',
                    position: 'relative',
                  }}
                  title={e ? `${getMoodLabel(e.mood)} · ${e.wordCount} words` : 'No entry'}
                >
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: 'var(--text)' }}>
                    {date.getDate()}
                  </span>
                  {e && <span style={{ fontSize: 14 }}>{getMoodEmoji(e.mood)}</span>}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {MOODS.map(m => (
              <div key={m.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: getMoodColor(m.value) + '40', border: `1px solid ${getMoodColor(m.value)}` }} />
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>{m.emoji} {m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSIGHTS VIEW */}
      {view === 'insights' && (
        <div className="stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Mood chart */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
              30-Day Mood & Energy Trend
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={moodChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}
                  formatter={(val, name) => [typeof val === 'number' ? val.toFixed(1) : '—', name === 'mood' ? 'Mood' : 'Energy']}
                />
                <Line type="monotone" dataKey="mood" stroke="var(--green)" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="energy" stroke="var(--amber)" strokeWidth={2} strokeDasharray="4 2" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Entries', value: allEntries?.length ?? 0 },
              { label: 'Writing Streak', value: writingStreak, suffix: ' days' },
              { label: 'Avg Words/Entry', value: Math.round((allEntries?.reduce((s, e) => s + e.wordCount, 0) ?? 0) / Math.max(allEntries?.length ?? 1, 1)) },
            ].map(({ label, value, suffix }) => (
              <div key={label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)' }}>{value}{suffix}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Mood distribution */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
              Mood Distribution
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOODS.map(m => {
                const count = allEntries?.filter(e => e.mood === m.value).length ?? 0;
                const pct = allEntries?.length ? Math.round((count / allEntries.length) * 100) : 0;
                return (
                  <div key={m.value} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, width: 24, flexShrink: 0 }}>{m.emoji}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', width: 80, fontFamily: "'DM Sans', sans-serif" }}>{m.label}</span>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar" style={{ height: 8 }}>
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: getMoodColor(m.value) }} />
                      </div>
                    </div>
                    <span className="font-mono" style={{ fontSize: 12, color: 'var(--muted)', width: 32, textAlign: 'right' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
