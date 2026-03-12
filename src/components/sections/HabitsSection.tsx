import { useState, useMemo } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit } from '../../db/db';
import { useApp } from '../../context/AppContext';
import { Plus, Crown, Archive, Trash2, ChevronRight } from 'lucide-react';
import HabitHeatmap from '../common/HabitHeatmap';
import CircularProgress from '../common/CircularProgress';
import CountUp from '../common/CountUp';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import { HABIT_CATEGORIES } from '../../utils/dateUtils';

const COLORS = ['#1A3C2E', '#C4622D', '#4A7C59', '#D97706', '#C0392B', '#2563EB', '#7C3AED', '#DB2777', '#0891B2'];
const EMOJIS = ['📚', '💪', '🧘', '💧', '✍️', '🏃', '🎯', '🌅', '🎨', '🎸', '🌱', '💊', '🧠', '🔬', '🤝'];

export default function HabitsSection() {
  const { showToast } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', why: '', category: 'Health', frequency: 'daily' as const, bestTime: 'morning', color: COLORS[0], emoji: EMOJIS[0] });

  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray(), []);
  const allLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const todayLogs = useLiveQuery(() => db.habitLogs.where('date').equals(today).toArray(), [today]);

  const logsByHabit = useMemo(() => {
    const map: Record<number, Record<string, boolean>> = {};
    allLogs?.forEach(log => {
      if (!map[log.habitId]) map[log.habitId] = {};
      map[log.habitId][log.date] = log.completed;
    });
    return map;
  }, [allLogs]);

  const getStreak = (habitId: number): number => {
    const logs = logsByHabit[habitId] ?? {};
    let streak = 0;
    let d = new Date();
    while (true) {
      const key = format(d, 'yyyy-MM-dd');
      if (logs[key] === true) { streak++; d = subDays(d, 1); }
      else break;
      if (streak > 1000) break;
    }
    return streak;
  };

  const getBestStreak = (habitId: number): number => {
    const logs = logsByHabit[habitId] ?? {};
    const dates = Object.entries(logs).filter(([, v]) => v).map(([k]) => k).sort();
    if (dates.length === 0) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const cur2 = new Date(dates[i]);
      if (differenceInDays(cur2, prev) === 1) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }
    return best;
  };

  const getMonthCompletion = (habitId: number): number => {
    const logs = logsByHabit[habitId] ?? {};
    let done = 0, total = 0;
    for (let i = 0; i < 30; i++) {
      const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
      total++;
      if (logs[key] === true) done++;
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const totalHabits = habits?.length ?? 0;
  const bestStreak = Math.max(0, ...(habits?.map(h => getBestStreak(h.id!)) ?? [0]));
  const todayCompleted = todayLogs?.filter(l => l.completed).length ?? 0;
  const todayRate = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;

  // Week completion rate
  const weekRate = useMemo(() => {
    if (!habits || !allLogs || habits.length === 0) return 0;
    let done = 0, total = 0;
    for (let i = 0; i < 7; i++) {
      const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
      habits.forEach(h => {
        total++;
        const log = allLogs.find(l => l.habitId === h.id && l.date === key);
        if (log?.completed) done++;
      });
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [habits, allLogs]);

  // Sort by streak for leaderboard
  const sortedByStreak = useMemo(() =>
    [...(habits ?? [])].sort((a, b) => getStreak(b.id!) - getStreak(a.id!)),
    [habits, logsByHabit]
  );

  const handleToggleToday = async (habit: Habit) => {
    const existing = todayLogs?.find(l => l.habitId === habit.id);
    if (existing) {
      await db.habitLogs.update(existing.id!, { completed: !existing.completed });
    } else {
      await db.habitLogs.add({ habitId: habit.id!, date: today, completed: true });
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await db.habits.add({
      ...form,
      createdAt: new Date().toISOString(),
      archived: false,
    });
    setAddOpen(false);
    setStep(1);
    setForm({ name: '', why: '', category: 'Health', frequency: 'daily', bestTime: 'morning', color: COLORS[0], emoji: EMOJIS[0] });
    showToast(`✅ "${form.name}" habit created!`, 'success');
  };

  const handleArchive = async (id: number) => {
    await db.habits.update(id, { archived: true });
    showToast('Habit archived', 'info');
  };

  const handleDelete = async (id: number) => {
    await db.habits.delete(id);
    await db.habitLogs.where('habitId').equals(id).delete();
    setConfirmDelete(null);
    showToast('Habit deleted', 'info');
  };

  // Day of week analysis
  const dayAnalysis = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rates: { day: string; rate: number }[] = [];
    for (let d = 0; d < 7; d++) {
      let done = 0, total = 0;
      // Look back 12 weeks
      for (let week = 0; week < 12; week++) {
        const date = new Date();
        const dayDiff = (date.getDay() - d + 7) % 7 + week * 7;
        const key = format(subDays(date, dayDiff), 'yyyy-MM-dd');
        habits?.forEach(h => {
          total++;
          if (logsByHabit[h.id!]?.[key]) done++;
        });
      }
      rates.push({ day: dayNames[d], rate: total > 0 ? Math.round((done / total) * 100) : 0 });
    }
    return rates;
  }, [habits, logsByHabit]);

  const bestDay = dayAnalysis.reduce((best, d) => d.rate > best.rate ? d : best, { day: '', rate: 0 });
  const worstDay = dayAnalysis.reduce((worst, d) => d.rate < worst.rate ? d : worst, { day: '', rate: 100 });

  return (
    <div className="section-content" style={{ maxWidth: 920 }}>
      {/* Header */}
      <div className="stagger-1 section-head" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Habits</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
            You are what you repeatedly do — every day counts.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setAddOpen(true); setStep(1); }}>
          <Plus size={15} /> New Habit
        </button>
      </div>

      {/* HERO STATS */}
      <div className="stagger-1 rg-4-2" style={{ gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Habits', value: totalHabits },
          { label: 'Best Streak', value: bestStreak, suffix: ' days' },
          { label: "Today's Rate", value: todayRate, suffix: '%' },
          { label: "This Week's Rate", value: weekRate, suffix: '%' },
        ].map(({ label, value, suffix }) => (
          <div key={label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>
              <CountUp value={value} />{suffix}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* INSIGHTS */}
      {habits && habits.length > 0 && (
        <div className="card stagger-2" style={{ padding: '20px', marginBottom: 24, background: 'var(--highlight)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
            Insights
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <InsightItem text={`Your best day is ${bestDay.day} — ${bestDay.rate}% completion rate`} />
            <InsightItem text={`Your hardest day is ${worstDay.day} — ${worstDay.rate}% completion rate`} />
            {sortedByStreak[0] && getStreak(sortedByStreak[0].id!) > 0 && (
              <InsightItem text={`Longest current streak: ${sortedByStreak[0].name} 🔥 ${getStreak(sortedByStreak[0].id!)} days`} />
            )}
            <InsightItem text={`${totalHabits} active habits tracked — consistency is the game`} />
          </div>
        </div>
      )}

      {/* STREAK LEADERBOARD */}
      {habits && habits.length > 1 && (
        <div className="card stagger-2" style={{ padding: '20px 24px', marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
            Streak Leaderboard
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedByStreak.map((habit, idx) => {
              const streak = getStreak(habit.id!);
              const pct = bestStreak > 0 ? (streak / bestStreak) * 100 : 0;
              return (
                <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 24, textAlign: 'center' }}>
                    {idx === 0 ? <Crown size={14} color="var(--gold)" /> : (
                      <span className="font-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{idx + 1}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 16 }}>{habit.emoji}</span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{habit.name}</span>
                  <div style={{ width: 120, position: 'relative' }}>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: habit.color }} />
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: streak > 0 ? habit.color : 'var(--muted)', width: 52, textAlign: 'right' }}>
                    🔥 {streak}d
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HABIT CARDS */}
      <div className="stagger-3 rg-2" style={{ gap: 20 }}>
        {habits?.map(habit => {
          const logs = logsByHabit[habit.id!] ?? {};
          const streak = getStreak(habit.id!);
          const monthPct = getMonthCompletion(habit.id!);
          const todayLog = todayLogs?.find(l => l.habitId === habit.id);
          const doneToday = todayLog?.completed ?? false;

          return (
            <div key={habit.id} className="card card-hover" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: habit.color + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {habit.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                      {habit.name}
                    </h3>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 99,
                        fontSize: 11,
                        background: habit.color + '22',
                        color: habit.color,
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {habit.category}
                    </span>
                  </div>
                  {habit.why && (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--muted)',
                        fontStyle: 'italic',
                        marginTop: 3,
                        fontFamily: "'Playfair Display', Georgia, serif",
                        lineHeight: 1.4,
                      }}
                    >
                      {habit.why}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <CircularProgress value={monthPct} size={60} color={habit.color} sublabel="30d" />
                <div>
                  <div className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: habit.color, lineHeight: 1 }}>
                    🔥 {streak}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>day streak</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>best: {getBestStreak(habit.id!)}d</div>
                </div>
              </div>

              {/* Heatmap */}
              <div style={{ marginBottom: 14 }}>
                <HabitHeatmap logs={logs} days={63} mini={true} />
              </div>

              {/* Complete today button */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => handleToggleToday(habit)}
                  className={doneToday ? 'habit-checked' : ''}
                  style={{
                    flex: 1,
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: doneToday ? habit.color : 'var(--bg)',
                    color: doneToday ? 'white' : 'var(--text)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    transition: 'all 200ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    border2: `1.5px solid ${doneToday ? habit.color : 'var(--border)'}`,
                  } as React.CSSProperties}
                >
                  {doneToday ? (
                    <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Done today</>
                  ) : (
                    <>Mark complete</>
                  )}
                </button>
                <button
                  onClick={() => handleArchive(habit.id!)}
                  title="Archive"
                  style={{ padding: '9px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
                >
                  <Archive size={14} />
                </button>
                <button
                  onClick={() => setConfirmDelete(habit.id!)}
                  title="Delete"
                  style={{ padding: '9px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', transition: 'color 150ms ease' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {habits?.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: 'var(--muted)',
            background: 'var(--highlight)',
            borderRadius: 20,
            marginTop: 16,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <h3 className="font-serif" style={{ fontSize: 24, color: 'var(--text)', marginBottom: 8 }}>Start your first habit</h3>
          <p style={{ fontSize: 15, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
            The compound effect of daily habits is the most powerful force in personal growth. Start with one.
          </p>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add Your First Habit
          </button>
        </div>
      )}

      {/* ADD HABIT MODAL — Multi-step */}
      <Modal
        isOpen={addOpen}
        onClose={() => { setAddOpen(false); setStep(1); }}
        title={`New Habit — Step ${step} of 4`}
        width={520}
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>
            )}
            <div style={{ flex: 1 }} />
            {step < 4 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !form.name.trim()}
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.name.trim()}>
                Create Habit
              </button>
            )}
          </div>
        }
      >
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 className="font-serif" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>
                What habit do you want to build?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
                Choose something specific and achievable daily.
              </p>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Morning Reading, Daily Exercise, Meditation..."
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 15, background: 'var(--bg)', color: 'var(--text)' }}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {HABIT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 99,
                      border: `1.5px solid ${form.category === cat ? 'var(--green)' : 'var(--border)'}`,
                      background: form.category === cat ? 'var(--green)' : 'transparent',
                      color: form.category === cat ? 'white' : 'var(--text)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 150ms ease',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Pick an emoji</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setForm(f => ({ ...f, emoji: e }))}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: `2px solid ${form.emoji === e ? 'var(--green)' : 'transparent'}`,
                      background: form.emoji === e ? 'var(--highlight)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 18,
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 className="font-serif" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
              Why does this matter to you?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
              This is your emotional anchor. When motivation fades, this "why" keeps you going.
            </p>
            <textarea
              value={form.why}
              onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
              placeholder="Be honest and specific — what will your life look like if you build this habit?"
              rows={5}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                fontSize: 15,
                background: 'var(--highlight)',
                color: 'var(--text)',
                fontFamily: "'Playfair Display', Georgia, serif",
                lineHeight: 1.7,
                resize: 'none',
              }}
              autoFocus
            />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 className="font-serif" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
              When will you do it?
            </h3>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Frequency</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['daily', 'weekdays', 'weekends'].map(f => (
                  <button
                    key={f}
                    onClick={() => setForm(fm => ({ ...fm, frequency: f as typeof fm.frequency }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: `1.5px solid ${form.frequency === f ? 'var(--green)' : 'var(--border)'}`,
                      background: form.frequency === f ? 'var(--green)' : 'transparent',
                      color: form.frequency === f ? 'white' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 150ms ease',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Best time of day</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['morning', 'afternoon', 'evening', 'anytime'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(fm => ({ ...fm, bestTime: t }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: `1.5px solid ${form.bestTime === t ? 'var(--green)' : 'var(--border)'}`,
                      background: form.bestTime === t ? 'var(--green)' : 'transparent',
                      color: form.bestTime === t ? 'white' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 150ms ease',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 className="font-serif" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
              Choose your color
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
              This color will represent your habit across the app.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm(f => ({ ...f, color }))}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: color,
                    border: form.color === color ? '3px solid var(--text)' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: form.color === color ? '2px solid white' : 'none',
                    outlineOffset: -4,
                    transition: 'all 150ms ease',
                  }}
                />
              ))}
            </div>

            {/* Preview */}
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 14,
                padding: '20px',
                border: '1.5px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: form.color + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {form.emoji}
                </div>
                <div>
                  <div className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{form.name || 'Your Habit'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>
                    {form.why || 'Your why...'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 99,
                      fontSize: 12,
                      background: form.color + '22',
                      color: form.color,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {form.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Delete habit"
        message="This will permanently delete this habit and all its history. This cannot be undone."
        confirmLabel="Delete forever"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function InsightItem({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: 'var(--white)',
        borderRadius: 10,
        fontSize: 13,
        color: 'var(--text)',
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.4,
        border: '1px solid var(--border)',
      }}
    >
      {text}
    </div>
  );
}
