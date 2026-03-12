import { db } from './db';
import { format, subDays, startOfWeek } from 'date-fns';

export async function seedSampleData() {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Create habits
  const readingId = await db.habits.add({
    name: 'Morning Reading',
    why: 'Sharpen the mind before the world demands my attention.',
    category: 'Learning',
    frequency: 'daily',
    bestTime: 'morning',
    color: '#1A3C2E',
    emoji: '📚',
    createdAt: format(subDays(today, 40), "yyyy-MM-dd'T'HH:mm:ss"),
    archived: false,
  });

  const exerciseId = await db.habits.add({
    name: 'Exercise',
    why: 'Energy, discipline, and longevity — the foundation of everything else.',
    category: 'Health',
    frequency: 'daily',
    bestTime: 'morning',
    color: '#C4622D',
    emoji: '💪',
    createdAt: format(subDays(today, 40), "yyyy-MM-dd'T'HH:mm:ss"),
    archived: false,
  });

  const meditationId = await db.habits.add({
    name: 'Meditation',
    why: 'Calm the noise. Think clearly. React intentionally.',
    category: 'Mindfulness',
    frequency: 'daily',
    bestTime: 'morning',
    color: '#4A7C59',
    emoji: '🧘',
    createdAt: format(subDays(today, 30), "yyyy-MM-dd'T'HH:mm:ss"),
    archived: false,
  });

  // Seed habit logs for last 40 days
  const readingPattern = [1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0];
  const exercisePattern = [0,1,1,1,0,0,1,1,0,1,1,1,0,1,1,0,0,1,1,1,0,1,1,1,0,0,1,1,1,0,0,1,1,0,1,1,1,1,0,1];
  const meditationPattern = [0,0,1,1,0,1,0,1,0,0,1,1,0,0,1,1,0,0,0,1,0,1,1,0,0,1,0,0,1,1,0,0,0,1,0,1,0,0,1,1];

  for (let i = 0; i < 40; i++) {
    const date = format(subDays(today, 39 - i), 'yyyy-MM-dd');
    await db.habitLogs.add({ habitId: readingId as number, date, completed: readingPattern[i] === 1 });
    await db.habitLogs.add({ habitId: exerciseId as number, date, completed: exercisePattern[i] === 1 });
    await db.habitLogs.add({ habitId: meditationId as number, date, completed: meditationPattern[i] === 1 });
  }

  // Create goals
  const nepseGoalId = await db.goals.add({
    title: 'Master NEPSE Analysis',
    why: 'Build financial independence through disciplined, data-driven investing in the Nepali stock market.',
    targetDate: format(new Date(2026, 5, 30), 'yyyy-MM-dd'), // Ashadh end
    category: 'Finance',
    successMetric: 'Consistently generate 20%+ annual returns with documented analysis for each trade',
    status: 'active',
    color: '#1A3C2E',
    milestones: [
      { id: 'm1', title: 'Complete technical analysis fundamentals', completed: true, completedAt: format(subDays(today, 20), 'yyyy-MM-dd') },
      { id: 'm2', title: 'Build watchlist of 20 NEPSE stocks', completed: true, completedAt: format(subDays(today, 10), 'yyyy-MM-dd') },
      { id: 'm3', title: 'Paper trade for 30 days with documented rationale', completed: false, targetDate: format(new Date(2026, 2, 31), 'yyyy-MM-dd') },
      { id: 'm4', title: 'First real trade with ≤5% portfolio', completed: false, targetDate: format(new Date(2026, 3, 30), 'yyyy-MM-dd') },
      { id: 'm5', title: 'Review and refine strategy with 3-month data', completed: false, targetDate: format(new Date(2026, 5, 15), 'yyyy-MM-dd') },
    ],
    createdAt: format(subDays(today, 30), "yyyy-MM-dd'T'HH:mm:ss"),
  });

  const mlopsGoalId = await db.goals.add({
    title: 'Complete MLOps Certification',
    why: 'Position myself at the intersection of ML and engineering — the highest-value career move of this decade.',
    targetDate: format(new Date(2026, 5, 30), 'yyyy-MM-dd'),
    category: 'Career',
    successMetric: 'Pass certification exam with 85%+ and deploy one production ML pipeline',
    status: 'active',
    color: '#C4622D',
    milestones: [
      { id: 'm1', title: 'Complete Module 1: ML Fundamentals', completed: true, completedAt: format(subDays(today, 25), 'yyyy-MM-dd') },
      { id: 'm2', title: 'Complete Module 2: Data Pipelines', completed: true, completedAt: format(subDays(today, 12), 'yyyy-MM-dd') },
      { id: 'm3', title: 'Complete Module 3: Model Deployment', completed: false, targetDate: format(new Date(2026, 3, 15), 'yyyy-MM-dd') },
      { id: 'm4', title: 'Build capstone project', completed: false, targetDate: format(new Date(2026, 4, 30), 'yyyy-MM-dd') },
      { id: 'm5', title: 'Pass certification exam', completed: false, targetDate: format(new Date(2026, 5, 20), 'yyyy-MM-dd') },
    ],
    createdAt: format(subDays(today, 35), "yyyy-MM-dd'T'HH:mm:ss"),
  });

  // Create projects
  await db.projects.add({
    goalId: nepseGoalId as number,
    title: 'NEPSE Research Dashboard',
    description: 'Personal spreadsheet and analysis system for tracking NEPSE stocks with technical indicators',
    status: 'in-progress',
    notes: 'Using TradingView charts + manual data entry for now. Will automate later.',
    priority: 'high',
    createdAt: format(subDays(today, 20), "yyyy-MM-dd'T'HH:mm:ss"),
    updatedAt: format(subDays(today, 2), "yyyy-MM-dd'T'HH:mm:ss"),
  });

  await db.projects.add({
    goalId: mlopsGoalId as number,
    title: 'MLOps Course Progress',
    description: 'Complete DeepLearning.AI MLOps specialization and all hands-on labs',
    status: 'in-progress',
    notes: 'Currently on week 6. Labs are taking longer than expected.',
    priority: 'high',
    createdAt: format(subDays(today, 30), "yyyy-MM-dd'T'HH:mm:ss"),
    updatedAt: format(subDays(today, 1), "yyyy-MM-dd'T'HH:mm:ss"),
  });

  // Journal entries — none seeded, user writes their own

  // Learning tracks
  const nepseTrackId = await db.learningTracks.add({
    name: 'NEPSE Technical Analysis',
    description: 'Build a systematic, data-driven approach to the Nepali market.',
    why: 'Build a systematic, data-driven approach to the Nepali market — not speculation, science.',
    category: 'Finance',
    currentResource: 'Technical Analysis of the Financial Markets — John Murphy',
    resourceType: 'book',
    progress: 65,
    totalHours: 48,
    targetHours: 80,
    color: '#D97706',
    goal: 'Be able to analyze any NEPSE stock with confidence in under 30 minutes',
    targetDate: format(new Date(2026, 5, 30), 'yyyy-MM-dd'),
    status: 'active',
    startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
    createdAt: format(subDays(today, 30), "yyyy-MM-dd'T'HH:mm:ss"),
  });

  const mlopsTrackId = await db.learningTracks.add({
    name: 'MLOps Fundamentals',
    description: 'Bridge the gap between building ML models and making them production-ready.',
    why: 'Bridge the gap between building ML models and actually making them useful in production.',
    category: 'Technology',
    currentResource: 'DeepLearning.AI MLOps Specialization',
    resourceType: 'course',
    progress: 40,
    totalHours: 32,
    targetHours: 100,
    color: '#1A3C2E',
    goal: 'Deploy and monitor a production ML pipeline autonomously',
    targetDate: format(new Date(2026, 5, 30), 'yyyy-MM-dd'),
    status: 'active',
    startDate: format(subDays(today, 35), 'yyyy-MM-dd'),
    createdAt: format(subDays(today, 35), "yyyy-MM-dd'T'HH:mm:ss"),
  });

  // Learning sessions and insights
  const nepseInsights = [
    { insight: 'In NEPSE, volume confirms price action. A breakout without volume is a trap — wait for confirmation on day 2.', questions: 'How do I identify "institutional" volume in a market with thin float?', clarity: 4 },
    { insight: 'Support and resistance levels respect psychological numbers (round numbers) more in Nepali markets due to retail-heavy participation.', questions: 'Why do round numbers matter to retail investors specifically?', clarity: 5 },
    { insight: 'The Hydropower sector in NEPSE is counter-cyclical to the broader index during wet season. Track monsoon data.', questions: 'Where to find monsoon forecast data reliably?', clarity: 4 },
    { insight: 'RSI divergence is your most powerful signal in illiquid markets — price can be manipulated, but divergence rarely lies.', questions: 'How to calculate RSI manually to truly understand it?', clarity: 3 },
    { insight: 'The daily chart is noise in NEPSE. Weekly charts tell the real story. Patient capital wins here.', questions: '', clarity: 5 },
  ];

  const mlopsInsights = [
    { insight: 'Data versioning (DVC) is to MLOps what Git is to software. Without it, reproducing any experiment becomes a nightmare.', questions: 'How does DVC handle large binary files efficiently?', clarity: 5 },
    { insight: 'Model drift has two types: data drift (input distribution changes) and concept drift (the relationship between X and Y changes). Each needs a different response.', questions: 'How do you detect concept drift without labeled data in production?', clarity: 4 },
    { insight: 'Feature stores solve the training-serving skew problem — the most common cause of model degradation in production.', questions: 'When is a feature store overkill vs necessary?', clarity: 3 },
    { insight: 'Shadow mode deployment (running new model in parallel without affecting users) is the gold standard for safe ML releases.', questions: 'Resource cost of shadow mode — is it always worth it?', clarity: 4 },
    { insight: 'A/B testing for ML models is fundamentally different from UI A/B tests — you need to account for position bias, novelty effect, and delayed rewards.', questions: 'How long should an ML A/B test run to be statistically valid?', clarity: 4 },
  ];

  for (let i = 0; i < nepseInsights.length; i++) {
    await db.learningSessions.add({
      trackId: nepseTrackId as number,
      date: format(subDays(today, (i + 1) * 4), 'yyyy-MM-dd'),
      duration: 45 + Math.floor(Math.random() * 45),
      keyInsight: nepseInsights[i].insight,
      clarityRating: nepseInsights[i].clarity,
      questions: nepseInsights[i].questions,
      createdAt: format(subDays(today, (i + 1) * 4), "yyyy-MM-dd'T'HH:mm:ss"),
    });
  }

  for (let i = 0; i < mlopsInsights.length; i++) {
    await db.learningSessions.add({
      trackId: mlopsTrackId as number,
      date: format(subDays(today, (i + 1) * 3 + 1), 'yyyy-MM-dd'),
      duration: 60 + Math.floor(Math.random() * 60),
      keyInsight: mlopsInsights[i].insight,
      clarityRating: mlopsInsights[i].clarity,
      questions: mlopsInsights[i].questions,
      createdAt: format(subDays(today, (i + 1) * 3 + 1), "yyyy-MM-dd'T'HH:mm:ss"),
    });
  }

  // Daily entries for last 7 days
  const scores = [78, 62, 85, 45, 72, 88, 70];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const score = scores[6 - i];
    await db.dailyEntries.add({
      date,
      morningMIT: i === 0 ? 'Complete MLOps Module 3 final project' : `Day ${format(subDays(today, i), 'EEEE')} intention`,
      morningBlocker: 'Potential distraction: social media in the afternoon',
      morningGratitude: 'My health, my learning pace, the clarity I have on what matters',
      morningEnergy: Math.floor(Math.random() * 2) + 3,
      eveningReflection: score > 70 ? 'Strong day. Stayed focused on what mattered.' : 'Average day. Could have pushed harder.',
      eveningEnergy: Math.floor(Math.random() * 2) + 2,
      eveningWentWell: 'Morning routine, reading session',
      eveningTomorrow: 'Wake up at 5:30 and start immediately',
      mitCompleted: score > 75 ? 'yes' : score > 50 ? 'partial' : 'no',
      dailyScore: score,
      focusSessionsCount: Math.floor(score / 25),
    });
  }

  // Weekly review
  const weekStart = format(startOfWeek(subDays(today, 7), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(new Date(new Date(weekStart + 'T12:00:00').getTime() + 6 * 86400000), 'yyyy-MM-dd');
  await db.weeklyReviews.add({
    weekStart,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    weekNumber: 10,
    highlight: 'Maintained reading streak — 7 days straight and completed MLOps Module 2 ahead of schedule.',
    learned: 'RSI divergence is the most powerful signal in illiquid markets. Also: shadow mode deployment is the gold standard for safe ML releases.',
    challenge: 'Unscheduled meetings fragmented the afternoon. Context switching is deeply costly to deep work.',
    gratitude: 'My health, the clarity I have on what matters, and my consistent morning routine.',
    improvement: 'Plan the physical environment the night before — gym clothes out, workspace clear.',
    nextWeekGoal: 'Complete MLOps Module 3 final project by Thursday.',
    wins: [
      'Maintained reading streak — 7 days straight',
      'Completed MLOps Module 2 ahead of schedule',
      'Had first successful NEPSE paper trade analysis'
    ],
    notDone: 'Exercise was inconsistent — only 4 of 7 days. Need to protect morning time better.',
    drainer: 'Unscheduled meetings that fragment the afternoon. Context switching is costly.',
    energizer: 'Deep work in the morning. When I protect that window, everything else feels easier.',
    different: 'Plan the physical environment the night before — gym clothes out, workspace clear.',
    rating: 7,
    oneWord: 'Steady',
    nextPriority: 'Complete MLOps Module 3',
    tasksCompleted: 12,
    totalTasks: 16,
    avgDailyScore: 71,
    habitsCompleted: 18,
    dayIntentions: {
      monday: 'Deep work: MLOps lab + NEPSE research',
      tuesday: 'Admin, emails, and planning tasks',
      wednesday: 'Study session + reading',
      thursday: 'Project work + review progress',
      friday: 'Wrap up the week, weekly review prep',
    },
    focusHabits: [readingId as number, exerciseId as number],
    createdAt: format(subDays(today, 7), "yyyy-MM-dd'T'HH:mm:ss"),
  });

  // Today's tasks
  await db.tasks.add({ title: 'Complete MLOps Module 3 final project', date: todayStr, priority: 'high', completed: false, carriedOver: false, createdAt: new Date().toISOString(), estimatedMinutes: 90 });
  await db.tasks.add({ title: 'Review NEPSE mock portfolio — assess week 4', date: todayStr, priority: 'high', completed: false, carriedOver: false, createdAt: new Date().toISOString(), estimatedMinutes: 45 });
  await db.tasks.add({ title: 'Prepare book notes: chapter 12-14', date: todayStr, priority: 'medium', completed: false, carriedOver: false, createdAt: new Date().toISOString(), estimatedMinutes: 30 });
  await db.tasks.add({ title: 'Reply to pending emails', date: todayStr, priority: 'low', completed: true, completedAt: new Date().toISOString(), carriedOver: false, createdAt: new Date().toISOString() });
  await db.tasks.add({ title: 'Plan next week learning schedule', date: todayStr, priority: 'medium', completed: false, carriedOver: false, createdAt: new Date().toISOString(), estimatedMinutes: 20 });
}

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
