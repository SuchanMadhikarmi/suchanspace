import { format, subDays, isToday } from 'date-fns';
import { getHabitDayColor } from '../../utils/dateUtils';

interface HabitHeatmapProps {
  logs: Record<string, boolean>;
  days?: number;
  mini?: boolean;
}

export default function HabitHeatmap({ logs, days = 90, mini = false }: HabitHeatmapProps) {
  const today = new Date();
  const cells: { date: Date; completed: boolean | undefined }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const key = format(date, 'yyyy-MM-dd');
    cells.push({ date, completed: logs[key] });
  }

  const size = mini ? 7 : 10;
  const gap = mini ? 1 : 2;

  if (mini) {
    // Linear strip
    return (
      <div style={{ display: 'flex', gap, flexWrap: 'wrap', maxWidth: '100%' }}>
        {cells.map(({ date, completed }, i) => (
          <div
            key={i}
            title={format(date, 'MMM d')}
            style={{
              width: size,
              height: size,
              borderRadius: 2,
              background: getHabitDayColor(completed),
              border: isToday(date) ? '1.5px solid var(--amber)' : 'none',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    );
  }

  // Weekly columns (like GitHub)
  const weeks: typeof cells[] = [];
  let currentWeek: typeof cells = [];
  cells.forEach((cell, i) => {
    currentWeek.push(cell);
    if ((i + 1) % 7 === 0 || i === cells.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div style={{ display: 'flex', gap, overflowX: 'auto' }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap }}>
          {week.map(({ date, completed }, di) => (
            <div
              key={di}
              title={`${format(date, 'MMM d')}: ${completed ? 'Done ✓' : 'Missed'}`}
              style={{
                width: size,
                height: size,
                borderRadius: 2,
                background: getHabitDayColor(completed),
                border: isToday(date) ? '1.5px solid var(--amber)' : 'none',
                cursor: 'default',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
