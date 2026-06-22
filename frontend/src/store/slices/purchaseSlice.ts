import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Purchase } from '../../types';

interface PurchaseState {
    purchases: Purchase[];
    selectedPurchase: Purchase | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: PurchaseState = {
    purchases: [],
    selectedPurchase: null,
    isLoading: false,
    error: null,
};

const purchaseSlice = createSlice({
    name: 'purchases',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
        setPurchases: (state, action: PayloadAction<Purchase[]>) => { state.purchases = action.payload; },
        setSelectedPurchase: (state, action: PayloadAction<Purchase | null>) => { state.selectedPurchase = action.payload; },
        addPurchase: (state, action: PayloadAction<Purchase>) => { state.purchases.push(action.payload); },
        updatePurchase: (state, action: PayloadAction<Purchase>) => {
            const index = state.purchases.findIndex(p => p.id === action.payload.id);
            if (index !== -1) state.purchases[index] = action.payload;
        },
        removePurchase: (state, action: PayloadAction<string>) => {
            state.purchases = state.purchases.filter(p => p.id !== action.payload);
        },
        setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload; },
    },
});

export const { setLoading, setPurchases, setSelectedPurchase, addPurchase, updatePurchase, removePurchase, setError } = purchaseSlice.actions;
export default purchaseSlice.reducer;