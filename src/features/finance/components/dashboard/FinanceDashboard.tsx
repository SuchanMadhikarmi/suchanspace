import React, { useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useFinanceAnalytics } from "../../hooks/useFinanceAnalytics";
import { db } from "../../../../db/db";
import type { RecurringExpense } from "../../../../db/db";

const formatNRS = (value: number) => {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const FinanceDashboard: React.FC = () => {
  const {
    thisMonthIncome,
    thisMonthExpense,
    netWorth,
    portfolioValue,
    monthlyCashflow,
    recurringExpensesDueToday,
  } = useFinanceAnalytics();

  useEffect(() => {
    if (recurringExpensesDueToday && recurringExpensesDueToday.length > 0) {
      // In a real app we might show a Modal, but the prompt says popup/toast
      // We will show a simple window.confirm or alert for now, or just auto-log them
      recurringExpensesDueToday.forEach(async (r: RecurringExpense) => {
        const confirmLog = window.confirm(
          `Recurring Expense Due: ${r.name} (${formatNRS(r.amount)}). Log it now?`,
        );
        if (confirmLog) {
          await db.expenses.add({
            categoryId: r.categoryId,
            amount: r.amount,
            date: new Date().toISOString(),
            isSubscription: true,
            notes: `Auto-logged: ${r.name}`,
            createdAt: Date.now(),
          });

          // update next due date (simple implementation)
          const nextDate = new Date();
          if (r.frequency === "monthly")
            nextDate.setMonth(nextDate.getMonth() + 1);
          if (r.frequency === "yearly")
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          if (r.frequency === "weekly")
            nextDate.setDate(nextDate.getDate() + 7);

          await db.recurringExpenses.update(r.id!, {
            nextDueDate: nextDate.toISOString(),
          });
        }
      });
    }
  }, [recurringExpensesDueToday]);

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 mb-20 md:mb-0">
      <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
        Finance Dashboard
      </h2>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="text-sm mb-1" style={{ color: "var(--muted)" }}>
            Net Worth
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {formatNRS(netWorth)}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm mb-1" style={{ color: "var(--muted)" }}>
            NEPSE Portfolio
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {formatNRS(portfolioValue)}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm mb-1" style={{ color: "var(--muted)" }}>
            This Month's Income
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--green)" }}>
            {formatNRS(thisMonthIncome)}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm mb-1" style={{ color: "var(--muted)" }}>
            This Month's Expenses
          </div>
          <div className="text-2xl font-bold text-[var(--danger)]">
            {formatNRS(thisMonthExpense)}
          </div>
        </div>
      </div>

      {/* Monthly Cashflow Chart */}
      <div className="card p-6">
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text)" }}
        >
          Cashflow (6 Months)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyCashflow}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `Rs.${val / 1000}k`}
                tick={{ fill: "#6B7280" }}
              />
              <RechartsTooltip
                cursor={{ fill: "rgba(107, 114, 128, 0.1)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any) => formatNRS(value as number)}
              />
              <Legend iconType="circle" />
              <Bar
                dataKey="income"
                name="Income"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
