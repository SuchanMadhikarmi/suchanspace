import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { CalendarView } from '../hooks/useCalendarNavigation';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  onNext: () => void;
  onPrev: () => void;
  onToday: () => void;
  onAddEvent: () => void;
}

export default function CalendarHeader({
  currentDate,
  view,
  setView,
  onNext,
  onPrev,
  onToday,
  onAddEvent
}: CalendarHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white relative z-10" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-4">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors border"
          style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <h2 className="text-xl font-bold ml-2">
          {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
          {view === 'week' && format(currentDate, 'MMMM yyyy')}
          {view === 'month' && format(currentDate, 'MMMM yyyy')}
          {view === 'agenda' && 'Agenda'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex p-0.5 rounded-lg border bg-gray-50" style={{ borderColor: 'var(--border)' }}>
          {(['day', 'week', 'month', 'agenda'] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                view === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          onClick={onAddEvent}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{ background: 'var(--color-event-work)' }}
        >
          <Plus size={16} />
          New Event
        </button>
      </div>
    </header>
  );
}
