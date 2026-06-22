import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vendor } from '../../types';

interface VendorState {
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: VendorState = {
  vendors: [],
  selectedVendor: null,
  isLoading: false,
  error: null,
};

const vendorSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
    setVendors: (state, action: PayloadAction<Vendor[]>) => { state.vendors = action.payload; },
    setSelectedVendor: (state, action: PayloadAction<Vendor | null>) => { state.selectedVendor = action.payload; },
    addVendor: (state, action: PayloadAction<Vendor>) => { state.vendors.push(action.payload); },
    updateVendor: (state, action: PayloadAction<Vendor>) => {
      const index = state.vendors.findIndex(v => v.id === action.payload.id);
      if (index !== -1) state.vendors[index] = action.payload;
    },
    removeVendor: (state, action: PayloadAction<string>) => {
      state.vendors = state.vendors.filter(v => v.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload; },
  },
});

export const { setLoading, setVendors, setSelectedVendor, addVendor, updateVendor, removeVendor, setError } = vendorSlice.actions;
export default vendorSlice.reducer;