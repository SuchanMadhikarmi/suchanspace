import { useState, useMemo } from "react";
import { calcAnnualTax } from "../../utils/taxCalc";
import { formatNRS } from "../../utils/currencyFormat";
import { Calculator } from "lucide-react";
import { useIncome } from "../../hooks/useIncome";

export function TaxEstimator() {
  const { entries } = useIncome();

  // Try to estimate annual income based on this year's entries
  const currentYear = new Date().getFullYear().toString();
  const thisYearEntries = entries.filter((e) => e.date.startsWith(currentYear));
  const estimatedAnnualIncome = thisYearEntries.reduce(
    (acc, e) => acc + e.amount,
    0,
  );

  // States
  const [annualIncome, setAnnualIncome] = useState(
    estimatedAnnualIncome.toString(),
  );
  const [bonus, setBonus] = useState("0");

  const taxDetails = useMemo(() => {
    const totalIncome =
      (parseFloat(annualIncome) || 0) + (parseFloat(bonus) || 0);
    return calcAnnualTax(totalIncome);
  }, [annualIncome, bonus]);

  return (
    <div className="card p-6 max-w-4xl mx-auto">
      <h3
        className="text-xl font-bold mb-6 flex items-center gap-2"
        style={{ color: "var(--green)" }}
      >
        <Calculator className="w-6 h-6" />
        Nepal Income Tax Estimator (FY 80/81 based logic)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Annual Salary (NRS)
            </label>
            <input
              
              type="number"
              min="0"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Annual Bonus/Dashain Allowance (NRS)
            </label>
            <input
              
              type="number"
              min="0"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
            />
          </div>
        </div>

        <div
          className="bg-black/5 p-6 rounded-lg border-[var(--border)]"
          style={{ borderColor: "var(--border)" }}
        >
          <h4 className="text-lg font-semibold text-[var(--text)] mb-4">
            Tax Breakdown
          </h4>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Total Taxable Income:</span>
              <span className="font-medium">
                {formatNRS(
                  (parseFloat(annualIncome) || 0) + (parseFloat(bonus) || 0),
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Annual Tax Liability:</span>
              <span className="font-medium text-[var(--danger)]">
                {formatNRS(taxDetails.taxPayable)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Monthly Tax (Avg):</span>
              <span className="font-medium" style={{ color: "var(--green)" }}>
                {formatNRS(taxDetails.taxPayable / 12)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
