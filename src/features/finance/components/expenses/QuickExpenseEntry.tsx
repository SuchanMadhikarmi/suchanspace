import React, { useState } from "react";
import { Plus, Tag, DollarSign, FileText, CreditCard } from "lucide-react";
import { useExpenses } from "../../hooks/useExpenses";

export const QuickExpenseEntry: React.FC = () => {
  const { categories, addExpense } = useExpenses();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "esewa" | "khalti" | "bank_transfer" | "card" | "fonepay"
  >("cash");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    await addExpense({
      amount: Number(amount),
      categoryId,
      date: new Date().toISOString().split("T")[0],
      description,
      paymentMethod,
      isRecurring: false,
      recurringId: null,
      tags: [],
      createdAt: Date.now(),
    });

    setAmount("");
    setDescription("");
  };

  return (
    <div className="card p-4 mb-6">
      <h3 className="text-sm font-semibold text-[var(--text)] mb-3 uppercase tracking-wider">
        Quick Entry
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <DollarSign
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
          />
          <input
            
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border-[var(--border)] rounded-lg focus:ring-2 outline-none"
            style={{ borderColor: "var(--border)" }}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="flex-1 relative">
          <Tag
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
          />
          <select
            
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border-[var(--border)] rounded-lg focus:ring-2 outline-none appearance-none"
            style={{ borderColor: "var(--border)" }}
            required
          >
            <option value="" disabled>
              Category
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 relative">
          <CreditCard
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
          />
          <select
            
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full pl-10 pr-3 py-2 border-[var(--border)] rounded-lg focus:ring-2 outline-none appearance-none"
            style={{ borderColor: "var(--border)" }}
            required
          >
            <option value="cash">Cash</option>
            <option value="esewa">eSewa</option>
            <option value="khalti">Khalti</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="fonepay">Fonepay</option>
          </select>
        </div>

        <div className="flex-1 relative">
          <FileText
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
          />
          <input
            
            type="text"
            placeholder="Description / Note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border-[var(--border)] rounded-lg focus:ring-2 outline-none"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <button
          type="submit"
          className="bg-[var(--green)] px-6 py-2 rounded-lg font-medium hover:bg-[var(--green)] transition flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add</span>
        </button>
      </form>
    </div>
  );
};
