import AsyncStorage from '@react-native-async-storage/async-storage';
import { Middleware } from '@reduxjs/toolkit';

const AGENCY_STORAGE_KEY = 'agency_state';

// Middleware to persist agency state
export const agencyPersistenceMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);

    // Handle agency state changes
    if (action.type?.startsWith('agency/')) {
        const agencyState = store.getState().agency;

        console.log('Agency Persistence Middleware - Action:', action.type);
        console.log('Agency Persistence Middleware - State:', {
            hasAgency: !!agencyState.agency,
            companyName: agencyState.agency?.companyName,
            hasLogo: !!agencyState.agency?.logoUrl
        });

        if (action.type === 'agency/clearAgency') {
            // Clear storage when agency is cleared
            console.log('Clearing persisted agency state...');
            AsyncStorage.removeItem(AGENCY_STORAGE_KEY)
                .then(() => console.log('Agency state cleared from storage'))
                .catch(error => console.error('Failed to clear agency state:', error));
        } else if (action.type === 'agency/setAgency' || action.type === 'agency/updateAgencyLogo') {
            // Save agency state when it's updated
            console.log('Saving agency state to storage...');
            AsyncStorage.setItem(AGENCY_STORAGE_KEY, JSON.stringify(agencyState))
                .then(() => console.log('✅ Agency state saved to storage'))
                .catch(error => console.error('Failed to save agency state:', error));
        }
    }

    // Also clear agency data on logout
    if (action.type === 'auth/logout') {
        console.log('Clearing agency state on logout...');
        AsyncStorage.removeItem(AGENCY_STORAGE_KEY)
            .then(() => console.log('Agency state cleared on logout'))
            .catch(error => console.error('Failed to clear agency state on logout:', error));
    }

    return result;
};

// Function to load persisted agency state
export const loadPersistedAgencyState = async () => {
    try {
        console.log('Loading persisted agency state...');
        const persistedState = await Promise.race([
            AsyncStorage.getItem(AGENCY_STORAGE_KEY),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AsyncStorage timeout')), 3000))
        ]);
        console.log('Raw persisted agency state:', persistedState);

        if (persistedState && typeof persistedState === 'string') {
            const parsed = JSON.parse(persistedState);
            console.log('✅ Parsed persisted agency:', parsed.agency?.companyName);
            return parsed;
        }
        console.log('No persisted agency state found');
    } catch (error) {
        console.error('Failed to load persisted agency state:', error);
    }
    return null;
};

// Function to clear persisted agency state
export const clearPersistedAgencyState = async () => {
    try {
        await AsyncStorage.removeItem(AGENCY_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear persisted agency state:', error);
    }
};
