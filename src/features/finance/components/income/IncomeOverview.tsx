import { useState } from "react";
import { useIncome } from "../../hooks/useIncome";
import { IncomeEntryForm } from "./IncomeEntryForm";
import { IncomeHistory } from "./IncomeHistory";
import { IncomeStreamManager } from "./IncomeStreamManager";
import { TaxEstimator } from "./TaxEstimator";
import { formatNRS } from "../../utils/currencyFormat";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function IncomeOverview() {
  const { entries, streams } = useIncome();
  const [activeTab, setActiveTab] = useState<"overview" | "streams" | "tax">(
    "overview",
  );

  const totalGross = entries.reduce(
    (acc, entry) => acc + (entry.amount || 0),
    0,
  );
  const totalNet = entries.reduce(
    (acc, entry) => acc + (entry.netAmount || 0),
    0,
  );
  const totalTax = entries.reduce(
    (acc, entry) => acc + (entry.taxDeducted || 0),
    0,
  );

  // Group by month for chart
  const monthlyData: Record<string, number> = {};
  entries.forEach((entry) => {
    const month = entry.date.slice(0, 7); // YYYY-MM
    monthlyData[month] = (monthlyData[month] || 0) + entry.netAmount;
  });

  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, amount]) => ({ month, amount }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Income Management</h2>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-md ${activeTab === "overview" ? "bg-indigo-600 text-white" : "bg-gray-200 text-[var(--text)]"}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeTab === "streams" ? "bg-indigo-600 text-white" : "bg-gray-200 text-[var(--text)]"}`}
            onClick={() => setActiveTab("streams")}
          >
            Streams
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeTab === "tax" ? "bg-indigo-600 text-white" : "bg-gray-200 text-[var(--text)]"}`}
            onClick={() => setActiveTab("tax")}
          >
            Tax Estimator
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-[var(--muted)] text-sm font-medium mb-1">
                Total Gross (All Time)
              </p>
              <p className="text-2xl font-bold text-[var(--text)]">
                {formatNRS(totalGross)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-[var(--muted)] text-sm font-medium mb-1">
                Total Net (All Time)
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--green)" }}
              >
                {formatNRS(totalNet)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-[var(--muted)] text-sm font-medium mb-1">
                Tax Deducted (All Time)
              </p>
              <p className="text-2xl font-bold text-[var(--danger)]">
                {formatNRS(totalTax)}
              </p>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">
                Net Income (Last 6 Months)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `Rs ${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value: any) => formatNRS(value)}
                      cursor={{ fill: "#F3F4F6" }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <IncomeEntryForm streams={streams} />
            </div>
            <div className="lg:col-span-2">
              <IncomeHistory entries={entries} streams={streams} />
            </div>
          </div>
        </>
      )}

      {activeTab === "streams" && <IncomeStreamManager />}
      {activeTab === "tax" && <TaxEstimator />}
    </div>
  );
}
