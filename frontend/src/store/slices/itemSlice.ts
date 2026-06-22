import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item } from '../../types';

interface ItemState {
  items: Item[];
  selectedItem: Item | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ItemState = {
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
};

const itemSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
    setItems: (state, action: PayloadAction<Item[]>) => { state.items = action.payload; },
    setSelectedItem: (state, action: PayloadAction<Item | null>) => { state.selectedItem = action.payload; },
    addItem: (state, action: PayloadAction<Item>) => { state.items.push(action.payload); },
    updateItem: (state, action: PayloadAction<Item>) => {
      const index = state.items.findIndex(i => i.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => { state.error = action.payload; },
  },
});

export const { setLoading, setItems, setSelectedItem, addItem, updateItem, removeItem, setError } = itemSlice.actions;
export default itemSlice.reducer;