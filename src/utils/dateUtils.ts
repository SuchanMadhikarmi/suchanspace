import { format, differenceInDays, startOfYear, endOfYear, startOfWeek, getWeek, getDay } from 'date-fns';

export const QUOTES = [
  { text: "Do not indulge in dreams of having what you have not, but reckon up the chief of the blessings you do possess.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "It is not that I'm so smart, it's just that I stay with problems longer.", author: "Einstein" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Do fewer things, do them better, know why you're doing them.", author: "Unknown" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "You do not rise to the level of your goals, you fall to the level of your systems.", author: "James Clear" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Clarity about what matters provides clarity about what does not.", author: "Cal Newport" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { text: "Don't wish it were easier, wish you were better.", author: "Jim Rohn" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "The quality of your life is determined by the quality of your questions.", author: "Tony Robbins" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Einstein" },
  { text: "Suffer the pain of discipline or suffer the pain of regret.", author: "Jim Rohn" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
];

export function getDailyQuote(): { text: string; author: string } {
  const dayOfYear = getDayOfYear(new Date());
  return QUOTES[dayOfYear % QUOTES.length];
}

export function getDayOfYear(date: Date): number {
  const start = startOfYear(date);
  return differenceInDays(date, start) + 1;
}

export function getDaysRemainingInYear(date: Date = new Date()): number {
  const end = endOfYear(date);
  return differenceInDays(end, date);
}

export function getYearProgress(date: Date = new Date()): number {
  const year = date.getFullYear();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeap ? 366 : 365;
  const dayOfYear = getDayOfYear(date);
  return (dayOfYear / totalDays) * 100;
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}.`;
  if (hour < 17) return `Good afternoon, ${name}.`;
  return `Good evening, ${name}.`;
}

export function isEveningTime(): boolean {
  return new Date().getHours() >= 18;
}

export function formatDateBeautiful(date: Date = new Date()): string {
  return format(date, "EEEE · MMMM d · yyyy");
}

export function getWeekNumber(date: Date = new Date()): number {
  return getWeek(date, { weekStartsOn: 1 });
}

export function getWeeksRemaining(date: Date = new Date()): number {
  const currentWeek = getWeek(date, { weekStartsOn: 1 });
  return 52 - currentWeek;
}

export function getStartOfWeek(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

// Nepali Bikram Sambat conversion (simplified)
// BS year = AD year + 56 or 57 (depends on month)
const BS_MONTHS = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];

// Approximate BS month lengths (2082 BS / 2025-2026 AD)
const BS_MONTH_LENGTHS: Record<number, number[]> = {
  2082: [31, 31, 32, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
};

export function adToBS(adDate: Date): { year: number; month: number; day: number; monthName: string } {
  // Reference date: 2000 AD Jan 1 = 2056 BS Poush 17
  const refAD = new Date(2000, 0, 1);
  const refBS = { year: 2056, month: 9, day: 17 }; // 0-indexed month

  const daysDiff = Math.floor((adDate.getTime() - refAD.getTime()) / (1000 * 60 * 60 * 24));
  
  let bsYear = refBS.year;
  let bsMonth = refBS.month;
  let bsDay = refBS.day;
  
  let remaining = daysDiff;
  
  while (remaining > 0) {
    const monthLengths = BS_MONTH_LENGTHS[bsYear] || BS_MONTH_LENGTHS[2082];
    const daysInMonth = monthLengths[bsMonth];
    const daysLeft = daysInMonth - bsDay;
    
    if (remaining <= daysLeft) {
      bsDay += remaining;
      remaining = 0;
    } else {
      remaining -= (daysLeft + 1);
      bsDay = 1;
      bsMonth++;
      if (bsMonth >= 12) { bsMonth = 0; bsYear++; }
    }
  }
  
  return { year: bsYear, month: bsMonth + 1, day: bsDay, monthName: BS_MONTHS[bsMonth] };
}

export function formatBSDate(adDate: Date = new Date()): string {
  const bs = adToBS(adDate);
  return `${bs.day} ${bs.monthName} ${bs.year} BS`;
}

// Nepali fiscal year: Shrawan 1 (mid-July) to Ashadh end (mid-July next year)
export function getNepaleseFiscalYearProgress(date: Date = new Date()): number {
  // Approximate: fiscal year starts ~July 16
  const year = date.getFullYear();
  const fyStart = new Date(date.getMonth() < 6 ? year - 1 : year, 6, 16); // July 16
  const fyEnd = new Date(date.getMonth() < 6 ? year : year + 1, 6, 15); // July 15 next year
  const total = differenceInDays(fyEnd, fyStart);
  const elapsed = differenceInDays(date, fyStart);
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
}

export function getDaysUntilNepaleseEvent(date: Date = new Date()): Record<string, number> {
  const year = date.getFullYear();
  
  // Approximate Dashain 2082 BS: ~October 12, 2025 / ~2026: October 1
  const dashain2026 = new Date(2026, 9, 1); // Oct 1, 2026 (approx)
  const tihar2026 = new Date(2026, 9, 20); // Oct 20, 2026 (approx)
  const ashadhEnd = new Date(year, 6, 15); // July 15 (approx Ashadh end)
  const nextAshadhEnd = new Date(year + 1, 6, 15);
  
  return {
    Dashain: Math.max(0, differenceInDays(dashain2026, date)),
    Tihar: Math.max(0, differenceInDays(tihar2026, date)),
    'Ashadh End (FY)': Math.max(0, differenceInDays(ashadhEnd < date ? nextAshadhEnd : ashadhEnd, date)),
  };
}

export function getDaysUntilQ2End(date: Date = new Date()): number {
  const year = date.getFullYear();
  const q2End = new Date(year, 5, 30); // June 30
  if (q2End < date) return differenceInDays(new Date(year + 1, 5, 30), date);
  return differenceInDays(q2End, date);
}

export function calculateLifePercentage(birthdate: string, lifeExpectancy = 82): { age: number; percentage: number; daysLived: number; daysRemaining: number } {
  if (!birthdate) return { age: 0, percentage: 0, daysLived: 0, daysRemaining: 0 };
  const birth = new Date(birthdate);
  const today = new Date();
  const totalDays = lifeExpectancy * 365.25;
  const daysLived = differenceInDays(today, birth);
  const daysRemaining = Math.max(0, totalDays - daysLived);
  const age = daysLived / 365.25;
  const percentage = (daysLived / totalDays) * 100;
  return { age, percentage, daysLived, daysRemaining };
}

export function getDayColor(score: number | undefined): string {
  if (score === undefined || score === null) return '#E5DDD5'; // future / no data
  if (score === 0) return '#F3EFE8'; // empty/missed
  if (score < 30) return '#C8DAC8'; // low
  if (score < 55) return '#7BAD7B'; // medium
  if (score < 75) return '#4A7C59'; // good
  return '#1A3C2E'; // excellent
}

export function getHabitDayColor(completed: boolean | undefined): string {
  if (completed === undefined) return '#E5DDD5';
  return completed ? '#1A3C2E' : '#F3EFE8';
}

export function getMoodColor(mood: string): string {
  const map: Record<string, string> = {
    excellent: '#1A3C2E',
    good: '#4A7C59',
    neutral: '#D97706',
    difficult: '#C4622D',
    rough: '#C0392B',
  };
  return map[mood] || '#E5DDD5';
}

export function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    excellent: '✨',
    good: '😊',
    neutral: '😐',
    difficult: '😔',
    rough: '😞',
  };
  return map[mood] || '😐';
}

export function getMoodLabel(mood: string): string {
  const map: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    neutral: 'Neutral',
    difficult: 'Difficult',
    rough: 'Rough',
  };
  return map[mood] || mood;
}

export function calculateDailyScore(params: {
  habitsCompleted: number;
  totalHabits: number;
  mitCompleted?: 'yes' | 'partial' | 'no' | '';
  tasksCompleted: number;
  totalTasks: number;
  journaled: boolean;
}): number {
  const { habitsCompleted, totalHabits, mitCompleted, tasksCompleted, totalTasks, journaled } = params;
  const habitScore = totalHabits > 0 ? (habitsCompleted / totalHabits) * 40 : 0;
  const mitScore = mitCompleted === 'yes' ? 30 : mitCompleted === 'partial' ? 15 : 0;
  const taskScore = totalTasks > 0 ? (tasksCompleted / totalTasks) * 20 : 0;
  const journalScore = journaled ? 10 : 0;
  return Math.round(habitScore + mitScore + taskScore + journalScore);
}

export function calculateMomentumScore(recentData: { score: number; journaled: boolean; reviewedThisWeek: boolean }[]): { score: number; status: 'building' | 'maintaining' | 'losing' } {
  if (recentData.length === 0) return { score: 0, status: 'losing' };
  const avg = recentData.reduce((sum, d) => sum + d.score, 0) / recentData.length;
  const hasReview = recentData.some(d => d.reviewedThisWeek);
  const journalDays = recentData.filter(d => d.journaled).length;
  
  let score = avg;
  if (hasReview) score += 10;
  if (journalDays >= 5) score += 5;
  
  const status = score >= 70 ? 'building' : score >= 45 ? 'maintaining' : 'losing';
  return { score: Math.min(100, Math.round(score)), status };
}

export function generateAllDaysOfYear(year: number): Date[] {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function generateCalendarGrid(year: number): Array<{ date: Date; month: number }[]> {
  const months: Array<{ date: Date; month: number }[]> = [];
  for (let m = 0; m < 12; m++) {
    const days: { date: Date; month: number }[] = [];
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, m, d), month: m });
    }
    months.push(days);
  }
  return months;
}

export function isSameDay(a: Date, b: Date): boolean {
  return format(a, 'yyyy-MM-dd') === format(b, 'yyyy-MM-dd');
}

export function formatRelativeTime(date: Date): string {
  const days = differenceInDays(new Date(), date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function getPriorityColor(priority: string): string {
  return { high: '#C0392B', medium: '#D97706', low: '#4A7C59' }[priority] || '#D97706';
}

export function getPriorityLabel(priority: string): string {
  return { high: 'High', medium: 'Medium', low: 'Low' }[priority] || priority;
}

export function getDayOfWeekIndex(date: Date): number {
  return getDay(date);
}

export const CATEGORIES = ['Health', 'Career', 'Finance', 'Relationships', 'Learning', 'Creativity', 'Spirituality', 'Family', 'Mindfulness', 'Other'];
export const HABIT_CATEGORIES = ['Health', 'Learning', 'Mindfulness', 'Productivity', 'Fitness', 'Nutrition', 'Social', 'Finance', 'Creativity', 'Other'];
export const GOAL_CATEGORIES = ['Finance', 'Career', 'Health', 'Relationships', 'Learning', 'Personal', 'Family', 'Creativity'];
export const LEARNING_CATEGORIES = ['Technology', 'Finance', 'Health', 'Business', 'Science', 'Arts', 'Language', 'Philosophy', 'Other'];
