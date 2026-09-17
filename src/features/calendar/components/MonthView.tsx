import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import type { CalendarEvent } from '../../../db/db';

interface MonthViewProps {
  currentDate: Date;
  weekStartsOn: 0 | 1;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

export default function MonthView({
  currentDate,
  weekStartsOn,
  events,
  onEventClick,
  onTimeSlotClick
}: MonthViewProps) {
  const { monthStart, getDays } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn });
    const endDate = endOfWeek(mEnd, { weekStartsOn });

    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return { monthStart, getDays: days };
  }, [currentDate, weekStartsOn]);

  const weekDaysHeader = useMemo(() => {
    const days = [];
    const startDate = startOfWeek(monthStart, { weekStartsOn });
    for (let i = 0; i < 7; i++) {
      days.push(format(addDays(startDate, i), 'EEEE'));
    }
    return days;
  }, [monthStart, weekStartsOn]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full bg-white">
      {/* Month Header */}
      <div className="grid grid-cols-7 border-b bg-gray-50" style={{ borderColor: 'var(--border)' }}>
        {weekDaysHeader.map((dayName) => (
          <div key={dayName} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {dayName}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
        {getDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);
          
          const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));

          return (
            <div
              key={day.toISOString()}
              className={`border-r border-b min-h-[120px] p-2 transition-colors hover:bg-gray-50 cursor-pointer flex flex-col gap-1
                ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
              `}
              style={{ borderColor: 'var(--border)' }}
              onClick={() => onTimeSlotClick(day)}
            >
              <div className={`text-right text-sm font-medium ${isCurrentDay ? 'w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white ml-auto shadow-sm' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </div>
              <div className="flex flex-col gap-1 overflow-hidden mt-1">
                {dayEvents.slice(0, 4).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className="text-xs px-2 py-1 rounded truncate transition-colors hover:opacity-80 shadow-sm"
                    style={{
                      backgroundColor: 'var(--color-event-work)', // Use event color
                      color: 'white',
                    }}
                  >
                    {format(new Date(event.startTime), 'h:mm a')} {event.title}
                  </div>
                ))}
                {dayEvents.length > 4 && (
                  <div className="text-xs text-gray-500 font-medium px-1">
                    +{dayEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
