import { useState, useEffect } from "react";
import { usePortfolio } from "../../hooks/usePortfolio";

interface UpdatePricesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdatePricesPanel({
  isOpen,
  onClose,
}: UpdatePricesPanelProps) {
  const { holdings, updateHoldingsPrice } = usePortfolio();
  const [prices, setPrices] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen) {
      const initialPrices: Record<number, string> = {};
      holdings.forEach((h) => {
        initialPrices[h.id!] = h.currentPrice ? String(h.currentPrice) : "";
      });
      setPrices(initialPrices);
    }
  }, [isOpen, holdings]);

  const handleSave = async () => {
    const updates = Object.entries(prices)
      .map(([id, priceStr]) => {
        return { id: Number(id), currentPrice: Number(priceStr) };
      })
      .filter((u) => u.currentPrice > 0);

    if (updates.length > 0) {
      await updateHoldingsPrice(updates);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="fixed inset-y-0 right-0 max-w-sm w-full flex">
        <div className="w-screen max-w-md h-full bg-white shadow-xl flex flex-col">
          <div
            className="py-6 px-4 bg-black/5 sm:px-6 border-b border-[var(--border)] flex items-center justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <h2
              className="text-lg font-medium text-[var(--text)]"
              id="slide-over-title"
            >
              Update Market Prices
            </h2>
            <div className="ml-3 h-7 flex items-center">
              <button
                type="button"
                onClick={onClose}
                className="bg-black/5 rounded-md text-[var(--muted)] hover:text-[var(--muted)]"
              >
                <span className="sr-only">Close panel</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative flex-1 py-6 px-4 sm:px-6 h-full flex flex-col">
            <p className="text-sm text-[var(--muted)] mb-6">
              Update the Last Traded Price (LTP) for your holdings to calculate
              current unrealized P&L.
            </p>

            <div className="flex-1 overflow-y-auto space-y-4">
              {holdings.length === 0 ? (
                <div className="text-center text-[var(--muted)] py-8 text-sm">
                  No holdings found. Add trades to generate holdings.
                </div>
              ) : (
                holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between p-3 border-[var(--border)] rounded-lg"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div>
                      <div className="font-semibold text-[var(--text)]">
                        {holding.symbol}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {holding.shares} shares • WACC: Rs{" "}
                        {holding.avgPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="w-1/3">
                      <input
                        
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="LTP"
                        value={prices[holding.id!] || ""}
                        onChange={(e) =>
                          setPrices({
                            ...prices,
                            [holding.id!]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm border-[var(--border)] rounded shadow-sm focus:outline-none focus:ring-1"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              className="pt-6 mt-4 border-t border-[var(--border)]"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={handleSave}
                disabled={holdings.length === 0}
                className="w-full bg-[var(--green)] py-2 px-4 rounded-md font-medium hover:bg-[var(--green)] disabled:opacity-50 transition-colors"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
