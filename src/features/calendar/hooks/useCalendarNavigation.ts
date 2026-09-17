import { useState, useCallback } from 'react';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfDay } from 'date-fns';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export function useCalendarNavigation(initialView: CalendarView = 'week', weekStartsOn: 0 | 1 = 0) {
  const [view, setView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));

  const goToToday = useCallback(() => {
    setCurrentDate(startOfDay(new Date()));
  }, []);

  const next = useCallback(() => {
    setCurrentDate((prev) => {
      switch (view) {
        case 'day': return addDays(prev, 1);
        case 'week': return addWeeks(prev, 1);
        case 'month': return addMonths(prev, 1);
        case 'agenda': return addWeeks(prev, 1);
        default: return prev;
      }
    });
  }, [view]);

  const prev = useCallback(() => {
    setCurrentDate((prev) => {
      switch (view) {
        case 'day': return subDays(prev, 1);
        case 'week': return subWeeks(prev, 1);
        case 'month': return subMonths(prev, 1);
        case 'agenda': return subWeeks(prev, 1);
        default: return prev;
      }
    });
  }, [view]);

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    goToToday,
    next,
    prev,
    weekStartsOn
  };
}
