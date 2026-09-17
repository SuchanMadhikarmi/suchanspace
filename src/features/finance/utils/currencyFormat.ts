export function formatNRS(amount: number, options: { compact?: boolean, showSymbol?: boolean } = {}) {
  const { compact = false, showSymbol = true } = options
  const symbol = showSymbol ? 'Rs ' : ''

  if (compact) {
    if (amount >= 10000000) return `${symbol}${(amount/10000000).toFixed(2)} Cr`
    if (amount >= 100000)   return `${symbol}${(amount/100000).toFixed(2)} L`
    if (amount >= 1000)     return `${symbol}${(amount/1000).toFixed(1)}K`
  }

  // Nepal number formatting: 1,23,456 (not 123,456)
  return symbol + new Intl.NumberFormat('en-IN').format(Math.round(amount))
}

export function formatPnL(amount: number, percent: number) {
  const sign = amount >= 0 ? '+' : ''
  return `${sign}${formatNRS(amount)} (${sign}${percent.toFixed(2)}%)`
}