import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import type { Trade } from '../../../db/db';
import { rebuildHoldings } from '../utils/portfolioEngine';
import { calcBuyCost, calcSellRevenue } from '../utils/nepseCalc';

export function usePortfolio() {
  const trades = useLiveQuery(() => db.trades.reverse().sortBy('date')) || [];
  const holdings = useLiveQuery(() => db.holdings.toArray()) || [];

  const addTrade = async (tradeParams: Omit<Trade, 'id' | 'createdAt'>) => {
    let fees = tradeParams.fees;
    // Auto calculate if fee is passed as zero
    if (!fees) {
       if (tradeParams.type === 'buy') {
         const details = calcBuyCost(tradeParams.shares, tradeParams.price);
         fees = details.totalCost - (tradeParams.shares * tradeParams.price);
       } else {
         const details = calcSellRevenue(tradeParams.shares, tradeParams.price);
         fees = (tradeParams.shares * tradeParams.price) - details.netRevenue;
       }
    }
    
    const trade: Trade = {
      ...tradeParams,
      fees,
      createdAt: Date.now()
    };
    
    await db.trades.add(trade);
    await rebuildHoldings();
  };

  const updateHoldingsPrice = async (updates: { id: number; currentPrice: number }[]) => {
    await db.transaction('rw', db.holdings, async () => {
      for (const update of updates) {
        await db.holdings.update(update.id, { currentPrice: update.currentPrice, lastUpdated: Date.now() });
      }
    });
    // Trigger recalculation of portfolio value where needed
  };

  return {
    trades,
    holdings,
    addTrade,
    updateHoldingsPrice
  };
}
