// FY 2081/82 slabs (individual, includes SSF deduction of Rs 1 lakh)
export const NEPAL_TAX_SLABS_INDIVIDUAL = [
    { upTo: 500000,  rate: 0.01  },   // 1% on first Rs 5 lakh
    { upTo: 700000,  rate: 0.10  },   // 10% on Rs 5–7 lakh
    { upTo: 1000000, rate: 0.20  },   // 20% on Rs 7–10 lakh
    { upTo: 2000000, rate: 0.30  },   // 30% on Rs 10–20 lakh
    { upTo: Infinity, rate: 0.36 },   // 36% above Rs 20 lakh
  ]
  
  export function calcAnnualTax(grossAnnualIncome: number) {
    let taxableIncome = Math.max(0, grossAnnualIncome - 100000); // SSF deduction assumption
    let taxPayable = 0;
    
    let remainingIncome = taxableIncome;
    let prevThreshold = 0;
  
    for (const slab of NEPAL_TAX_SLABS_INDIVIDUAL) {
      if (remainingIncome > 0) {
        const taxableAtThisSlab = Math.min(remainingIncome, slab.upTo - prevThreshold);
        taxPayable += taxableAtThisSlab * slab.rate;
        remainingIncome -= taxableAtThisSlab;
        prevThreshold = slab.upTo;
      } else {
        break;
      }
    }
  
    const effectiveRate = grossAnnualIncome > 0 ? (taxPayable / grossAnnualIncome) * 100 : 0;
    const monthlyTakeHome = (grossAnnualIncome - taxPayable) / 12;
  
    return { grossIncome: grossAnnualIncome, taxableIncome, taxPayable, effectiveRate, monthlyTakeHome };
  }