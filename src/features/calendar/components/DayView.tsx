import { format, isToday } from 'date-fns';
import type { CalendarEvent } from '../../../db/db';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

export default function DayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick
}: DayViewProps) {
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  const today = isToday(currentDate);

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full bg-white">
      {/* Day Header */}
      <div className="flex border-b py-3 px-6" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col items-center">
          <div className={`text-sm font-medium uppercase ${today ? 'text-blue-600' : 'text-gray-500'}`}>
            {format(currentDate, 'EEEE')}
          </div>
          <div className={`text-3xl mt-1 ${today ? 'bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold shadow-sm' : 'text-gray-900 font-semibold'}`}>
            {format(currentDate, 'd')}
          </div>
        </div>
      </div>

      {/* Day Grid */}
      <div className="flex flex-1 overflow-y-auto relative">
        {/* Time Column */}
        <div className="w-16 flex-shrink-0 border-r bg-white sticky left-0 z-10" style={{ borderColor: 'var(--border)' }}>
          {hours.map((hour) => (
            <div key={hour} className="h-20 text-right pr-3 pt-2 text-sm text-gray-500 font-medium">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="flex-1 relative">
          {/* Horizontal Grid Lines */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-20 border-b w-full"
                style={{ borderColor: 'var(--border)', opacity: 0.5 }}
              />
            ))}
          </div>

          <div className="absolute inset-0 z-10">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-20 w-full cursor-pointer hover:bg-blue-50/50 transition-colors"
                onClick={() => {
                  const clickDate = new Date(currentDate);
                  clickDate.setHours(hour, 0, 0, 0);
                  onTimeSlotClick(clickDate);
                }}
              />
            ))}
          </div>

          {/* Events Layer */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {events
              .filter(e => new Date(e.startTime).toDateString() === currentDate.toDateString())
              .map(event => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="absolute left-2 right-4 rounded-md border p-2 overflow-hidden shadow-sm pointer-events-auto cursor-pointer flex flex-col transition-transform hover:scale-[1.01]"
                  style={{
                    top: `${(new Date(event.startTime).getHours() + new Date(event.startTime).getMinutes() / 60) * 5}rem`,
                    height: `${((event.endTime - event.startTime) / 3600000) * 5}rem`,
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="font-semibold text-sm truncate text-gray-900">{event.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
