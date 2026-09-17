import { addDays, addWeeks, addMonths, addYears, startOfDay } from 'date-fns';
import type { CalendarEvent } from '../../../db/db';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;        // every N days/weeks/months
  daysOfWeek?: number[];   // 0=Sun, 1=Mon, etc. (for weekly)
  endDate?: number | null; // end timestamp
  count?: number | null;   // repeat N times then stop
  exceptions?: number[];   // specific dates (timestamps) to skip
}

/**
 * Expands recurring events into individual virtual events within a given time window.
 */
export function expandEvents(
  events: CalendarEvent[],
  windowStart: number,
  windowEnd: number
): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];

  for (const event of events) {
    // If no recurrence, just check if it falls in the window
    if (!event.recurrence) {
      if (
        (event.startTime >= windowStart && event.startTime <= windowEnd) ||
        (event.endTime >= windowStart && event.endTime <= windowEnd) ||
        (event.startTime <= windowStart && event.endTime >= windowEnd)
      ) {
        expanded.push(event);
      }
      continue;
    }

    const rule: RecurrenceRule = event.recurrence;
    let currentStart = new Date(event.startTime);
    const duration = event.endTime - event.startTime;
    let occurrencesCount = 0;

    // Safety limit to prevent infinite loops
    const MAX_OCCURRENCES = 1000;

    while (
      currentStart.getTime() <= windowEnd &&
      occurrencesCount < MAX_OCCURRENCES
    ) {
      // Check end date constraint
      if (rule.endDate && currentStart.getTime() > rule.endDate) {
        break;
      }

      // Check count constraint
      if (rule.count && occurrencesCount >= rule.count) {
        break;
      }

      const currentStartMs = currentStart.getTime();

      // Check exceptions
      const isException = rule.exceptions?.some(
        (exTs) => startOfDay(new Date(exTs)).getTime() === startOfDay(currentStart).getTime()
      );

      if (!isException) {
        // For weekly recurrence, check if current daysOfWeek matches
        if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          if (rule.daysOfWeek.includes(currentStart.getDay())) {
            if (currentStartMs >= windowStart || currentStartMs + duration >= windowStart) {
              expanded.push({
                ...event,
                id: `${event.id}-${currentStartMs}`, // virtual ID
                startTime: currentStartMs,
                endTime: currentStartMs + duration,
              });
            }
          }
        } else {
          // Normal daily/monthly/yearly logic or weekly without specific days
          if (currentStartMs >= windowStart || currentStartMs + duration >= windowStart) {
            expanded.push({
              ...event,
              id: `${event.id}-${currentStartMs}`, // virtual ID
              startTime: currentStartMs,
              endTime: currentStartMs + duration,
            });
          }
        }
      }

      // Special daily auto-increment if checking multiple days in a week without day skipping?
      // Actually standard recurrence jumps by interval
      occurrencesCount++;
      
      if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // If checking specific days of the week, we just advance day by day
        // and let the daysOfWeek check handle filtering, but increment interval when a week wraps.
        // For simplicity in this lightweight engine, we'll advance by 1 day and count occurrences differently.
        // To be strictly correct: advance by 1 day. Re-evaluate count only when a valid day occurs.
        currentStart = addDays(currentStart, 1);
        // We shouldn't increment `occurrencesCount` on invalid days, so fix it:
        if (!rule.daysOfWeek.includes(currentStart.getDay())) {
           occurrencesCount--; // rollback count since it wasn't a valid occurrence
        }
      } else {
        switch (rule.frequency) {
          case 'daily':
            currentStart = addDays(currentStart, rule.interval || 1);
            break;
          case 'weekly':
            currentStart = addWeeks(currentStart, rule.interval || 1);
            break;
          case 'monthly':
            currentStart = addMonths(currentStart, rule.interval || 1);
            break;
          case 'yearly':
            currentStart = addYears(currentStart, rule.interval || 1);
            break;
        }
      }
    }
  }

  return expanded;
}
