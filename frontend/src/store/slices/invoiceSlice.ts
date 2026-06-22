import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice } from '../../types';

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  invoices: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
    setInvoices: (state, action: PayloadAction<Invoice[]>) => { state.invoices = action.payload; },
    setSelectedInvoice: (state, action: PayloadAction<Invoice | null>) => { state.selectedInvoice = action.payload; },
    addInvoice: (state, action: PayloadAction<Invoice>) => { state.invoices.push(action.payload); },
    updateInvoice: (state, action: PayloadAction<Invoice>) => {
      const index = state.invoices.findIndex(i => i.id === action.payload.id);
      if (index !== -1) state.invoices[index] = action.payload;
    },
    removeInvoice: (state, action: PayloadAction<string>) => {
      state.invoices = state.invoices.filter(i => i.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload; },
  },
});

export const { setLoading, setInvoices, setSelectedInvoice, addInvoice, updateInvoice, removeInvoice, setError } = invoiceSlice.actions;
export default invoiceSlice.reducer;