import React, { useState } from "react";
import { formatNRS } from "../../utils/currencyFormat";

interface FIRECalculatorProps {
  currentNetWorth: number;
}

export const FIRECalculator: React.FC<FIRECalculatorProps> = ({
  currentNetWorth,
}) => {
  const [annualExpenses, setAnnualExpenses] = useState<number>(600000); // Default 6L as placeholder

  // 25x rule for FIRE
  const fireNumber = annualExpenses * 25;
  const progress = fireNumber > 0 ? (currentNetWorth / fireNumber) * 100 : 0;
  const percentStr = progress > 100 ? ">100" : progress.toFixed(1);

  return (
    <div className="card p-4">
      <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>
        FIRE Calculator
      </h3>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        Financial Independence, Retire Early. Calculate your FIRE number using
        the 25x rule (assuming a 4% safe withdrawal rate).
      </p>

      <div className="mb-4">
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--muted)" }}
        >
          Estimated Annual Expenses (NPR)
        </label>
        <input
          
          type="number"
          value={annualExpenses || ""}
          onChange={(e) => setAnnualExpenses(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded bg-[var(--white)] text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        />
      </div>

      <div className="bg-black/5 p-4 rounded-lg flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--muted)" }}
          >
            Your FIRE Number
          </span>
          <span className="text-lg font-bold" style={{ color: "var(--green)" }}>
            {formatNRS(fireNumber)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--muted)" }}
          >
            Current Net Worth
          </span>
          <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {formatNRS(currentNetWorth)}
          </span>
        </div>

        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: "var(--muted)" }}>Progress</span>
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {percentStr}%
            </span>
          </div>
          <div className="w-full bg-black/10 rounded-full h-2">
            <div
              className="bg-[var(--green)] h-2 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
