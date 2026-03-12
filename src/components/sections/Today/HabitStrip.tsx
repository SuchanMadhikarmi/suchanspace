import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit } from '../../../db/db';
import { useApp } from '../../../context/AppContext';
import confetti from 'canvas-confetti';

interface HabitStripProps {
  date: string;
}

export default function HabitStrip({ date }: HabitStripProps) {
  const { showToast } = useApp();
  const [animating, setAnimating] = useState<number | null>(null);

  const habits = useLiveQuery(
    () => db.habits.where('archived').equals(0).toArray(),
    []
  );

  const logs = useLiveQuery(
    () => db.habitLogs.where('date').equals(date).toArray(),
    [date]
  );

  if (!habits || !logs) return null;

  const logMap = new Map(logs.map(l => [l.habitId, l]));

  const handleToggle = async (habit: Habit) => {
    if (!habit.id) return;
    const existing = logMap.get(habit.id);
    setAnimating(habit.id);
    setTimeout(() => setAnimating(null), 400);

    if (existing) {
      await db.habitLogs.update(existing.id!, { completed: !existing.completed });
      if (!existing.completed) {
        // Check if all done
        const allLogs = await db.habitLogs.where('date').equals(date).toArray();
        const allDone = habits.filter(h => !h.archived).every(h =>
          allLogs.some(l => l.habitId === h.id && l.completed)
        );
        if (allDone) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          showToast('🔥 All habits complete! Incredible!', 'success');
        }
      }
    } else {
      await db.habitLogs.add({ habitId: habit.id, date, completed: true });
    }
  };

  const allCompleted = habits.filter(h => !h.archived).every(h =>
    logMap.get(h.id!)?.completed
  );

  return (
    <div>
      {allCompleted && habits.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, var(--green), var(--sage))',
            color: 'white',
            borderRadius: 12,
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          🎉 All habits complete today!
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {habits.filter(h => !h.archived).map(habit => {
          const log = logMap.get(habit.id!);
          const done = log?.completed;
          const isAnimating = animating === habit.id;

          return (
            <button
              key={habit.id}
              onClick={() => handleToggle(habit)}
              className={isAnimating ? 'habit-checked' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 99,
                border: done ? 'none' : '1.5px solid var(--border)',
                background: done ? habit.color : 'var(--bg)',
                color: done ? 'white' : 'var(--text)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              <span>{habit.emoji}</span>
              <span>{habit.name}</span>
              {done && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
        {habits.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 14, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>
            No habits yet — go to Habits to add some.
          </div>
        )}
      </div>
    </div>
  );
}
