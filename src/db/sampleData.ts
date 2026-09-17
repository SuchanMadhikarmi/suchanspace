import { db } from './db';

export async function clearAllData() {
  await db.dailyEntries.clear();
  await db.tasks.clear();
  await db.habits.clear();
  await db.habitLogs.clear();
  await db.goals.clear();
  await db.projects.clear();
  await db.projectTasks.clear();
  await db.journalEntries.clear();
  await db.weeklyReviews.clear();
  await db.learningSessions.clear();
  await db.learningTracks.clear();
  await db.focusSessions.clear();
  await db.monthlyLetters.clear();
  await db.annualLetters.clear();
}
