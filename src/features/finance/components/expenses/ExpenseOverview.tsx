import React, { useMemo } from "react";
import { QuickExpenseEntry } from "./QuickExpenseEntry";
import { CategoryBudgets } from "./CategoryBudgets";
import { ExpenseHistory } from "./ExpenseHistory";
import { useExpenses } from "../../hooks/useExpenses";
import { formatNRS } from "../../utils/currencyFormat";
import { ArrowDownRight, TrendingDown } from "lucide-react";

export const ExpenseOverview: React.FC = () => {
  const { recentExpenses } = useExpenses();

  const currentMonthTotal = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    return recentExpenses
      .filter((exp) => exp.date.startsWith(currentMonth))
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [recentExpenses]);

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Top Header/Summary */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
            <TrendingDown className="text-[var(--danger)]" />
            Monthly Spending
          </h2>
          <p className="text-[var(--muted)] text-sm">
            Track your expenses and stay within budget.
          </p>
        </div>

        <div
          className="bg-red-50 px-6 py-3 rounded-xl border-red-100 flex items-center gap-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="p-2 bg-red-100 rounded-lg text-[var(--danger)]">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <p className="text-xs text-[var(--danger)] font-medium uppercase tracking-wider">
              This Month
            </p>
            <p className="text-2xl font-bold text-[var(--danger)]">
              {formatNRS(currentMonthTotal)}
            </p>
          </div>
        </div>
      </div>

      <QuickExpenseEntry />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 overflow-hidden h-[600px] flex flex-col">
          <ExpenseHistory />
        </div>
        <div className="flex flex-col gap-6 overflow-hidden h-[600px] overflow-y-auto pr-2 pb-4">
          <CategoryBudgets />
        </div>
      </div>
    </div>
  );
};
