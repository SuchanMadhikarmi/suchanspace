import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  getGreeting, getDailyQuote, formatDateBeautiful, isEveningTime,
  calculateDailyScore, getDayOfYear, getYearProgress, getDaysRemainingInYear, formatBSDate,
} from '../../utils/dateUtils';
import TaskList from './Today/TaskList';
import HabitStrip from './Today/HabitStrip';
import FocusTimer from './Today/FocusTimer';
import CircularProgress from '../common/CircularProgress';
import YearGrid from '../common/YearGrid';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ENERGY_COLORS = ['#E5DDD5', '#7BAD7B', '#D97706', '#C4622D', '#1A3C2E'];

export default function TodaySection() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showYearGrid, setShowYearGrid] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const settings = useLiveQuery(() => db.settings.toArray());
  const name = (settings?.find(s => s.name_val === 'name')?.['name'] as string) || 'there';

  const dailyEntry = useLiveQuery(() => db.dailyEntries.where('date').equals(today).first(), [today]);
  const tasks = useLiveQuery(() => db.tasks.where('date').equals(today).toArray(), [today]);
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.where('date').equals(today).toArray(), [today]);
  const journalEntry = useLiveQuery(() => db.journalEntries.where('date').equals(today).first(), [today]);
  const focusSessions = useLiveQuery(() => db.focusSessions.where('date').equals(today).toArray(), [today]);
  const allDailyEntries = useLiveQuery(() => db.dailyEntries.toArray(), []);

  const quote = getDailyQuote();
  const greeting = getGreeting(name);
  const dateBeautiful = formatDateBeautiful();
  const isEvening = isEveningTime();

  const completedHabits = habitLogs?.filter(l => l.completed).length ?? 0;
  const totalHabits = habits?.length ?? 0;
  const completedTasks = tasks?.filter(t => t.completed).length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const journaled = !!journalEntry;
  const focusCount = focusSessions?.length ?? 0;

  const dailyScore = calculateDailyScore({
    habitsCompleted: completedHabits,
    totalHabits,
    mitCompleted: (dailyEntry?.mitCompleted) || '',
    tasksCompleted: completedTasks,
    totalTasks,
    journaled,
  });

  // Year grid data
  const yearGridData = Object.fromEntries(
    (allDailyEntries ?? []).map(e => [e.date, { date: new Date(e.date), score: e.dailyScore }])
  );

  // Debounced save
  const saveEntry = useCallback(async (updates: Partial<typeof dailyEntry>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const existing = await db.dailyEntries.where('date').equals(today).first();
      if (existing?.id) {
        await db.dailyEntries.update(existing.id, { ...updates, dailyScore: dailyScore });
      } else {
        await db.dailyEntries.add({
          date: today,
          morningMIT: '',
          morningBlocker: '',
          morningGratitude: '',
          morningEnergy: 3,
          eveningReflection: '',
          eveningEnergy: 3,
          eveningWentWell: '',
          eveningTomorrow: '',
          mitCompleted: '',
          dailyScore: dailyScore,
          focusSessionsCount: focusCount,
          ...updates,
        });
      }
    }, 1000);
  }, [today, dailyScore, focusCount]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const dayOfYear = getDayOfYear(new Date());
  const daysRemaining = getDaysRemainingInYear(new Date());
  const yearProgress = getYearProgress(new Date());
  const bsDate = formatBSDate();

  return (
    <div className="section-content" style={{ maxWidth: 880 }}>
      {/* HERO HEADER */}
      <div className="stagger-1" style={{ marginBottom: 36 }}>
        <h1
          className="font-serif"
          style={{ fontSize: 42, fontWeight: 700, color: 'var(--text)', marginBottom: 4, lineHeight: 1.1 }}
        >
          {greeting}
        </h1>
        <div className="font-mono" style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 16 }}>
          {dateBeautiful} · {bsDate}
        </div>
        <div
          style={{
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--muted)',
            maxWidth: 560,
            lineHeight: 1.6,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          "{quote.text}" — {quote.author}
        </div>
      </div>

      {/* YEAR PROGRESS COMPACT */}
      <div
        className="card stagger-2"
        style={{ marginBottom: 24, padding: '16px 20px', cursor: 'pointer' }}
        onClick={() => setShowYearGrid(s => !s)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showYearGrid ? 16 : 0 }}>
          <div>
            <span className="font-mono" style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
              Day {dayOfYear} of 365
            </span>
            <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
              {daysRemaining} days remaining in {new Date().getFullYear()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-mono" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
              {yearProgress.toFixed(1)}%
            </span>
            {showYearGrid ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
          </div>
        </div>
        {!showYearGrid && (
          <div className="progress-bar" style={{ height: 4 }}>
            <div className="progress-bar-fill" style={{ width: `${yearProgress}%` }} />
          </div>
        )}
        {showYearGrid && (
          <div onClick={e => e.stopPropagation()}>
            <YearGrid year={new Date().getFullYear()} dayData={yearGridData} />
          </div>
        )}
      </div>

      {/* TODAY SCORE + ENERGY */}
      <div className="stagger-2 rg-3" style={{ gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <CircularProgress value={dailyScore} size={90} sublabel="Day Score" />
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>
            {dailyScore >= 70 ? '💚 Strong day' : dailyScore >= 40 ? '🟡 Building' : '🔴 Keep going'}
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 12, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Morning Energy
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1,2,3,4,5].map(dot => (
              <button
                key={dot}
                onClick={() => saveEntry({ morningEnergy: dot })}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: (dailyEntry?.morningEnergy ?? 3) >= dot ? ENERGY_COLORS[dot - 1] : 'var(--bg)',
                  border: `2px solid ${(dailyEntry?.morningEnergy ?? 3) >= dot ? ENERGY_COLORS[dot - 1] : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                title={`Energy ${dot}`}
              />
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Today's Progress
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatRow label="Habits" value={completedHabits} total={totalHabits} />
            <StatRow label="Tasks" value={completedTasks} total={totalTasks} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>Focus sessions</span>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{focusCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MORNING INTENTION */}
      <div className="card stagger-3" style={{ padding: '24px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Morning Intention
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
              What is the ONE thing that would make today a success?
            </label>
            <textarea
              value={dailyEntry?.morningMIT ?? ''}
              onChange={e => saveEntry({ morningMIT: e.target.value })}
              placeholder="My most important intention for today..."
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                fontSize: 15,
                background: 'var(--highlight)',
                color: 'var(--text)',
                fontFamily: "'Playfair Display', Georgia, serif",
                lineHeight: 1.6,
                resize: 'none',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                What might get in my way?
              </label>
              <input
                value={dailyEntry?.morningBlocker ?? ''}
                onChange={e => saveEntry({ morningBlocker: e.target.value })}
                placeholder="Potential obstacles..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 14,
                  background: 'var(--bg)',
                  color: 'var(--text)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                I am grateful for:
              </label>
              <input
                value={dailyEntry?.morningGratitude ?? ''}
                onChange={e => saveEntry({ morningGratitude: e.target.value })}
                placeholder="Three things today..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 14,
                  background: 'var(--bg)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MIT HERO (if set) */}
      {dailyEntry?.morningMIT && (
        <div
          className="stagger-3"
          style={{
            background: 'var(--green)',
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }}
          />
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', marginBottom: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            Most Important Task
          </div>
          <div
            className="font-serif"
            style={{ fontSize: 26, fontWeight: 600, color: 'white', lineHeight: 1.3, marginBottom: 16 }}
          >
            {dailyEntry.morningMIT}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['yes', 'partial', 'no'] as const).map(status => (
              <button
                key={status}
                onClick={() => saveEntry({ mitCompleted: status })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  background: dailyEntry.mitCompleted === status ? 'white' : 'rgba(255,255,255,0.12)',
                  color: dailyEntry.mitCompleted === status ? 'var(--green)' : 'rgba(255,255,255,0.8)',
                  transition: 'all 150ms ease',
                }}
              >
                {status === 'yes' ? '✓ Done' : status === 'partial' ? '◑ Partial' : '✗ Not yet'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HABITS */}
      <div className="card stagger-3" style={{ padding: '24px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Today's Habits
          {totalHabits > 0 && (
            <span className="font-mono" style={{ marginLeft: 8, color: 'var(--green)', fontWeight: 700 }}>
              {completedHabits}/{totalHabits}
            </span>
          )}
        </div>
        <HabitStrip date={today} />
      </div>

      {/* TASKS */}
      <div className="card stagger-4" style={{ padding: '24px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Today's Tasks
          {totalTasks > 0 && (
            <span className="font-mono" style={{ marginLeft: 8, color: 'var(--green)', fontWeight: 700 }}>
              {completedTasks}/{totalTasks}
            </span>
          )}
        </div>
        <TaskList date={today} />
      </div>

      {/* FOCUS TIMER */}
      <div className="card stagger-4" style={{ padding: '24px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          Focus Timer — Pomodoro
        </div>
        <FocusTimer date={today} sessionCount={focusCount} />
      </div>

      {/* EVENING REFLECTION */}
      {(isEvening || dailyEntry?.eveningReflection) && (
        <div className="card stagger-5" style={{ padding: '24px', marginBottom: 24, background: 'var(--highlight)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
            Evening Reflection 🌙
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                What went well today?
              </label>
              <textarea
                value={dailyEntry?.eveningWentWell ?? ''}
                onChange={e => saveEntry({ eveningWentWell: e.target.value })}
                placeholder="Wins, moments of flow, good decisions..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 14,
                  background: 'var(--white)',
                  color: 'var(--text)',
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.6,
                  resize: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                What will tomorrow-you thank today-you for doing?
              </label>
              <input
                value={dailyEntry?.eveningTomorrow ?? ''}
                onChange={e => saveEntry({ eveningTomorrow: e.target.value })}
                placeholder="One action that compounds positively..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 14,
                  background: 'var(--white)',
                  color: 'var(--text)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                Evening Energy
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(dot => (
                  <button
                    key={dot}
                    onClick={() => saveEntry({ eveningEnergy: dot })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: (dailyEntry?.eveningEnergy ?? 0) >= dot ? ENERGY_COLORS[dot - 1] : 'var(--bg)',
                      border: `2px solid ${(dailyEntry?.eveningEnergy ?? 0) >= dot ? ENERGY_COLORS[dot - 1] : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{value}/{total}</span>
      </div>
      <div className="progress-bar" style={{ height: 4 }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
