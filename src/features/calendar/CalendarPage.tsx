import { useState, useMemo } from 'react';
import CalendarHeader from './components/CalendarHeader';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import MonthView from './components/MonthView';
import AgendaView from './components/AgendaView';
import EventEditor from './components/EventEditor';
import QuickAdd from './components/QuickAdd';
import { useCalendarNavigation } from './hooks/useCalendarNavigation';
import { expandEvents } from './utils/recurrence';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { CalendarEvent } from '../../db/db';
import { nanoid } from 'nanoid';

export default function CalendarPage() {
  const {
    view,
    setView,
    currentDate,
    goToToday,
    next,
    prev,
    weekStartsOn
  } = useCalendarNavigation('week', 0); // Default Sunday start for now

  const allEvents = useLiveQuery(() => db.events.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];

  // Very basic 1-year bounding box for rendering expansion
  const events = useMemo(() => {
      const now = new Date(currentDate);
      const startMs = now.getTime() - 31536000000; // -1 year
      const endMs = now.getTime() + 31536000000;   // +1 year
      return expandEvents(allEvents, startMs, endMs);
  }, [allEvents, currentDate]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEditorOpen(true);
  };

  const handleTimeSlotClick = (date: Date) => {
    setEditingEvent({
      startTime: date.getTime(),
      endTime: date.getTime() + 3600000 // 1 hour default
    });
    setEditorOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditorOpen(true);
  };

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      // Strip dynamic '-<timestamp>' if virtual editing the main instance rule
      const actualId = eventData.id?.split('-')[0];

      if (actualId) {
        await db.events.update(actualId, { ...eventData, id: actualId, updatedAt: Date.now() });
      } else {
        await db.events.add({
          ...(eventData as CalendarEvent),
          id: nanoid(),
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } catch (e) {
      console.error('Failed to save event:', e);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white relative">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        setView={setView}
        onNext={next}
        onPrev={prev}
        onToday={goToToday}
        onAddEvent={handleAddEvent}
      />
      <div className="flex-1 overflow-hidden relative">
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            weekStartsOn={weekStartsOn}
            events={events}
            onTimeSlotClick={handleTimeSlotClick}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onTimeSlotClick={handleTimeSlotClick}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            weekStartsOn={weekStartsOn}
            events={events}
            onTimeSlotClick={handleTimeSlotClick}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'agenda' && (
          <AgendaView
            currentDate={currentDate}
            events={events}
            onTimeSlotClick={handleTimeSlotClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <QuickAdd onSave={handleSaveEvent} />

      <EventEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        event={editingEvent}
        onSave={handleSaveEvent}
        categories={categories}
      />
    </div>
  );
}