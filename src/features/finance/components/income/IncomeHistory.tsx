import { useState } from "react";
import { formatNRS } from "../../utils/currencyFormat";
import type { IncomeEntry, IncomeStream } from "../../../../db/db";
import { Filter, Trash2 } from "lucide-react";
import { useIncome } from "../../hooks/useIncome";

export function IncomeHistory({
  entries,
  streams,
}: {
  entries: IncomeEntry[];
  streams: IncomeStream[];
}) {
  const { deleteEntry } = useIncome();
  const [filterStream, setFilterStream] = useState<string>("all");

  const filteredEntries =
    filterStream === "all"
      ? entries
      : entries.filter((e) => e.streamId === filterStream);

  const getStreamName = (id: string) =>
    streams.find((s) => s.id === id)?.name || "Unknown";

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Income History</h3>

        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Filter className="w-4 h-4" />
          <select
            
            value={filterStream}
            onChange={(e) => setFilterStream(e.target.value)}
            className="border-[var(--border)] rounded-md py-1 pl-2 pr-6 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Streams</option>
            {streams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--muted)]">
          <thead
            className="bg-black/5 text-[var(--text)] border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Stream</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Gross</th>
              <th className="px-4 py-3 font-medium text-right">Tax</th>
              <th className="px-4 py-3 font-medium text-right">Net</th>
              <th className="px-4 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filteredEntries.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[var(--muted)]"
                >
                  No income entries found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-black/5">
                  <td className="px-4 py-3 whitespace-nowrap">{entry.date}</td>
                  <td className="px-4 py-3">{getStreamName(entry.streamId)}</td>
                  <td className="px-4 py-3">{entry.description || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    {formatNRS(entry.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--danger)]">
                    {entry.taxDeducted > 0 ? formatNRS(entry.taxDeducted) : "-"}
                  </td>
                  <td
                    className="px-4 py-3 text-right font-medium"
                    style={{ color: "var(--green)" }}
                  >
                    {formatNRS(entry.netAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => entry.id && deleteEntry(entry.id)}
                      className="text-[var(--muted)] hover:text-[var(--danger)] p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
