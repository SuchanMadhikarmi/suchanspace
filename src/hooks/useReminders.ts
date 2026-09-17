import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { sendNotification } from '../services/notificationService';
import { format } from 'date-fns';

export function useReminders() {
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray(), []) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []) || [];

  useEffect(() => {
    // Basic reminder polling service: checks every 15 minutes.
    // In a real application we would use service workers and Push APIs for robust offline notifications.
    
    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = format(now, 'yyyy-MM-dd');

      // 1. Check for high priority tasks
      const highPriorityPending = tasks.filter(t => !t.completed && t.priority === 'high' && t.date === todayStr);
      if (highPriorityPending.length > 0 && currentHour >= 12 && currentHour < 18) {
        sendNotification("High Priority Task Overdue!", {
          body: `You have ${highPriorityPending.length} high priority tasks pending for today.`
        });
      }

      // 2. Check for daily habits not done yet (e.g. late evening reminder)
      if (currentHour >= 20) {
        let pendingCount = 0;
        habits.forEach(habit => {
          const isDone = habitLogs.some(log => log.habitId === habit.id && log.date === todayStr && log.completed);
          if (!isDone) pendingCount++;
        });

        if (pendingCount > 0) {
          sendNotification("Evening Habit Reminder", {
            body: `You have ${pendingCount} habits left to strike off today. Keep the streak alive!`
          });
        }
      }
    };

    // Run check 1 minute after load, then every 15 minutes
    const initialTimeout = setTimeout(checkReminders, 60000);
    const intervalId = setInterval(checkReminders, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [tasks, habits, habitLogs]);
}
