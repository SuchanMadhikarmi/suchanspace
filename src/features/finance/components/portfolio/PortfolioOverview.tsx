import { useState } from "react";
import { usePortfolio } from "../../hooks/usePortfolio";
import { formatNRS, formatPnL } from "../../utils/currencyFormat";
import TradeHistory from "./TradeHistory";
import TradeForm from "./TradeForm";
import UpdatePricesPanel from "./UpdatePricesPanel";
import { IPOTracker } from "./IPOTracker";
import { DividendLog } from "./DividendLog";
import { SectorAllocationChart } from "./SectorAllocationChart";

export default function PortfolioOverview() {
  const { holdings } = usePortfolio();
  const [activeTab, setActiveTab] = useState<
    "holdings" | "history" | "ipos" | "dividends" | "analytics"
  >("holdings");
  const [isTradeFormOpen, setIsTradeFormOpen] = useState(false);
  const [isPricePanelOpen, setIsPricePanelOpen] = useState(false);

  // Calculate top line metrics
  let totalInvested = 0;
  let totalCurrentValue = 0;

  holdings.forEach((h) => {
    const invested = h.shares * h.avgPrice;
    totalInvested += invested;
    if (h.currentPrice) {
      totalCurrentValue += h.shares * h.currentPrice;
    } else {
      totalCurrentValue += invested; // Fallback if no LTP
    }
  });

  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent =
    totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="text-sm font-medium text-[var(--muted)] mb-1">
            Total Value
          </div>
          <div className="text-2xl font-bold text-[var(--text)]">
            {formatNRS(totalCurrentValue)}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-[var(--muted)] mb-1">
            Total Invested
          </div>
          <div className="text-2xl font-bold text-[var(--text)]">
            {formatNRS(totalInvested)}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-[var(--muted)] mb-1">
            Unrealized P&L
          </div>
          <div
            className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-600" : "text-[var(--danger)]"}`}
          >
            {formatPnL(totalPnL, totalPnLPercent)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex space-x-1 card p-1">
          <button
            onClick={() => setActiveTab("holdings")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "holdings"
                ? "bg-[var(--border)] text-[var(--text)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Holdings
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "history"
                ? "bg-[var(--border)] text-[var(--text)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Trade History
          </button>
          <button
            onClick={() => setActiveTab("ipos")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "ipos" ? "bg-[var(--border)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
          >
            IPOs
          </button>
          <button
            onClick={() => setActiveTab("dividends")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "dividends" ? "bg-[var(--border)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
          >
            Dividends
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "analytics" ? "bg-[var(--border)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
          >
            Analytics
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setIsPricePanelOpen(true)}
            className="px-4 py-2 text-sm font-medium text-[var(--green)] bg-[var(--highlight)] hover:bg-[var(--highlight)] rounded-lg transition-colors"
          >
            Update Current Prices
          </button>
          <button
            onClick={() => setIsTradeFormOpen(true)}
            className="px-4 py-2 text-sm font-medium bg-[var(--green)] hover:bg-[var(--green)] rounded-lg shadow-sm transition-colors"
          >
            + Add Trade
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "holdings" ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="bg-black/5 text-xs uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <th className="px-6 py-3 font-semibold">Symbol</th>
                  <th className="px-6 py-3 font-semibold text-right">Qty</th>
                  <th className="px-6 py-3 font-semibold text-right">
                    WACC (Rs)
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    LTP (Rs)
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">
                    Current Value
                  </th>
                  <th className="px-6 py-3 font-semibold text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {holdings.map((h) => {
                  const invested = h.shares * h.avgPrice;
                  const currentPrice = h.currentPrice || h.avgPrice;
                  const currentValue = h.shares * currentPrice;
                  const pnl = currentValue - invested;
                  const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-black/5/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-[var(--text)]">
                        {h.symbol}
                      </td>
                      <td className="px-6 py-4 text-right text-[var(--muted)]">
                        {h.shares}
                      </td>
                      <td className="px-6 py-4 text-right text-[var(--muted)]">
                        {formatNRS(h.avgPrice, {
                          showSymbol: false,
                          compact: false,
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-[var(--text)]">
                        {formatNRS(currentPrice, { showSymbol: false })}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-[var(--text)]">
                        {formatNRS(currentValue)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right text-sm font-semibold ${pnl >= 0 ? "text-green-600" : "text-[var(--danger)]"}`}
                      >
                        {formatPnL(pnl, pnlPercent)}
                      </td>
                    </tr>
                  );
                })}

                {holdings.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-[var(--muted)]"
                    >
                      <div className="font-medium text-[var(--text)] mb-1">
                        No holdings found
                      </div>
                      <div className="text-sm">
                        Add trades to build your portfolio.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "history" ? (
        <TradeHistory />
      ) : activeTab === "ipos" ? (
        <IPOTracker />
      ) : activeTab === "dividends" ? (
        <DividendLog />
      ) : activeTab === "analytics" ? (
        <SectorAllocationChart />
      ) : null}

      {/* Off-canvas forms */}
      <TradeForm
        isOpen={isTradeFormOpen}
        onClose={() => setIsTradeFormOpen(false)}
      />
      <UpdatePricesPanel
        isOpen={isPricePanelOpen}
        onClose={() => setIsPricePanelOpen(false)}
      />
    </div>
  );
}
