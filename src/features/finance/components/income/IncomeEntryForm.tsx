import React, { useState } from "react";
import { useIncome } from "../../hooks/useIncome";
import { PlusCircle } from "lucide-react";
import type { IncomeStream } from "../../../../db/db";

export function IncomeEntryForm({ streams }: { streams: IncomeStream[] }) {
  const { addEntry } = useIncome();
  const [streamId, setStreamId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [taxDeducted, setTaxDeducted] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamId || !amount || !date) return;

    const grossAmount = parseFloat(amount);
    const tax = taxDeducted ? parseFloat(taxDeducted) : 0;

    await addEntry({
      streamId,
      date,
      amount: grossAmount,
      description,
      isRecurring,
      taxDeducted: tax,
      netAmount: grossAmount - tax,
    });

    setAmount("");
    setDescription("");
    setTaxDeducted("");
  };

  if (streams.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)] mb-4">
          You need to create an income stream first.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <PlusCircle className="w-5 h-5" style={{ color: "var(--green)" }} />
        Add Income
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Income Stream
          </label>
          <select
            
            required
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
          >
            <option value="">Select a stream...</option>
            {streams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Date
          </label>
          <input
            
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Gross Amount (NRS)
          </label>
          <input
            
            type="number"
            required
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Tax Deducted (NRS)
          </label>
          <input
            
            type="number"
            min="0"
            step="0.01"
            value={taxDeducted}
            onChange={(e) => setTaxDeducted(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Description
          </label>
          <input
            
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g., May Salary, Upwork project"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded focus:ring-indigo-500 h-4 w-4"
            style={{ color: "var(--green)" }}
          />
          <label htmlFor="isRecurring" className="text-sm text-[var(--text)]">
            Recurring Income
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-700 transition"
        >
          Save Income Entry
        </button>
      </form>
    </div>
  );
}
