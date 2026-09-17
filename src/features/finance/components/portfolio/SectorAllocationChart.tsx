import React, { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { db } from "../../../../db/db";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#6B7280",
];

// Basic sector mapping fallback. Ideally this should be part of a larger asset mapping.
const SECTOR_MAP: Record<string, string> = {
  NABIL: "Commercial Banks",
  GBIME: "Commercial Banks",
  KBL: "Commercial Banks",
  NICA: "Commercial Banks",
  SANIMA: "Commercial Banks",
  NTC: "Telecom",
  CIT: "Investment",
  CBBL: "Microfinance",
  NUBL: "Microfinance",
  LICN: "Life Insurance",
  NLIC: "Life Insurance",
  SHIVM: "Manufacturing",
  HDL: "Manufacturing",
  API: "Hydropower",
  UPPER: "Hydropower",
  CHDC: "Hydropower",
};

const getSector = (symbol: string) =>
  SECTOR_MAP[symbol.toUpperCase()] || "Others";

export const SectorAllocationChart: React.FC = () => {
  const holdings = useLiveQuery(() => db.holdings.toArray()) || [];

  const data = useMemo(() => {
    const sectorTotals: Record<string, number> = {};
    let totalValue = 0;

    holdings.forEach((h) => {
      const sector = getSector(h.symbol);
      const value = h.shares * (h.currentPrice || h.avgPrice);
      if (value > 0) {
        sectorTotals[sector] = (sectorTotals[sector] || 0) + value;
        totalValue += value;
      }
    });

    return Object.entries(sectorTotals)
      .map(([name, value]) => ({
        name,
        value,
        percentage:
          totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value); // order by largest
  }, [holdings]);

  if (holdings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
          Sector Allocation
        </h2>
        <p className="text-[var(--muted)] dark:text-[var(--muted)]">
          No holdings to display.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white p-3 rounded-lg shadow-lg border-[var(--border)] dark:"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="font-semibold text-[var(--text)] dark:">
            {payload[0].name}
          </p>
          <p className="text-[var(--green)] dark:text-blue-400 font-medium">
            Rs.{" "}
            {payload[0].value.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {payload[0].payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
        Sector Allocation
      </h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              label={({ name, payload }) =>
                payload.percentage > 5 ? `${name} ${payload.percentage}%` : ""
              }
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
