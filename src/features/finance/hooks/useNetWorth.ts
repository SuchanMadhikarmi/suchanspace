import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import type { Asset, Liability, NetWorthSnapshot, SavingsGoal } from '../../../db/db';

export function useNetWorth() {
  const assets = useLiveQuery(() => db.assets.toArray(), []) || [];
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), []) || [];
  const snapshots = useLiveQuery(() => db.netWorthSnapshots.orderBy('date').toArray(), []) || [];
  const savingsGoals = useLiveQuery(() => db.savingsGoals.toArray(), []) || [];

  const totalAssets = assets.reduce((sum, a) => sum + (a.value || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.amount || 0), 0);
  const currentNetWorth = totalAssets - totalLiabilities;

  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    return db.assets.add(asset);
  };
  const updateAsset = async (id: number, changes: Partial<Asset>) => {
    return db.assets.update(id, changes);
  };
  const deleteAsset = async (id: number) => {
    return db.assets.delete(id);
  };

  const addLiability = async (liability: Omit<Liability, 'id'>) => {
    return db.liabilities.add(liability);
  };
  const updateLiability = async (id: number, changes: Partial<Liability>) => {
    return db.liabilities.update(id, changes);
  };
  const deleteLiability = async (id: number) => {
    return db.liabilities.delete(id);
  };

  const addSnapshot = async (snapshot: Omit<NetWorthSnapshot, 'id'>) => {
    return db.netWorthSnapshots.add(snapshot);
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    return db.savingsGoals.add(goal);
  };
  const updateSavingsGoal = async (id: number, changes: Partial<SavingsGoal>) => {
    return db.savingsGoals.update(id, changes);
  };
  const deleteSavingsGoal = async (id: number) => {
    return db.savingsGoals.delete(id);
  };

  return {
    assets,
    liabilities,
    snapshots,
    savingsGoals,
    totalAssets,
    totalLiabilities,
    currentNetWorth,
    addAsset,
    updateAsset,
    deleteAsset,
    addLiability,
    updateLiability,
    deleteLiability,
    addSnapshot,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
  };
}
