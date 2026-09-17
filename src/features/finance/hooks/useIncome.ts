import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import type { IncomeEntry, IncomeStream } from '../../../db/db';

export function useIncome() {
  const streams = useLiveQuery(() => db.table('incomeStreams').toArray()) ?? [];
  const entries = useLiveQuery(() => db.table('incomeEntries').reverse().sortBy('date')) ?? [];

  const addStream = async (stream: Omit<IncomeStream, 'id' | 'createdAt'>) => {
    return await db.table('incomeStreams').add({
      ...stream,
      createdAt: Date.now()
    } as IncomeStream);
  };

  const addEntry = async (entry: Omit<IncomeEntry, 'id' | 'createdAt'>) => {
    return await db.table('incomeEntries').add({
      ...entry,
      createdAt: Date.now()
    } as IncomeEntry);
  };

  const deleteEntry = async (id: string) => {
    return await db.table('incomeEntries').delete(id);
  };

  const deleteStream = async (id: string) => {
    return await db.table('incomeStreams').delete(id);
  };

  return {
    streams,
    entries,
    addStream,
    addEntry,
    deleteEntry,
    deleteStream
  };
}
