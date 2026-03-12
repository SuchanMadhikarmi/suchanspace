import { useState, useEffect, useRef } from 'react';
import { format, eachDayOfInterval, isAfter, isToday } from 'date-fns';
import { getDayColor, getDayOfYear, getYearProgress, getDaysRemainingInYear } from '../../utils/dateUtils';

interface DayData {
  date: Date;
  score?: number;
  habitsCompleted?: number;
  tasksCompleted?: number;
  journaled?: boolean;
}

interface YearGridProps {
  year: number;
  dayData: Record<string, DayData>;
  compact?: boolean;
  onDayClick?: (date: string) => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function YearGrid({ year, dayData, compact = false, onDayClick }: YearGridProps) {
  const today = new Date();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [animated, setAnimated] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const dayOfYear = getDayOfYear(today);
  const yearProgress = getYearProgress(today);
  const daysRemaining = getDaysRemainingInYear(today);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (animated && progressRef.current) {
      progressRef.current.style.width = `${yearProgress}%`;
    }
  }, [animated, yearProgress]);

  // Build month grid
  const months: Array<{ name: string; days: Date[] }> = [];
  for (let m = 0; m < 12; m++) {
    const days = eachDayOfInterval({
      start: new Date(year, m, 1),
      end: new Date(year, m + 1, 0),
    });
    months.push({ name: MONTH_NAMES[m], days });
  }

  const cellSize = compact ? 6 : 8;
  const gap = compact ? 1 : 2;

  function getColor(date: Date): string {
    const key = format(date, 'yyyy-MM-dd');
    const todayDate = new Date();
    if (isAfter(date, todayDate) && !isToday(date)) return '#EDE9E3';
    const data = dayData[key];
    if (!data?.score && !isToday(date)) return '#E5DDD5';
    return getDayColor(data?.score);
  }

  function handleMouseEnter(e: React.MouseEvent, date: Date) {
    const key = format(date, 'yyyy-MM-dd');
    const data = dayData[key];
    const todayCheck = isToday(date);
    const future = isAfter(date, new Date()) && !todayCheck;

    let content = format(date, 'MMMM d');
    if (todayCheck) content += ' — Today';
    else if (future) content += ' — Future';
    else if (data) {
      const parts = [];
      if (data.habitsCompleted !== undefined) parts.push(`${data.habitsCompleted} habits`);
      if (data.tasksCompleted !== undefined) parts.push(`${data.tasksCompleted} tasks`);
      if (data.journaled) parts.push('journaled ✓');
      if (data.score !== undefined) parts.push(`score: ${data.score}`);
      if (parts.length) content += ' — ' + parts.join(', ');
      else content += ' — no data';
    } else {
      content += ' — no data';
    }

    setTooltip({ x: e.clientX, y: e.clientY, content });
  }

  const progressBars = Math.floor(yearProgress / 2.5);
  const progressBar = '█'.repeat(progressBars) + '░'.repeat(40 - progressBars);

  return (
    <div>
      {/* Year header stats */}
      {!compact && (
        <div style={{ marginBottom: 20 }}>
          <div
            className="font-mono"
            style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6, fontWeight: 500 }}
          >
            Day {dayOfYear} of 365 — {daysRemaining} days remaining
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.02em' }}
          >
            {progressBar} {yearProgress.toFixed(1)}% of {year} is gone
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div
              ref={progressRef}
              className="progress-bar-fill"
              style={{ width: 0 }}
            />
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: compact ? 4 : 8, minWidth: 'fit-content' }}>
          {months.map(({ name, days }, mIdx) => (
            <div key={mIdx}>
              {!compact && (
                <div
                  className="font-mono"
                  style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textAlign: 'center' }}
                >
                  {name}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap }}>
                {days.map((date, dIdx) => {
                  const key = format(date, 'yyyy-MM-dd');
                  const isT = isToday(date);
                  return (
                    <div
                      key={dIdx}
                      className={`year-grid-day ${isT ? 'today-pulse' : ''}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        background: getColor(date),
                        border: isT ? `1.5px solid var(--amber)` : 'none',
                        opacity: animated ? 1 : 0,
                        transition: `opacity 150ms ease ${mIdx * 20}ms, transform 100ms ease`,
                        cursor: onDayClick ? 'pointer' : 'default',
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, date)}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => onDayClick?.(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y - 32,
            background: 'var(--text)',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: 7,
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            pointerEvents: 'none',
            zIndex: 9000,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

// Legend component
export function YearGridLegend() {
  const colors = [
    { color: '#E5DDD5', label: 'No data' },
    { color: '#C8DAC8', label: 'Low' },
    { color: '#7BAD7B', label: 'Medium' },
    { color: '#4A7C59', label: 'Good' },
    { color: '#1A3C2E', label: 'Excellent' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>Less</span>
      {colors.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</span>
        </div>
      ))}
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>More</span>
    </div>
  );
}
