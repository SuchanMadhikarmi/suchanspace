import { usePortfolio } from "../../hooks/usePortfolio";
import { formatNRS } from "../../utils/currencyFormat";

export default function TradeHistory() {
  const { trades } = usePortfolio();

  return (
    <div className="card overflow-hidden">
      <div
        className="px-6 py-4 border-b border-[var(--border)]"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="text-lg font-semibold text-[var(--text)]">
          Trade History
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="bg-black/5 text-xs uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]"
              style={{ borderColor: "var(--border)" }}
            >
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Symbol</th>
              <th className="px-6 py-3 font-semibold">Type</th>
              <th className="px-6 py-3 font-semibold text-right">Qty</th>
              <th className="px-6 py-3 font-semibold text-right">Price</th>
              <th className="px-6 py-3 font-semibold text-right">Fees</th>
              <th className="px-6 py-3 font-semibold text-right">Net Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {trades.map((trade) => {
              const netValue =
                trade.type === "buy"
                  ? trade.shares * trade.price + trade.fees
                  : trade.shares * trade.price - trade.fees;

              return (
                <tr
                  key={trade.id}
                  className="hover:bg-black/5/50 transition-colors"
                >
                  <td className="px-6 py-3 text-sm text-[var(--muted)]">
                    {trade.date}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-[var(--text)]">
                    {trade.symbol}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        trade.type === "buy"
                          ? "bg-[var(--highlight)] text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {trade.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-[var(--text)] text-right">
                    {trade.shares}
                  </td>
                  <td className="px-6 py-3 text-sm text-[var(--text)] text-right">
                    {formatNRS(trade.price, { showSymbol: false })}
                  </td>
                  <td className="px-6 py-3 text-sm text-[var(--muted)] text-right">
                    {formatNRS(trade.fees, { showSymbol: false })}
                  </td>
                  <td
                    className={`px-6 py-3 text-sm font-medium text-right ${trade.type === "buy" ? "text-[var(--text)]" : "text-green-600"}`}
                  >
                    {formatNRS(netValue)}
                  </td>
                </tr>
              );
            })}

            {trades.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-[var(--muted)]"
                >
                  No trades recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
