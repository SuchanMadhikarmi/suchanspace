import React, { useMemo } from "react";
import { useExpenses } from "../../hooks/useExpenses";
import { formatNRS } from "../../utils/currencyFormat";
import { Trash2, Calendar, Search } from "lucide-react";

export const ExpenseHistory: React.FC = () => {
  const { recentExpenses, categories, deleteExpense } = useExpenses();
  const [searchTerm, setSearchTerm] = React.useState("");

  const categoryMap = useMemo(() => {
    return categories.reduce(
      (acc, cat) => {
        acc[cat.id!] = cat;
        return acc;
      },
      {} as Record<string, (typeof categories)[0]>,
    );
  }, [categories]);

  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return recentExpenses;
    const term = searchTerm.toLowerCase();
    return recentExpenses.filter(
      (exp) =>
        exp.description?.toLowerCase().includes(term) ||
        (exp.tags && exp.tags.join(" ").toLowerCase().includes(term)) ||
        categoryMap[exp.categoryId]?.name.toLowerCase().includes(term),
    );
  }, [recentExpenses, searchTerm, categoryMap]);

  return (
    <div className="card flex flex-col h-full">
      <div
        className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-black/5/50 rounded-t-xl"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-bold text-[var(--text)]">
          Expense History
        </h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={16}
          />
          <input
            
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-sm border-[var(--border)] rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0">
        {filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-[var(--muted)]">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p>No expenses found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredExpenses.map((expense) => {
              const category = categoryMap[expense.categoryId];
              return (
                <div
                  key={expense.id}
                  className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{
                        backgroundColor: `${category?.color || "#3B82F6"}20`,
                        color: category?.color || "#3B82F6",
                      }}
                    >
                      {category?.icon || "🏷️"}
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--text)]">
                        {expense.description || category?.name || "Unknown"}
                      </h4>
                      <p className="text-xs text-[var(--muted)] flex items-center gap-1">
                        {expense.date}
                        {expense.isRecurring && (
                          <span className="px-1.5 py-0.5 bg-[var(--highlight)] text-[var(--green)] rounded text-[10px] font-medium ml-1">
                            Recurring
                          </span>
                        )}
                        {expense.tags && expense.tags.length > 0 && (
                          <span className="ml-2 text-[var(--muted)] truncate">
                            {expense.tags.map((t) => `#${t}`).join(" ")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-[var(--text)]">
                      {formatNRS(expense.amount)}
                    </span>
                    <button
                      onClick={() => expense.id && deleteExpense(expense.id)}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
