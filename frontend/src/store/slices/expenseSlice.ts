import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Expense } from '../../types';

interface ExpenseState {
  expenses: Expense[];
  selectedExpense: Expense | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ExpenseState = {
  expenses: [],
  selectedExpense: null,
  isLoading: false,
  error: null,
};

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
    setExpenses: (state, action: PayloadAction<Expense[]>) => { state.expenses = action.payload; },
    setSelectedExpense: (state, action: PayloadAction<Expense | null>) => { state.selectedExpense = action.payload; },
    addExpense: (state, action: PayloadAction<Expense>) => { state.expenses.push(action.payload); },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex(e => e.id === action.payload.id);
      if (index !== -1) state.expenses[index] = action.payload;
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter(e => e.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload; },
  },
});

export const { setLoading, setExpenses, setSelectedExpense, addExpense, updateExpense, removeExpense, setError } = expenseSlice.actions;
export default expenseSlice.reducer;