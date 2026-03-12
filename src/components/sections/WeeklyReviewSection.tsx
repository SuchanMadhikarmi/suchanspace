import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useApp } from '../../context/AppContext';
import { getMoodColor } from '../../utils/dateUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const REVIEW_QUESTIONS = [
  { key: 'highlight', label: 'What was your biggest highlight this week?', placeholder: 'A win, a beautiful moment, or something you\'re proud of...', emoji: '🌟' },
  { key: 'learned', label: 'What did you learn?', placeholder: 'An insight, skill, realization, or perspective shift...', emoji: '💡' },
  { key: 'challenge', label: 'What was most challenging?', placeholder: 'Be honest. Challenges shape us...', emoji: '🧗' },
  { key: 'gratitude', label: 'What are you grateful for?', placeholder: 'Small or large, write 3 things...', emoji: '🙏' },
  { key: 'improvement', label: 'What would you do differently?', placeholder: 'One thing to improve next week...', emoji: '🔧' },
  { key: 'nextWeekGoal', label: 'What is your main focus for next week?', placeholder: 'One clear intention for the week ahead...', emoji: '🎯' },
];

export default function WeeklyReviewSection() {
  const { showToast } = useApp();
  const [viewingWeekOffset, setViewingWeekOffset] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [rating, setRating] = useState(7);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [view, setView] = useState<'review' | 'archive'>('review');

  const currentWeekStart = useMemo(() => {
    const base = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), viewingWeekOffset);
    return base;
  }, [viewingWeekOffset]);

  const currentWeekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 1 }), [currentWeekStart]);
  const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const allReviews = useLiveQuery(() => db.weeklyReviews.orderBy('weekStartDate').reverse().toArray(), []);

  const dailyEntries = useLiveQuery(
    () => db.dailyEntries.where('date').between(format(currentWeekStart, 'yyyy-MM-dd'), format(currentWeekEnd, 'yyyy-MM-dd'), true, true).toArray(),
    [weekKey]
  );

  const journalEntries = useLiveQuery(
    () => db.journalEntries.where('date').between(format(currentWeekStart, 'yyyy-MM-dd'), format(currentWeekEnd, 'yyyy-MM-dd'), true, true).toArray(),
    [weekKey]
  );

  const weekTasks = useLiveQuery(
    () => db.tasks.where('date').between(format(currentWeekStart, 'yyyy-MM-dd'), format(currentWeekEnd, 'yyyy-MM-dd'), true, true).toArray(),
    [weekKey]
  );

  const habitLogs = useLiveQuery(async () => {
    const startStr = format(currentWeekStart, 'yyyy-MM-dd');
    const endStr = format(currentWeekEnd, 'yyyy-MM-dd');
    return db.habitLogs.where('date').between(startStr, endStr, true, true).toArray();
  }, [weekKey]);

  // Weekly chart data (mood across days)
  const moodBarData = useMemo(() => {
    const byDate: Record<string, any> = {};
    journalEntries?.forEach(e => { byDate[e.date] = e.mood; });
    return weekDays.map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const mood = byDate[key];
      const moodVal = mood === 'excellent' ? 5 : mood === 'good' ? 4 : mood === 'neutral' ? 3 : mood === 'difficult' ? 2 : mood === 'rough' ? 1 : 0;
      return { day: format(d, 'EEE'), mood: moodVal || null, fill: mood ? getMoodColor(mood) : '#E5DDD5' };
    });
  }, [journalEntries, weekDays]);

  // Stats
  const tasksCompleted = weekTasks?.filter(t => t.completed).length ?? 0;
  const totalTasks = weekTasks?.length ?? 0;
  const avgScore = useMemo(() => {
    if (!dailyEntries?.length) return 0;
    return Math.round(dailyEntries.reduce((s, e) => s + (e.dailyScore ?? 0), 0) / dailyEntries.length);
  }, [dailyEntries]);
  const habitsChecked = habitLogs?.length ?? 0;

  const handleSave = async () => {
    const existing = await db.weeklyReviews.where('weekStartDate').equals(weekKey).first();
    const reviewData = {
      weekStartDate: weekKey,
      weekEndDate: format(currentWeekEnd, 'yyyy-MM-dd'),
      rating,
      ...answers,
      tasksCompleted,
      totalTasks,
      avgDailyScore: avgScore,
      habitsCompleted: habitsChecked,
      createdAt: new Date().toISOString(),
    };
    if (existing?.id) {
      await db.weeklyReviews.update(existing.id, reviewData);
    } else {
      await db.weeklyReviews.add(reviewData as any);
    }
    showToast('Weekly review saved!', 'success');
    setSubmitted(true);
  };

  // Load existing review when it changes
  useLiveQuery(async () => {
    const r = await db.weeklyReviews.where('weekStartDate').equals(weekKey).first();
    if (r) {
      const loaded: Record<string, string> = {};
      REVIEW_QUESTIONS.forEach(q => {
        loaded[q.key] = (r as any)[q.key] ?? '';
      });
      setAnswers(loaded);
      setRating((r as any).rating ?? 7);
      setSubmitted(true);
      setQuestionIndex(0);
    } else {
      setAnswers({});
      setRating(7);
      setSubmitted(false);
      setQuestionIndex(0);
    }
  }, [weekKey]);

  const isCurrentWeek = viewingWeekOffset === 0;
  const q = REVIEW_QUESTIONS[questionIndex];

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '40px 32px' }}>
      {/* Header */}
      <div className="stagger-1" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Weekly Review</h1>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
            Reflect. Adjust. Grow.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['review', 'archive'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={view === v ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '8px 16px', fontSize: 13, textTransform: 'capitalize' }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'review' && (
        <>
          {/* Week navigation */}
          <div className="stagger-2" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setViewingWeekOffset(o => o + 1)} className="btn btn-secondary" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
                {format(currentWeekStart, 'MMM d')} – {format(currentWeekEnd, 'MMM d, yyyy')}
              </div>
              {isCurrentWeek && (
                <div style={{ fontSize: 12, color: 'var(--amber)', fontFamily: "'DM Sans', sans-serif" }}>Current Week</div>
              )}
            </div>
            <button onClick={() => setViewingWeekOffset(o => Math.max(0, o - 1))} disabled={isCurrentWeek} className="btn btn-secondary" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 4, opacity: isCurrentWeek ? 0.4 : 1 }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Week stats overview */}
          <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Tasks Done', value: `${tasksCompleted}/${totalTasks}`, color: 'var(--green)' },
              { label: 'Avg Daily Score', value: `${avgScore}%`, color: 'var(--sage)' },
              { label: 'Habit Checks', value: habitsChecked, color: 'var(--amber)' },
              { label: 'Journal Entries', value: journalEntries?.length ?? 0, color: 'var(--text)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Mood Arc (7 dots) */}
          <div className="stagger-3 card" style={{ padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Week Mood Arc</div>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodBarData} barSize={28}>
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 5]} hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}
                    formatter={(val) => [typeof val === 'number' && val ? val : '—', 'Mood']}
                  />
                  <Bar dataKey="mood" radius={[4, 4, 0, 0]} fill="var(--sage)">
                    {moodBarData.map((entry, i) => (
                      <rect key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Review questions */}
          {submitted ? (
            <div className="stagger-3 card" style={{ padding: '28px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 24 }}>✅</div>
                <div>
                  <div className="font-serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Review Complete</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>Week rated {rating}/10</div>
                </div>
                <button onClick={() => setSubmitted(false)} className="btn btn-secondary" style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 12px' }}>Edit</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {REVIEW_QUESTIONS.map(q => (
                  answers[q.key] && (
                    <div key={q.key}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
                        {q.emoji} {q.label}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.6, fontStyle: 'italic' }}>
                        {answers[q.key]}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : (
            <div className="stagger-3 card" style={{ padding: '28px', marginBottom: 20 }}>
              {/* Question progress */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {REVIEW_QUESTIONS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestionIndex(i)}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: i <= questionIndex ? 'var(--green)' : 'var(--border)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 200ms ease',
                    }}
                  />
                ))}
              </div>

              {/* Current question */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{q.emoji}</div>
                <div className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12, lineHeight: 1.35 }}>
                  {q.label}
                </div>
                <textarea
                  value={answers[q.key] ?? ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                  placeholder={q.placeholder}
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 15,
                    background: 'var(--highlight)',
                    color: 'var(--text)',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    lineHeight: 1.7,
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setQuestionIndex(i => Math.max(0, i - 1))}
                  disabled={questionIndex === 0}
                  className="btn btn-secondary"
                  style={{ opacity: questionIndex === 0 ? 0.4 : 1 }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  {questionIndex + 1} of {REVIEW_QUESTIONS.length}
                </span>
                {questionIndex < REVIEW_QUESTIONS.length - 1 ? (
                  <button onClick={() => setQuestionIndex(i => i + 1)} className="btn btn-primary">
                    Next →
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    {/* Star rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>Week rating:</span>
                      <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber)' }}>{rating}/10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                      style={{ width: 160 }}
                    />
                    <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: 4 }}>
                      Save Review ✓
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ARCHIVE VIEW */}
      {view === 'archive' && (
        <div className="stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allReviews?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
              No reviews yet. Complete your first weekly review!
            </div>
          )}
          {allReviews?.map(r => {
            const reviewRating = (r as any).rating ?? 0;
            return (
              <div key={r.id} className="card card-hover" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div className="font-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                      {format(new Date(r.weekStartDate + 'T12:00:00'), 'MMM d')} – {format(new Date(r.weekEndDate + 'T12:00:00'), 'MMM d, yyyy')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                      {r.tasksCompleted}/{r.totalTasks} tasks · avg {r.avgDailyScore}% daily score
                    </div>
                  </div>
                  {/* Star rating visual */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < Math.round(reviewRating / 2) ? 'var(--gold)' : 'none'}
                          stroke={i < Math.round(reviewRating / 2) ? 'var(--gold)' : 'var(--border)'}
                        />
                      ))}
                    </div>
                    <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>{reviewRating}/10</span>
                  </div>
                </div>
                {(r as any).highlight && (
                  <div style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.5, borderLeft: '3px solid var(--green)', paddingLeft: 12 }}>
                    🌟 {(r as any).highlight.slice(0, 120)}{(r as any).highlight.length > 120 ? '...' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
