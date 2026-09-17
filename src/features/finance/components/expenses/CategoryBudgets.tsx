import React, { useMemo } from "react";
import { useExpenses } from "../../hooks/useExpenses";
import { formatNRS } from "../../utils/currencyFormat";

export const CategoryBudgets: React.FC = () => {
  const { categories, recentExpenses } = useExpenses();

  // Calculate this month's spending per category
  const categorySpending = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const spending: Record<string, number> = {};

    recentExpenses.forEach((exp) => {
      if (exp.date.startsWith(currentMonth)) {
        spending[exp.categoryId] = (spending[exp.categoryId] || 0) + exp.amount;
      }
    });

    return spending;
  }, [recentExpenses]);

  // Merge category info with spending
  const budgetData = useMemo(() => {
    return categories
      .filter((cat) => cat.budgetMonthly && cat.budgetMonthly > 0)
      .map((cat) => {
        const spent = categorySpending[cat.id!] || 0;
        const budget = cat.budgetMonthly!;
        const percent = Math.min(100, Math.round((spent / budget) * 100));

        let colorClass = "bg-[var(--green)]";
        if (percent >= 90) colorClass = "bg-[var(--danger)]";
        else if (percent >= 75) colorClass = "bg-yellow-500";
        else if (percent > 0)
          colorClass = cat.color ? `bg-[${cat.color}]` : "bg-[var(--green)]";

        return {
          ...cat,
          spent,
          percent,
          colorClass,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [categories, categorySpending]);

  if (budgetData.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)] mb-2">No active budgets found.</p>
        <p className="text-sm text-[var(--muted)]">
          Edit a category to set a monthly budget.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-[var(--text)] mb-4">
        Category Budgets
      </h2>
      <div className="space-y-6">
        {budgetData.map((data) => (
          <div key={data.id}>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{data.icon}</span>
                <div>
                  <h4 className="font-medium text-[var(--text)]">
                    {data.name}
                  </h4>
                  <p className="text-xs text-[var(--muted)]">
                    {data.percent}% of budget
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-semibold">{formatNRS(data.spent)}</span>
                <span className="text-sm text-[var(--muted)] ml-1">
                  / {formatNRS(data.budgetMonthly!)}
                </span>
              </div>
            </div>

            <div className="w-full bg-[var(--border)] rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${data.percent >= 90 ? "bg-[var(--danger)]" : data.percent >= 75 ? "bg-yellow-500" : "bg-[var(--green)]"}`}
                style={{
                  width: `${data.percent}%`,
                  backgroundColor:
                    data.percent < 75 && data.color ? data.color : undefined,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
