import AsyncStorage from '@react-native-async-storage/async-storage';
import { Middleware } from '@reduxjs/toolkit';

const AUTH_STORAGE_KEY = 'auth_state';

// Middleware to persist auth state
export const authPersistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Handle auth state changes
  if (action.type?.startsWith('auth/')) {
    const authState = store.getState().auth;
    
    console.log('Auth Persistence Middleware - Action:', action.type);
    console.log('Auth Persistence Middleware - State:', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      hasToken: !!authState.token,
      userId: authState.user?.id
    });
    
    if (action.type === 'auth/logout') {
      // Clear storage on logout
      console.log('Clearing persisted auth state...');
      AsyncStorage.removeItem(AUTH_STORAGE_KEY)
        .then(() => console.log('Auth state cleared from storage'))
        .catch(error => console.error('Failed to clear auth state:', error));
    } else {
      // Save auth state to AsyncStorage for other auth actions
      console.log('Saving auth state to storage...');
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
        .then(() => console.log('Auth state saved to storage successfully'))
        .catch(error => console.error('Failed to save auth state:', error));
    }
  }
  
  return result;
};

// Function to load persisted auth state
export const loadPersistedAuthState = async () => {
  try {
    console.log('Loading persisted auth state...');
    const persistedState = await Promise.race([
      AsyncStorage.getItem(AUTH_STORAGE_KEY),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AsyncStorage timeout')), 3000))
    ]);
    console.log('Raw persisted state:', persistedState);
    
    if (persistedState && typeof persistedState === 'string') {
      const parsed = JSON.parse(persistedState);
      console.log('Parsed persisted state:', parsed);
      return parsed;
    }
    console.log('No persisted state found');
  } catch (error) {
    console.error('Failed to load persisted auth state:', error);
    // Return null to allow app to continue with fresh state
  }
  return null;
};

// Function to clear persisted auth state
export const clearPersistedAuthState = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear persisted auth state:', error);
  }
};