import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Agency {
  id: number;
  companyName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  faxNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  vatNumber?: string;
  cstNumber?: string;
  serviceTaxNumber?: string;
  logoUrl?: string;
  subscriptionPlan?: string;
  businessType?: string;
}

interface AgencyState {
  agency: Agency | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AgencyState = {
  agency: null,
  isLoading: false,
  error: null,
};

const agencySlice = createSlice({
  name: 'agency',
  initialState,
  reducers: {
    setAgency: (state, action: PayloadAction<Agency>) => {
      state.agency = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    updateAgencyLogo: (state, action: PayloadAction<string>) => {
      if (state.agency) {
        state.agency.logoUrl = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAgency: (state) => {
      state.agency = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setAgency, updateAgencyLogo, setLoading, setError, clearAgency } = agencySlice.actions;
export default agencySlice.reducer;
