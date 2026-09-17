import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';

export interface Expense {
  id?: string
  categoryId: string
  date: string
  amount: number
  description: string
  paymentMethod: 'cash' | 'esewa' | 'khalti' | 'bank_transfer' | 'card' | 'fonepay'
  isRecurring: boolean
  recurringId: string | null
  tags: string[]
  createdAt: number
}

export interface ExpenseCategory {
  id?: string
  name: string
  icon?: string
  color?: string
  budgetMonthly?: number
}

export function useExpenses() {
  const categories = useLiveQuery(() => db.table<ExpenseCategory>('expenseCategories').toArray(), []) || [];
  
  // Get expenses for the current month by default or based on date range if needed
  const recentExpenses = useLiveQuery(
    () => db.table<Expense>('expenses').orderBy('date').reverse().limit(100).toArray(), 
    []
  ) || [];

  const addExpense = async (expense: Expense) => {
    return db.table('expenses').add(expense);
  };

  const deleteExpense = async (id: string) => {
    return db.table('expenses').delete(id);
  };

  const addCategory = async (category: ExpenseCategory) => {
    return db.table('expenseCategories').add(category);
  };

  const updateCategoryBudget = async (id: string, budgetMonthly: number) => {
    return db.table('expenseCategories').update(id, { budgetMonthly });
  };

  return {
    categories,
    recentExpenses,
    addExpense,
    deleteExpense,
    addCategory,
    updateCategoryBudget
  };
}
