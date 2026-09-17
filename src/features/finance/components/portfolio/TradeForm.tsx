import React, { useState } from "react";
import { X } from "lucide-react";
import { usePortfolio } from "../../hooks/usePortfolio";
import { calcBuyCost, calcSellRevenue } from "../../utils/nepseCalc";
import { formatNRS } from "../../utils/currencyFormat";

interface TradeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TradeForm({ isOpen, onClose }: TradeFormProps) {
  if (!isOpen) return null;
  const { addTrade } = usePortfolio();

  const [type, setType] = useState<"buy" | "sell">("buy");
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !shares || !price) return;

    await addTrade({
      symbol: symbol.toUpperCase(),
      type,
      shares: Number(shares),
      price: Number(price),
      date,
      fees: 0, // hook will auto-calculate
    });

    // Reset and close
    setSymbol("");
    setShares("");
    setPrice("");
    onClose();
  };

  const currentShares = Number(shares) || 0;
  const currentPrice = Number(price) || 0;

  let feeDisplay = null;
  if (currentShares > 0 && currentPrice > 0) {
    if (type === "buy") {
      const details = calcBuyCost(currentShares, currentPrice);
      feeDisplay = (
        <div className="mt-4 p-4 bg-black/5 rounded-lg text-sm space-y-2">
          <div className="flex justify-between">
            <span>Base Amount:</span>{" "}
            <span className="font-medium">{formatNRS(details.value)}</span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>Broker Commission:</span>{" "}
            <span>{formatNRS(details.commission)}</span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>SEBON Fee:</span> <span>{formatNRS(details.sebon)}</span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>DP Charge:</span> <span>{formatNRS(details.dp)}</span>
          </div>
          <div
            className="pt-2 mt-2 border-t border-[var(--border)] flex justify-between font-semibold"
            style={{ borderColor: "var(--border)" }}
          >
            <span>Total Cost:</span>{" "}
            <span className="text-[var(--danger)]">
              {formatNRS(details.totalCost)}
            </span>
          </div>
        </div>
      );
    } else {
      const details = calcSellRevenue(currentShares, currentPrice);
      feeDisplay = (
        <div className="mt-4 p-4 bg-black/5 rounded-lg text-sm space-y-2">
          <div className="flex justify-between">
            <span>Base Amount:</span>{" "}
            <span className="font-medium">{formatNRS(details.value)}</span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>Broker Commission:</span>{" "}
            <span>{formatNRS(details.commission)}</span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>SEBON Fee:</span> <span>{formatNRS(details.sebon)}</span>
          </div>
          <div
            className="pt-2 mt-2 border-t border-[var(--border)] flex justify-between font-semibold"
            style={{ borderColor: "var(--border)" }}
          >
            <span>Net Revenue:</span>{" "}
            <span className="" style={{ color: "var(--green)" }}>
              {formatNRS(details.netRevenue)}
            </span>
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            Note: Capital gains tax is not deducted here as WACC depends on
            external dates.
          </div>
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50/75 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="pointer-events-auto relative w-screen max-w-md">
          <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
            <div
              className="px-4 py-6 border-b flex justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="text-lg font-medium text-[var(--text)]">
                Add Trade
              </h2>
              <button onClick={onClose}>
                <X />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 h-full flex flex-col">
              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    Trade Type
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setType("buy")}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${type === "buy" ? "bg-[var(--green)] text-white" : "bg-[var(--border)] text-[var(--text)] hover:bg-gray-200"}`}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("sell")}
                      className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${type === "sell" ? "bg-[var(--danger)] text-white" : "bg-[var(--border)] text-[var(--text)] hover:bg-gray-200"}`}
                    >
                      Sell
                    </button>
                  </div>
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
                    className="w-full px-3 py-2 border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Symbol (NEPSE)
                  </label>
                  <input
                    
                    type="text"
                    required
                    placeholder="e.g. NABIL, NICA"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border-[var(--border)] rounded-md shadow-sm uppercase focus:outline-none focus:ring-1"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1">
                      Quantity
                    </label>
                    <input
                      
                      type="number"
                      required
                      min="1"
                      value={shares}
                      onChange={(e) =>
                        setShares(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-1"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-1">
                      Price (Rs)
                    </label>
                    <input
                      
                      type="number"
                      required
                      min="0.1"
                      step="0.1"
                      value={price}
                      onChange={(e) =>
                        setPrice(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-1"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                </div>

                {feeDisplay}
              </div>

              <div
                className="pt-6 border-t border-[var(--border)] mt-6"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  type="submit"
                  className="w-full bg-[var(--green)] py-2 px-4 rounded-md font-medium hover:bg-[var(--green)] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                >
                  Save Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
