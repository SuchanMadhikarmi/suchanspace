import { useState, useEffect } from 'react';
import { db } from '../../../db/db';
import type { RecurringExpense, IncomeEntry, Expense, Holding } from '../../../db/db';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { liveQuery } from 'dexie';

export function useFinanceAnalytics() {
  const [analytics, setAnalytics] = useState({
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    netWorth: 0,
    portfolioValue: 0,
    monthlyCashflow: [] as { name: string; income: number; expense: number }[],
    recurringExpensesDueToday: [] as RecurringExpense[],
  });

  useEffect(() => {
    const observable = liveQuery(async () => {
      const now = new Date();
      const start = startOfMonth(now).toISOString();
      const end = endOfMonth(now).toISOString();

      // Income this month
      const incomes = await db.incomeEntries
        .where('date')
        .between(start, end)
        .toArray();
      const thisMonthIncome = incomes.reduce((sum: number, item: IncomeEntry) => sum + item.amount, 0);

      // Expenses this month
      const expenses = await db.expenses
        .where('date')
        .between(start, end)
        .toArray();
      const thisMonthExpense = expenses.reduce((sum: number, item: Expense) => sum + item.amount, 0);

      // Holdings
      const holdings = await db.holdings.toArray();
      const portfolioValue = holdings.reduce((sum: number, h: Holding) => sum + (h.shares * (h.currentPrice || h.avgPrice)), 0);

      // Net Worth (Latest snapshot + portfolio update)
      const latestSnapshot = await db.netWorthSnapshots.orderBy('date').last();
      let totalAssets = latestSnapshot ? latestSnapshot.totalAssets : 0;
      const totalLiabilities = latestSnapshot ? latestSnapshot.totalLiabilities : 0;
      
      // Let's add portfolio value if it wasn't already in assets
      totalAssets += portfolioValue;
      const netWorth = totalAssets - totalLiabilities;

      // Monthly Cashflow chart (last 6 months)
      const monthlyCashflow = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mStart = startOfMonth(d).toISOString();
        const mEnd = endOfMonth(d).toISOString();

        const mIncomes = await db.incomeEntries.where('date').between(mStart, mEnd).toArray();
        const mExpenses = await db.expenses.where('date').between(mStart, mEnd).toArray();

        monthlyCashflow.push({
          name: format(d, 'MMM'),
          income: mIncomes.reduce((sum: number, x: IncomeEntry) => sum + x.amount, 0),
          expense: mExpenses.reduce((sum: number, x: Expense) => sum + x.amount, 0),
        });
      }

      // Check recurring expenses due today
      const allRecurring = await db.recurringExpenses.filter((r: RecurringExpense) => r.isActive).toArray();
      const todayStr = format(now, 'yyyy-MM-dd');
      
      const dueToday = allRecurring.filter((r: RecurringExpense) => {
        if (!r.nextDueDate) return false;
        try {
          const due = format(parseISO(r.nextDueDate), 'yyyy-MM-dd');
          return due === todayStr;
        } catch {
          return false;
        }
      });

      // Avoid prompting if already logged today
      const recurringExpensesDueToday: RecurringExpense[] = [];
      for (const r of dueToday) {
        const existing = await db.expenses
          .where('categoryId').equals(r.categoryId)
          .filter((e: Expense) => e.date.startsWith(todayStr))
          .first();
        if (!existing) {
          recurringExpensesDueToday.push(r);
        }
      }

      return {
        thisMonthIncome,
        thisMonthExpense,
        netWorth,
        portfolioValue,
        monthlyCashflow,
        recurringExpensesDueToday,
      };
    });

    const sub = observable.subscribe({
      next: (val) => setAnalytics(val),
      error: (err) => console.error(err)
    });

    return () => sub.unsubscribe();
  }, []);

  return analytics;
}


