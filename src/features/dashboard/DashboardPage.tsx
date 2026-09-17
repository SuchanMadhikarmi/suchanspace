import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Activity, Target, Flame } from "lucide-react";
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { subDays, format } from 'date-fns';

// Inline simple card components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border bg-white text-slate-950 shadow ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

export default function DashboardPage() {
  // 1. Fetch data for the last 7 days
  const today = new Date();
  
  // Create an array of the last 7 date objects (oldest to newest)
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));
  }, [today]);

  const datesStr = last7Days.map(d => format(d, 'yyyy-MM-dd'));

  // Queries
  const allTasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const allDailyEntries = useLiveQuery(() => db.dailyEntries.where('date').anyOf(datesStr).toArray(), [datesStr]) || [];
  const allHabits = useLiveQuery(() => db.habits.toArray(), []) || [];
  const allHabitLogs = useLiveQuery(() => db.habitLogs.where('date').anyOf(datesStr).toArray(), [datesStr]) || [];

  // 2. Process Data for Charts
  const weekData = useMemo(() => {
    return last7Days.map((dateObj) => {
      const dateStr = format(dateObj, 'yyyy-MM-dd');
      
      // Tasks completed on this day
      const tasksCompleted = allTasks.filter((t: any) => t.completed && t.date === dateStr).length;
      
      // Focus hours on this day (assuming 1 focus session = 25 mins = ~0.41 hours)
      const dailyEntry = allDailyEntries.find((e: any) => e.date === dateStr);
      const focusSessions = dailyEntry?.focusSessionsCount || 0;
      const focusHrs = Number((focusSessions * 25 / 60).toFixed(1));

      return {
        day: format(dateObj, 'EEE'), // e.g., 'Mon', 'Tue'
        fullDate: dateStr,
        focus: focusHrs,
        tasks: tasksCompleted
      };
    });
  }, [last7Days, allTasks, allDailyEntries]);

  // Weekly Focus Total
  const weeklyFocusTotal = weekData.reduce((acc, curr) => acc + curr.focus, 0);

  // 3. Process Habit Strike Rate
  // Simplified calculation for the week
  const habitCompletionRate = useMemo(() => {
    if (allHabits.length === 0) return 0;
    
    let possible = 0;
    let completed = 0;

    // For each habit, check each day in the last 7 days
    allHabits.forEach((habit: any) => {
      // In a real app we'd check if the habit was supposed to be done on that day (e.g. weekdays)
      // We'll simplify and say 1 per active habit per day.
      if (habit.archived === 1) return;
      
      datesStr.forEach(d => {
        possible++;
        const log = allHabitLogs.find((l: any) => l.habitId === habit.id && l.date === d);
        if (log && log.completed) {
          completed++;
        }
      });
    });

    return possible === 0 ? 0 : Math.round((completed / possible) * 100);
  }, [allHabits, allHabitLogs, datesStr]);

  const pendingHabitsToday = useMemo(() => {
    let pending = 0;
    const todayStr = format(today, 'yyyy-MM-dd');
    allHabits.forEach((habit: any) => {
      if (habit.archived === 1) return;
      const log = allHabitLogs.find((l: any) => l.habitId === habit.id && l.date === todayStr);
      if (!log || !log.completed) {
        pending++;
      }
    });
    return pending;
  }, [allHabits, allHabitLogs, today]);

  // 4. Current Streak Logic (Simplified across all active habits)
  // How many consecutive days up to today (or yesterday) has at least 1 habit completed?
  const currentStreak = useMemo(() => {
    let streak = 0;
    // Iterate backwards from today
    for (let i = datesStr.length - 1; i >= 0; i--) {
      const d = datesStr[i];
      const completedAnyThatDay = allHabitLogs.some((l: any) => l.date === d && l.completed);
      if (completedAnyThatDay) {
        streak++;
      } else if (i !== datesStr.length - 1) { 
        // Break streak if it's not today missing
        break;
      }
    }
    return streak;
  }, [datesStr, allHabitLogs]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif text-slate-900 tracking-tight">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Weekly Focus Area</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{weeklyFocusTotal.toFixed(1)} hrs</div>
            <p className="text-xs text-slate-400 mt-1">Based on daily session entries</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Habit Strike Rate</CardTitle>
            <Target className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{habitCompletionRate}%</div>
            <p className="text-xs text-slate-400 mt-1">{pendingHabitsToday} pending today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{currentStreak} Days</div>
            <p className="text-xs text-slate-400 mt-1">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-800">Focus Distribution (hrs)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="focus" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-800">Task Completion Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="tasks" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}