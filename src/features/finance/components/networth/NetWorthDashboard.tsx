import React, { useMemo, useState } from "react";
import { useNetWorth } from "../../hooks/useNetWorth";
import { formatNRS } from "../../utils/currencyFormat";
import { AssetLiabilityEditor } from "./AssetLiabilityEditor";
import { SavingsGoals } from "./SavingsGoals";
import { FIRECalculator } from "./FIRECalculator";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
export const NetWorthDashboard: React.FC = () => {
  const {
    assets,
    liabilities,
    snapshots,
    savingsGoals,
    currentNetWorth,
    totalAssets,
    totalLiabilities,
    addAsset,
    deleteAsset,
    addLiability,
    deleteLiability,
    addSnapshot,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
  } = useNetWorth();
  const [snapshotNotes, setSnapshotNotes] = useState("");
  const handleManualSnapshot = async () => {
    await addSnapshot({
      date: new Date().toISOString(),
      totalAssets,
      totalLiabilities,
      netWorth: currentNetWorth,
      notes: snapshotNotes,
    });
    setSnapshotNotes("");
  };
  const chartData = useMemo(() => {
    return snapshots.map((s) => ({
      date: format(new Date(s.date), "MMM yy"),
      netWorth: s.netWorth,
      assets: s.totalAssets,
      liabilities: s.totalLiabilities,
    }));
  }, [snapshots]);
  return (
    <div className="space-y-6">
      {" "}
      {/* Top Level Summary & Chart */}{" "}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {" "}
        <div
          className="lg:col-span-1 card p-6 bg-[var(--green)] text-[var(--bg)]"
          style={{ background: "var(--green)", color: "var(--bg)" }}
        >
          {" "}
          <h2 className="opacity-80 font-medium text-lg mb-1">
            Total Net Worth
          </h2>{" "}
          <div className="text-4xl font-bold mb-6">
            {formatNRS(currentNetWorth)}
          </div>{" "}
          <div className="space-y-3">
            {" "}
            <div
              className="flex justify-between items-center border-b pb-2"
              style={{ borderColor: "var(--border)" }}
            >
              {" "}
              <span className="opacity-80">Total Assets</span>{" "}
              <span className="font-semibold">
                {formatNRS(totalAssets)}
              </span>{" "}
            </div>{" "}
            <div
              className="flex justify-between items-center border-b pb-2"
              style={{ borderColor: "var(--border)" }}
            >
              {" "}
              <span className="opacity-80">Total Liabilities</span>{" "}
              <span className="font-semibold">
                {formatNRS(totalLiabilities)}
              </span>{" "}
            </div>{" "}
          </div>{" "}
          <div className="mt-6 flex flex-col gap-2">
            {" "}
            <input
              
              placeholder="Snapshot Note (Optional)"
              value={snapshotNotes}
              onChange={(e) => setSnapshotNotes(e.target.value)}
            />{" "}
            <button
              onClick={handleManualSnapshot}
              className="w-full py-2 rounded font-semibold hover:bg-black/5 transition"
              style={{ color: "var(--green)" }}
            >
              {" "}
              Take Snapshot Now{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        <div
          className="lg:col-span-2 bg-slate-800 p-4 card"
          style={{ borderColor: "var(--border)" }}
        >
          {" "}
          <h3 className="text-lg font-bold mb-4">Net Worth History</h3>{" "}
          <div className="flex-1 min-h-[250px]">
            {" "}
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {" "}
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  {" "}
                  <defs>
                    {" "}
                    <linearGradient
                      id="colorNetWorth"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      {" "}
                      <stop
                        offset="5%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.8}
                      />{" "}
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0}
                      />{" "}
                    </linearGradient>{" "}
                  </defs>{" "}
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />{" "}
                  <YAxis
                    tickFormatter={(val: number) =>
                      `${(val / 1000).toFixed(0)}k`
                    }
                    width={60}
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />{" "}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />{" "}
                  <Tooltip
                    formatter={(value: any) => formatNRS(Number(value))}
                  />{" "}
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorNetWorth)"
                  />{" "}
                </AreaChart>{" "}
              </ResponsiveContainer>
            ) : (
              <div
                className="flex items-center justify-center h-full"
                style={{ color: "var(--muted)" }}
              >
                {" "}
                <p>
                  Not enough history. Take a snapshot to see the chart.
                </p>{" "}
              </div>
            )}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <AssetLiabilityEditor
        assets={assets}
        liabilities={liabilities}
        addAsset={addAsset}
        deleteAsset={deleteAsset}
        addLiability={addLiability}
        deleteLiability={deleteLiability}
      />{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {" "}
        <SavingsGoals
          goals={savingsGoals}
          addGoal={addSavingsGoal}
          updateGoal={updateSavingsGoal}
          deleteGoal={deleteSavingsGoal}
        />{" "}
        <FIRECalculator currentNetWorth={currentNetWorth} />{" "}
      </div>{" "}
    </div>
  );
};
