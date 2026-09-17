import { useMemo } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import type { CalendarEvent } from '../../../db/db';

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}

export default function AgendaView({
  events,
  onEventClick,
}: AgendaViewProps) {
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: typeof events } = {};
    events.forEach(event => {
      const dateKey = new Date(event.startTime).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.startTime - b.startTime);
    });

    return groups;
  }, [events]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedEvents).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [groupedEvents]);

  const getRelativeDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    
    // Future parsing could return "This Week", "Next Week" 
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8 bg-gray-50 h-full">
      <div className="max-w-2xl mx-auto space-y-10">
        {sortedDates.map(dateString => (
          <div key={dateString}>
            <div className="flex items-end gap-3 mb-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
                {getRelativeDateLabel(dateString)}
              </h3>
              <span className="text-sm text-gray-500 font-medium mb-1">
                {format(new Date(dateString), 'MMM d')}
              </span>
            </div>

            <div className="space-y-3">
              {groupedEvents[dateString].map(event => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border cursor-pointer transition-all hover:border-gray-300 hover:shadow-md hover:scale-[1.01]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="w-20 flex-shrink-0 text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {event.allDay ? 'All day' : format(new Date(event.startTime), 'h:mm a')}
                    </div>
                    {!event.allDay && (
                      <div className="text-xs text-gray-500 font-medium tracking-tight">
                        {format(new Date(event.endTime), 'h:mm a')}
                      </div>
                    )}
                  </div>

                  <div 
                    className="w-1.5 h-12 rounded-full mx-1" 
                    style={{ backgroundColor: event.color || 'var(--color-event-work)' }}
                  />

                  <div className="flex-1 min-w-0 py-1">
                    <div className="font-semibold text-gray-900 truncate tracking-tight">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-gray-500 truncate mt-0.5 max-w-[80%]">{event.description}</div>
                    )}
                  </div>
                  
                  {/* Status indicator / Quick checkbox could go here */}
                </div>
              ))}
            </div>
          </div>
        ))}
        {sortedDates.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-4">🗓️</div>
            <h3 className="text-lg font-semibold text-gray-900">No events scheduled</h3>
            <p className="mt-1">Enjoy your free time!</p>
          </div>
        )}
      </div>
    </div>
  );
}