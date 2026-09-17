import { db } from '../../../db/db';

export async function rebuildHoldings() {
  const trades = await db.trades.toArray();
  const holdingsList = await db.holdings.toArray();

  const holdingsMap = new Map();
  // Fetch existing holdings prices (assuming user updates LTP directly)
  for (const h of holdingsList) {
    if (h.currentPrice) {
      holdingsMap.set(h.symbol, { currentPrice: h.currentPrice });
    }
  }

  const tradesBySymbol = trades.reduce((acc: any, trade) => {
    if (!acc[trade.symbol]) acc[trade.symbol] = [];
    acc[trade.symbol].push(trade);
    return acc;
  }, {});

  const newHoldings: any[] = [];

  for (const symbol of Object.keys(tradesBySymbol)) {
    // Sort trades for the symbol by date (FIFO logic will process chronologically)
    const symbolTrades = tradesBySymbol[symbol].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let totalShares = 0;
    let totalInvested = 0; // naive total invested cost representation for holding

    // For better precision FIFO requires lot tracking but for now, we'll use weighted averages
    let sharesPool = [];

    for (const trade of symbolTrades) {
      if (trade.type === 'buy') {
        sharesPool.push({ qty: trade.shares, costBasis: trade.fees + (trade.shares * trade.price) / trade.shares });
        totalShares += trade.shares;
      } else if (trade.type === 'sell') {
        let soldQty = trade.shares;
        while (soldQty > 0 && sharesPool.length > 0) {
          if (sharesPool[0].qty <= soldQty) {
            soldQty -= sharesPool[0].qty;
            sharesPool.shift(); // fully consumed lot
          } else {
            sharesPool[0].qty -= soldQty;
            soldQty = 0;
          }
        }
        totalShares -= trade.shares;
      }
    }
    
    // Recalculate totalInvested from remaining pool
    totalInvested = sharesPool.reduce((sum, lot) => sum + (lot.qty * lot.costBasis), 0);

    if (totalShares > 0) {
      const existingInfo = holdingsMap.get(symbol) || {};
      const currentPrice = existingInfo.currentPrice || (sharesPool.length > 0 ? sharesPool[sharesPool.length - 1].costBasis : 0);
      const avgBuyPrice = totalInvested / totalShares;
      
      newHoldings.push({
        symbol,
        shares: totalShares,
        avgPrice: avgBuyPrice,
        currentPrice,
        lastUpdated: Date.now()
      });
    }
  }

  // Transactionally replace the holdings store
  await db.transaction('rw', db.holdings, async () => {
    await db.holdings.clear();
    if (newHoldings.length > 0) {
      await db.holdings.bulkAdd(newHoldings);
    }
  });
}
