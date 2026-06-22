import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { setAuthToken } from '../../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth: (state, action: PayloadAction<AuthState | null>) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = action.payload.isAuthenticated;

        // Restore token for API calls - CRITICAL! (SYNCHRONOUS)
        const token = action.payload.token;
        if (token) {
          console.log('🔄 Restoring token from persisted state...');
          setAuthToken(token);
          console.log('✅ Token restored successfully');
        } else {
          console.log('⚠️ No token found in persisted state');
        }
      } else {
        console.log('⚠️ No persisted auth state found');
      }
      state.isInitialized = true;
      state.isLoading = false;
      console.log('Auth initialized:', { isAuthenticated: state.isAuthenticated, hasUser: !!state.user, hasToken: !!state.token });
    },
    loginStart: (state) => {
      state.isLoading = true;
      console.log('Login started');
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Set token for API calls - CRITICAL! (SYNCHRONOUS)
      console.log('🔐 Setting token after login...');
      setAuthToken(action.payload.token);
      console.log('✅ Token set successfully after login');

      console.log('Login success - Auth state updated:', {
        isAuthenticated: state.isAuthenticated,
        userId: state.user?.id,
        userName: state.user?.name,
        hasToken: !!state.token,
        tokenPreview: action.payload.token.substring(0, 20) + '...'
      });
    },
    loginFailure: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      console.log('Login failed - Auth state cleared');
    },
    logout: (state) => {
      console.log('🚪 Auth slice logout action called');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear token from API service (SYNCHRONOUS)
      setAuthToken(null);
      console.log('✅ Token cleared from API service');
      // Clear persisted state will be handled by middleware
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        console.log('✅ User profile updated in Redux:', state.user);
      }
    },
  },
});

export const { initializeAuth, loginStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;