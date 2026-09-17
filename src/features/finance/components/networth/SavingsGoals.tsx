import React, { useState } from "react";
import type { SavingsGoal } from "../../../../db/db";
import { formatNRS } from "../../utils/currencyFormat";
interface SavingsGoalsProps {
  goals: SavingsGoal[];
  addGoal: (g: Omit<SavingsGoal, "id">) => Promise<any>;
  updateGoal: (id: number, changes: Partial<SavingsGoal>) => Promise<any>;
  deleteGoal: (id: number) => Promise<void>;
}
export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  goals,
  addGoal,
  updateGoal,
  deleteGoal,
}) => {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;
    await addGoal({
      name,
      targetAmount: parseFloat(target),
      currentAmount: current ? parseFloat(current) : 0,
      createdAt: Date.now(),
    });
    setName("");
    setTarget("");
    setCurrent("");
  };
  const updateProgress = async (
    id: number,
    currentAmt: number,
    addAmt: number,
  ) => {
    await updateGoal(id, { currentAmount: currentAmt + addAmt });
  };
  return (
    <div
      className="bg-slate-800 p-4 card"
      style={{ borderColor: "var(--border)" }}
    >
      {" "}
      <h3 className="text-lg font-bold mb-4">Savings Goals</h3>{" "}
      <div className="space-y-4 mb-6">
        {" "}
        {goals.map((g) => {
          const percent =
            Math.min(
              100,
              Math.round((g.currentAmount / g.targetAmount) * 100),
            ) || 0;
          return (
            <div
              key={g.id}
              className="rounded-lg p-3"
              style={{ borderColor: "var(--border)" }}
            >
              {" "}
              <div className="flex justify-between items-center mb-2">
                {" "}
                <span className="font-semibold">{g.name}</span>{" "}
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  {" "}
                  <span>
                    {formatNRS(g.currentAmount)} / {formatNRS(g.targetAmount)}
                  </span>{" "}
                  <button
                    onClick={() => g.id && deleteGoal(g.id)}
                    className="text-[var(--danger)] hover:text-[var(--danger)] ml-2 text-xs"
                  >
                    Del
                  </button>{" "}
                </div>{" "}
              </div>{" "}
              <div className="w-full bg-black/10 rounded-full h-2.5 mb-2">
                {" "}
                <div
                  className="bg-[var(--green)] h-2.5 rounded-full"
                  style={{ width: `${percent}%` }}
                ></div>{" "}
              </div>{" "}
              <div className="flex justify-between items-center text-xs">
                {" "}
                <span style={{ color: "var(--muted)" }}>
                  {percent}% Achieved
                </span>{" "}
                <div className="flex gap-1">
                  {" "}
                  <button
                    onClick={() =>
                      g.id && updateProgress(g.id, g.currentAmount, 1000)
                    }
                    className="px-2 py-1 bg-slate-100 bg-slate-600 rounded hover:bg-black/10"
                  >
                    +1k
                  </button>{" "}
                  <button
                    onClick={() =>
                      g.id && updateProgress(g.id, g.currentAmount, 5000)
                    }
                    className="px-2 py-1 bg-slate-100 bg-slate-600 rounded hover:bg-black/10"
                  >
                    +5k
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          );
        })}{" "}
        {goals.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No savings goals yet. Add one below!
          </p>
        )}{" "}
      </div>{" "}
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        {" "}
        <input
          
          placeholder="Goal Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />{" "}
        <div className="flex gap-2">
          {" "}
          <input
            
            placeholder="Target Amt"
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />{" "}
          <input
            
            placeholder="Starting Amt"
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />{" "}
        </div>{" "}
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--green)] rounded opacity-90 text-sm font-medium"
        >
          Add Savings Goal
        </button>{" "}
      </form>{" "}
    </div>
  );
};
