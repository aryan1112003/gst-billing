import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Payment } from '../../types';

interface PaymentState {
  payments: Payment[];
  selectedPayment: Payment | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  selectedPayment: null,
  isLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
    setPayments: (state, action: PayloadAction<Payment[]>) => { state.payments = action.payload; },
    setSelectedPayment: (state, action: PayloadAction<Payment | null>) => { state.selectedPayment = action.payload; },
    addPayment: (state, action: PayloadAction<Payment>) => { state.payments.push(action.payload); },
    updatePayment: (state, action: PayloadAction<Payment>) => {
      const index = state.payments.findIndex(p => p.id === action.payload.id);
      if (index !== -1) state.payments[index] = action.payload;
    },
    removePayment: (state, action: PayloadAction<string>) => {
      state.payments = state.payments.filter(p => p.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload; },
  },
});

export const { setLoading, setPayments, setSelectedPayment, addPayment, updatePayment, removePayment, setError } = paymentSlice.actions;
export default paymentSlice.reducer;