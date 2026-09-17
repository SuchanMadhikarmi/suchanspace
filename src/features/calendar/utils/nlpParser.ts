import { addDays, setHours, setMinutes, nextDay } from 'date-fns';

export interface ParsedNLPResult {
  title: string;
  startTime: number | null;
  endTime: number | null;
  durationMinutes: number | null;
}

export function parseNLP(input: string): ParsedNLPResult {
  let title = input;
  let startDate = new Date();
  let durationMinutes = 60; // default 1 hour
  let hasTime = false;
  let hasDate = false;

  const lowerInput = input.toLowerCase();

  // 1. Parse Date
  if (lowerInput.includes('tomorrow')) {
    startDate = addDays(startDate, 1);
    hasDate = true;
    title = title.replace(/tomorrow/i, '').trim();
  } else if (lowerInput.includes('today')) {
    hasDate = true;
    title = title.replace(/today/i, '').trim();
  }

  // Next [DayOfWeek]
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    const regex = new RegExp(`next ${days[i]}`, 'i');
    if (regex.test(lowerInput)) {
      startDate = nextDay(new Date(), i as Day);
      hasDate = true;
      title = title.replace(regex, '').trim();
      break;
    }
  }

  // 2. Parse Time (e.g., "at 3pm", "at 15:30")
  const timeRegex = /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const timeMatch = lowerInput.match(timeRegex);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3];

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    startDate = setMinutes(setHours(startDate, hours), minutes);
    hasTime = true;
    
    // Remove the time string from title
    // Need to use case-insensitive replace on the actual matched exact string
    const actualMatch = input.match(new RegExp(timeMatch[0], 'i'));
    if (actualMatch) {
        title = title.replace(actualMatch[0], '').trim();
    }
  } else if (!hasTime && hasDate) {
    // If a date was specified but no time, default to something reasonable or all day
    startDate = setMinutes(setHours(startDate, 9), 0); // 9 AM default
  }

  // 3. Parse Duration (e.g., "for 1 hour", "for 30m", "for 2 hours")
  const durationRegex = /for\s+(\d+(?:\.\d+)?)\s*(h|hour|hours|m|min|minutes|mins)/i;
  const durMatch = lowerInput.match(durationRegex);
  if (durMatch) {
    const val = parseFloat(durMatch[1]);
    const unit = durMatch[2];
    if (unit.startsWith('h')) {
      durationMinutes = Math.round(val * 60);
    } else {
      durationMinutes = Math.round(val);
    }
    
    const actualDurMatch = input.match(new RegExp(durMatch[0], 'i'));
    if (actualDurMatch) {
        title = title.replace(actualDurMatch[0], '').trim();
    }
  }

  // Clean up extra spaces or words like "on"
  title = title.replace(/\s+/g, ' ').trim();
  if (title.endsWith(' on')) title = title.slice(0, -3);

  return {
    title: title || 'New Event',
    startTime: hasDate || hasTime ? startDate.getTime() : null,
    endTime: hasDate || hasTime ? startDate.getTime() + durationMinutes * 60000 : null,
    durationMinutes
  };
}

// Helper to satisfy TS definition for nextDay
type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;
