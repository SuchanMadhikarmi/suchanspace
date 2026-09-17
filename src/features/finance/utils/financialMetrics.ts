export function calcFinancialHealthScore(metrics: {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
}): { score: number; maxScore: 100 } {
  const { monthlyIncome, monthlyExpenses, totalAssets, totalLiabilities } = metrics;
  let score = 0;

  // 1. Savings Rate (max 40 points)
  // 0% -> 0 pts, 20%+ -> 40 pts
  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? savings / monthlyIncome : 0;
  score += Math.min(40, Math.max(0, (savingsRate / 0.2) * 40));

  // 2. Debt-to-Asset Ratio (max 30 points)
  // > 100% -> 0 pts, 0% -> 30 pts
  const dtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 1;
  score += Math.max(0, 30 - dtRatio * 30);

  // 3. Basic Emergency Fund (max 30 points)
  // Have at least 3x monthly expenses in assets?
  const eFundRatio = monthlyExpenses > 0 ? totalAssets / (monthlyExpenses * 3) : 1;
  score += Math.min(30, Math.max(0, eFundRatio * 30));

  return { score: Math.round(score), maxScore: 100 };
}
