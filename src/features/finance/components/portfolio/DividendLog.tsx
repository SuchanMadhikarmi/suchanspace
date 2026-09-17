import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../../db/db";
import { formatNRS } from "../../utils/currencyFormat";

export const DividendLog: React.FC = () => {
  const dividends =
    useLiveQuery(() => db.dividends.reverse().sortBy("date")) || [];
  const [isAdding, setIsAdding] = useState(false);

  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !amount || !date) return;

    await db.dividends.add({
      symbol: symbol.toUpperCase(),
      amount: parseFloat(amount),
      date,
      notes,
      createdAt: Date.now(),
    });

    setSymbol("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setIsAdding(false);
  };

  const handleDelete = async (id?: number) => {
    if (id && window.confirm("Are you sure you want to delete this log?")) {
      await db.dividends.delete(id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-[var(--text)] dark:">
          Dividend & Bonus Log
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 bg-[var(--green)] hover:bg-[var(--green)] rounded-md text-sm font-medium transition-colors"
        >
          {isAdding ? "Cancel" : "Add Log"}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="mb-6 bg-black/5 /50 p-4 rounded-lg space-y-4 border-[var(--border)] dark:"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Symbol
              </label>
              <input
                
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., NABIL"
                className="w-full rounded-md border-[var(--border)] shadow-sm"
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Amount (Rs.)
              </label>
              <input
                
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 5000"
                className="w-full rounded-md border-[var(--border)] shadow-sm"
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Date
              </label>
              <input
                
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border-[var(--border)] shadow-sm"
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Notes (Optional)
              </label>
              <input
                
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Cash dividend FY 79/80"
                className="w-full rounded-md border-[var(--border)] shadow-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--green)] rounded-md hover:bg-[var(--green)] transition font-medium text-sm"
            >
              Save Entry
            </button>
          </div>
        </form>
      )}

      {dividends.length === 0 ? (
        <div className="text-center py-6 text-[var(--muted)] dark:text-[var(--muted)]">
          No dividend logs found. Click 'Add Log' to start tracking.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] dark:divide-gray-700">
            <thead className="bg-black/5">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Symbol
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Notes
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--border)] dark:divide-gray-700">
              {dividends.map((div) => (
                <tr
                  key={div.id}
                  className="hover:bg-black/5 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text)] dark:text-gray-100">
                    {div.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--green)] dark:text-blue-400">
                    {div.symbol}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                    style={{ color: "var(--green)" }}
                  >
                    {formatNRS(div.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)] dark:text-[var(--muted)]">
                    {div.notes || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(div.id)}
                      className="text-[var(--danger)] hover:text-red-900 dark:hover:"
                      style={{ color: "var(--danger)" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
