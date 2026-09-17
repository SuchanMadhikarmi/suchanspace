import React, { useState } from "react";
import { useIncome } from "../../hooks/useIncome";
import { Briefcase, Trash2, PlusCircle } from "lucide-react";
import type { IncomeStream } from "../../../../db/db";

export function IncomeStreamManager() {
  const { streams, addStream, deleteStream } = useIncome();
  const [name, setName] = useState("");
  const [type, setType] = useState<IncomeStream["type"]>("salary");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addStream({
      name: name.trim(),
      type,
      isActive: true, // Need this per type
    });

    setName("");
    setType("salary");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5" style={{ color: "var(--green)" }} />
          Income Streams
        </h3>

        <div className="space-y-4">
          {streams.length === 0 ? (
            <p className="text-[var(--muted)] text-sm text-center py-4">
              No income streams yet.
            </p>
          ) : (
            streams.map((stream) => (
              <div
                key={stream.id}
                className="flex justify-between items-center p-3 borderrounded-md hover:bg-black/5"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="bg-indigo-100 p-2 rounded-full"
                    style={{ color: "var(--green)" }}
                  >
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text)]">
                      {stream.name}
                    </p>
                    <p className="text-xs text-[var(--muted)] capitalize">
                      {stream.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => stream.id && deleteStream(stream.id)}
                  className="text-[var(--muted)] hover:text-[var(--danger)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5" style={{ color: "var(--green)" }} />
          Add New Stream
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Stream Name
            </label>
            <input
              
              type="text"
              required
              placeholder="E.g., Fulltime Job, Upwork..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Type
            </label>
            <select
              
              value={type}
              onChange={(e) => setType(e.target.value as IncomeStream["type"])}
            >
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
              <option value="dividend">Dividend</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-700 transition"
          >
            Create Stream
          </button>
        </form>
      </div>
    </div>
  );
}
