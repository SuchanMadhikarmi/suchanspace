import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../../db/db";
import type { IpoApplication } from "../../../../db/db";
import { formatNRS } from "../../utils/currencyFormat";

export const IPOTracker: React.FC = () => {
  const ipos =
    useLiveQuery(() => db.ipoApplications.reverse().sortBy("applyDate")) || [];
  const [isAdding, setIsAdding] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [kittaApplied, setKittaApplied] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<IpoApplication["status"]>("applied");
  const [kittaAllotted, setKittaAllotted] = useState("");
  const [applyDate, setApplyDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !kittaApplied || !amount || !applyDate) return;

    await db.ipoApplications.add({
      companyName,
      symbol: symbol ? symbol.toUpperCase() : undefined,
      kittaApplied: parseInt(kittaApplied),
      amount: parseFloat(amount),
      status,
      kittaAllotted: kittaAllotted ? parseInt(kittaAllotted) : undefined,
      applyDate,
      createdAt: Date.now(),
    });

    setCompanyName("");
    setSymbol("");
    setKittaApplied("");
    setAmount("");
    setStatus("applied");
    setKittaAllotted("");
    setIsAdding(false);
  };

  const handleStatusChange = async (
    id: number | undefined,
    newStatus: IpoApplication["status"],
  ) => {
    if (!id) return;
    let allotted = 0;
    if (newStatus === "allotted") {
      const k = prompt("How many kitta were allotted?");
      if (k) allotted = parseInt(k, 10);
      else return; // Cancelled
    }

    await db.ipoApplications.update(id, {
      status: newStatus,
      kittaAllotted: newStatus === "allotted" ? allotted : undefined,
      resultDate: new Date().toISOString().split("T")[0],
    });
  };

  const getStatusBadge = (s: IpoApplication["status"]) => {
    switch (s) {
      case "applied":
        return (
          <span
            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[var(--highlight)] dark:bg-blue-900 dark:text-blue-200"
            style={{ color: "var(--green)" }}
          >
            Applied
          </span>
        );
      case "allotted":
        return (
          <span
            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 dark:text-green-200"
            style={{ color: "var(--green)" }}
          >
            Allotted
          </span>
        );
      case "not_allotted":
        return (
          <span
            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[var(--border)] text-[var(--text)] dark:"
            style={{ color: "var(--muted)" }}
          >
            Not Allotted
          </span>
        );
      case "refunded":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Refunded
          </span>
        );
      default:
        return null;
    }
  };

  const handleDelete = async (id?: number) => {
    if (id && window.confirm("Delete this IPO record?")) {
      await db.ipoApplications.delete(id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-[var(--text)] dark:">
          IPO & Right Share Tracker
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 bg-[var(--green)] hover:bg-[var(--green)] rounded-md text-sm font-medium transition-colors"
        >
          {isAdding ? "Cancel" : "Track IPO"}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="mb-6 bg-black/5 /50 p-4 rounded-lg space-y-4 border-[var(--border)] dark:"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Company Name
              </label>
              <input
                
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full rounded-md border-[var(--border)] dark:"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Symbol (Optional)
              </label>
              <input
                
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded-md border-[var(--border)] dark:"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Kitta Applied
              </label>
              <input
                
                type="number"
                value={kittaApplied}
                onChange={(e) => setKittaApplied(e.target.value)}
                required
                min="10"
                className="w-full rounded-md border-[var(--border)] dark:"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Total Amount (Rs.)
              </label>
              <input
                
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-md border-[var(--border)] dark:"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Apply Date
              </label>
              <input
                
                type="date"
                value={applyDate}
                onChange={(e) => setApplyDate(e.target.value)}
                required
                className="w-full rounded-md border-[var(--border)] dark:"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[var(--text)] mb-1"
                style={{ color: "var(--muted)" }}
              >
                Current Status
              </label>
              <select
                
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-md border-[var(--border)] dark:"
              >
                <option value="applied">Applied</option>
                <option value="allotted">Allotted</option>
                <option value="not_allotted">Not Allotted</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--green)] rounded-md hover:bg-[var(--green)] transition font-medium text-sm"
            >
              Save Entry
            </button>
          </div>
        </form>
      )}

      {ipos.length === 0 ? (
        <div className="text-center py-6 text-[var(--muted)] dark:text-[var(--muted)]">
          No IPO records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] dark:divide-gray-700">
            <thead className="bg-black/5">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase"
                  style={{ color: "var(--muted)" }}
                >
                  Company
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase"
                  style={{ color: "var(--muted)" }}
                >
                  Applied/Amount
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase"
                  style={{ color: "var(--muted)" }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase"
                  style={{ color: "var(--muted)" }}
                >
                  Result
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--border)] dark:divide-gray-700">
              {ipos.map((ipo) => (
                <tr
                  key={ipo.id}
                  className="hover:bg-black/5 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[var(--text)] dark:">
                      {ipo.companyName}
                    </div>
                    <div className="text-sm text-[var(--muted)] dark:text-[var(--muted)]">
                      {ipo.symbol || "-"} • {ipo.applyDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[var(--text)] dark:">
                      {ipo.kittaApplied} Kitta
                    </div>
                    <div className="text-sm font-semibold text-[var(--muted)]">
                      {formatNRS(ipo.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(ipo.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)] dark:text-[var(--muted)]">
                    {ipo.kittaAllotted ? (
                      <span
                        className="font-medium"
                        style={{ color: "var(--green)" }}
                      >
                        {ipo.kittaAllotted} Kitta
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {ipo.status === "applied" && (
                      <select
                        
                        onChange={(e) =>
                          handleStatusChange(ipo.id, e.target.value as any)
                        }
                        className="text-xs rounded border-[var(--border)] py-1"
                        value={ipo.status}
                      >
                        <option value="applied">Mark as...</option>
                        <option value="allotted">Allotted</option>
                        <option value="not_allotted">Not Allotted</option>
                      </select>
                    )}
                    <button
                      onClick={() => handleDelete(ipo.id)}
                      className="text-[var(--danger)] hover: dark:"
                      style={{ color: "var(--danger)" }}
                    >
                      Del
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
