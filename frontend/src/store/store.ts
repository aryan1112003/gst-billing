import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import agencySlice from './slices/agencySlice';
import customerSlice from './slices/customerSlice';
import itemSlice from './slices/itemSlice';
import invoiceSlice from './slices/invoiceSlice';
import paymentSlice from './slices/paymentSlice';
import vendorSlice from './slices/vendorSlice';
import purchaseSlice from './slices/purchaseSlice';
import expenseSlice from './slices/expenseSlice';
import reportSlice from './slices/reportSlice';
import { authPersistenceMiddleware } from './middleware/authPersistence';
import { agencyPersistenceMiddleware } from './middleware/agencyPersistence';

const rootReducer = {
  auth: authSlice,
  agency: agencySlice,
  customers: customerSlice,
  items: itemSlice,
  invoices: invoiceSlice,
  payments: paymentSlice,
  vendors: vendorSlice,
  purchases: purchaseSlice,
  expenses: expenseSlice,
  reports: reportSlice,
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'auth/loginSuccess', 'auth/initializeAuth', 'agency/setAgency'],
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt'],
      },
    }).concat(authPersistenceMiddleware, agencyPersistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;