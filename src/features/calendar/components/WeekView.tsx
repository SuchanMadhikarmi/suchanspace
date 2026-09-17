import { useMemo } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import type { CalendarEvent } from '../../../db/db';

interface WeekViewProps {
  currentDate: Date;
  weekStartsOn: 0 | 1;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

export default function WeekView({
  currentDate,
  weekStartsOn,
  events,
  onEventClick,
  onTimeSlotClick
}: WeekViewProps) {
  const startDate = startOfWeek(currentDate, { weekStartsOn });
  const getDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  }, [startDate]);

  const hours = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Week Header */}
      <div className="flex border-b pr-4" style={{ borderColor: 'var(--border)' }}>
        <div className="w-16 flex-shrink-0" /> {/* Spacer for time column */}
        <div className="flex flex-1">
          {getDays.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className="flex-1 py-3 text-center border-l cursor-pointer transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => onTimeSlotClick(day)}
              >
                <div className={`text-xs font-medium uppercase mb-1 ${today ? 'text-blue-600' : 'text-gray-500'}`}>
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto text-lg ${
                    today ? 'bg-blue-600 text-white font-bold' : 'text-gray-900 font-medium'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex flex-1 overflow-y-auto relative">
        {/* Time Column */}
        <div className="w-16 flex-shrink-0 border-r bg-white sticky left-0 z-10" style={{ borderColor: 'var(--border)' }}>
          {hours.map((hour) => (
            <div key={hour} className="h-16 text-right pr-2 text-xs text-gray-500 transform -translate-y-2">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        <div className="flex flex-1 relative bg-white">
          {/* Horizontal Grid Lines */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b w-full"
                style={{ borderColor: 'var(--border)', opacity: 0.5 }}
              />
            ))}
          </div>

          {/* Vertical Columns */}
          {getDays.map((day, i) => (
            <div
              key={i}
              className="flex-1 relative border-r last:border-r-0"
              style={{ borderColor: 'var(--border)' }}
            >
              {/* Invisible clickable slots for hour blocks */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-transparent w-full cursor-pointer hover:bg-gray-50 transition-colors z-10 block"
                  onClick={() => {
                    const clickDate = new Date(day);
                    clickDate.setHours(hour, 0, 0, 0);
                    onTimeSlotClick(clickDate);
                  }}
                />
              ))}

              {/* Render Events here later with absolute positioning */}
              {events
                .filter(e => new Date(e.startTime).toDateString() === day.toDateString())
                .map(event => (
                   <div key={event.id} onClick={() => onEventClick(event)} className="hidden">{event.title}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
