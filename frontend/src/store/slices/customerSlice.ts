import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '../../types';

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.customers = action.payload;
    },
    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.push(action.payload);
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },
    removeCustomer: (state, action: PayloadAction<string>) => {
      state.customers = state.customers.filter(c => c.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setLoading,
  setCustomers,
  setSelectedCustomer,
  addCustomer,
  updateCustomer,
  removeCustomer,
  setError,
} = customerSlice.actions;

export default customerSlice.reducer;