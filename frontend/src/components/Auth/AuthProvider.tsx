import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { RootState } from '../../store/store';
import { initializeAuth } from '../../store/slices/authSlice';
import { loadPersistedAuthState } from '../../store/middleware/authPersistence';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { isInitialized, isLoading } = useSelector((state: RootState) => state.auth);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('AuthProvider: Starting auth initialization...');

        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('AuthProvider: Initialization timeout, proceeding with default state');
          dispatch(initializeAuth(null));
        }, 5000);

        const persistedAuthState = await loadPersistedAuthState();
        clearTimeout(timeoutId);

        console.log('AuthProvider: Loaded persisted state:', persistedAuthState);
        dispatch(initializeAuth(persistedAuthState));

        // Load persisted agency data
        const { loadPersistedAgencyState } = await import('../../store/middleware/agencyPersistence');
        const { setAgency } = await import('../../store/slices/agencySlice');

        const persistedAgencyState = await loadPersistedAgencyState();
        if (persistedAgencyState?.agency) {
          console.log('✅ Restoring agency from storage:', persistedAgencyState.agency.companyName);
          dispatch(setAgency(persistedAgencyState.agency));
        }

        // If user is an agency but agencyId is null, refresh user profile from backend
        // This handles cases where the agency link was fixed in the database but the session is stale
        if (persistedAuthState?.user?.role === 'agency' && !persistedAuthState?.user?.agencyId) {
          console.log('🔄 Agency ID missing in stale session, refreshing user profile...');
          try {
            const { authAPI, agenciesAPI } = await import('../../services/api');
            const { updateUser } = await import('../../store/slices/authSlice');

            const response = await authAPI.getMe() as any;
            if (response.success && response.data?.user?.agencyId) {
              console.log('✅ Stale session fixed! Found agencyId:', response.data.user.agencyId);
              dispatch(updateUser({ agencyId: response.data.user.agencyId }));

              // Now fetch the agency data too
              const agencyResponse = await agenciesAPI.getById(response.data.user.agencyId) as any;
              if (agencyResponse.success) {
                dispatch(setAgency(agencyResponse.data.agency));
              }
            }
          } catch (refreshError) {
            console.error('Failed to refresh user profile on init:', refreshError);
          }
        } else if (persistedAuthState?.user?.agencyId && !persistedAgencyState?.agency) {
          // If no persisted agency but we have a user (and already have agencyId), fetch it now!
          console.log('⚠️ No persisted agency found, fetching from API...', persistedAuthState.user.agencyId);
          try {
            const { agenciesAPI } = await import('../../services/api');
            const agencyResponse = await agenciesAPI.getById(persistedAuthState.user.agencyId) as any;
            if (agencyResponse.success) {
              const agencyData = agencyResponse.data.agency;
              console.log('✅ Agency fetched and restored:', agencyData.companyName);
              dispatch(setAgency({
                id: agencyData.id,
                companyName: agencyData.companyName,
                email: agencyData.email,
                phone: agencyData.phone,
                address: agencyData.address,
                gstNumber: agencyData.gstNumber,
                panNumber: agencyData.panNumber,
                logoUrl: agencyData.logoUrl,
                subscriptionPlan: agencyData.subscriptionPlan,
                businessType: agencyData.businessType,
              }));
            }
          } catch (fetchError) {
            console.error('Failed to fetch agency on init:', fetchError);
          }
        }

        console.log('AuthProvider: Auth initialization completed');
      } catch (error) {
        console.error('AuthProvider: Failed to initialize auth:', error);
        // Don't show error, just initialize with null state
        dispatch(initializeAuth(null));
      }
    };

    if (!isInitialized) {
      console.log('AuthProvider: Auth not initialized, starting initialization...');
      initAuth();
    }
  }, [dispatch, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      import('expo-splash-screen').then(SplashScreen => {
        SplashScreen.hideAsync().catch(() => { });
      });
    }
  }, [isInitialized]);

  console.log('AuthProvider render:', { isInitialized, isLoading, initError });

  // Don't block on errors, just show children
  if (!isInitialized && !initError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  console.log('AuthProvider: Rendering children');
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});