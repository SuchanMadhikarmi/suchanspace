export const NEPSE_FEES = {
  brokerCommission: 0.004,    // 0.4% both sides
  sebonFee: 0.00015,          // 0.015%
  dpFeePerBuy: 25,            // Rs 25 flat per buy
  capitalGainsTax: 0.075,     // 7.5% for individuals (short-term)
  capitalGainsTaxLT: 0.05,    // 5% long-term (>365 days)
}

export function calcBuyCost(qty: number, price: number) {
  const value = qty * price
  const commission = value * NEPSE_FEES.brokerCommission
  const sebon = value * NEPSE_FEES.sebonFee
  const dp = NEPSE_FEES.dpFeePerBuy
  return {
    value,
    commission: Math.ceil(commission),
    sebon: Math.ceil(sebon),
    dp,
    totalCost: value + Math.ceil(commission) + Math.ceil(sebon) + dp,
  }
}

export function calcSellRevenue(qty: number, price: number) {
  const value = qty * price
  const commission = value * NEPSE_FEES.brokerCommission
  const sebon = value * NEPSE_FEES.sebonFee
  return {
    value,
    commission: Math.ceil(commission),
    sebon: Math.ceil(sebon),
    netRevenue: value - Math.ceil(commission) - Math.ceil(sebon),
  }
}

export function calcWeightedAvgCost(buyTrades: { quantity: number, pricePerShare: number, totalCost: number }[]) {
  if (!buyTrades.length) return 0;
  let totalShares = 0;
  let totalInvested = 0;
  buyTrades.forEach(trade => {
    totalShares += trade.quantity;
    totalInvested += trade.totalCost;
  });
  return totalInvested / totalShares;
}