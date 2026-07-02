import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { setAgency, setLoading } from '../../store/slices/agencySlice';
import { colors as baseColors } from '../../theme/colors';
import { getMenuItems, roleDescriptions, UserRole, MenuItem } from '../../utils/rolePermissions';
import { api, BASE_SERVER_URL } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../utils/responsive';

interface SidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeRoute, onNavigate }) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const agency = useSelector((state: RootState) => state.agency.agency);
  const dispatch = useDispatch();

  // Fetch agency data when component mounts
  useEffect(() => {
    const fetchAgencyData = async () => {
      if (!user?.agencyId || agency) return; // Skip if already loaded

      try {
        dispatch(setLoading(true));
        const response: any = await api.get(`/agencies/${user.agencyId}`);
        if (response.data.success) {
          dispatch(setAgency(response.data.data.agency));
        }
      } catch (error) {
        console.error('Error fetching agency data:', error);
      }
    };

    fetchAgencyData();
  }, [user?.agencyId, agency, dispatch]);

  // Get menu items based on user role and business type
  const menuItems = useMemo(() => {
    const userRole = (user?.role || 'user') as UserRole;
    const businessType = agency?.businessType;
    return getMenuItems(userRole, user?.accountType, businessType);
  }, [user?.role, user?.accountType, agency?.businessType]);

  // Reactive device type detection (re-renders on resize/rotation)
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const isCompact = isTablet; // icon-only mode on tablet

  const handleLogout = () => {
    console.log('Logout button clicked');
    dispatch(logout());
  };

  return (
    <View
      style={[
        styles.container,
        isMobile && styles.mobileContainer,
        isCompact && styles.compactContainer,
        { backgroundColor: themeColors.neutral[900], borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.05)' }
      ]}
    >
      {/* Header */}
      <View style={[
        styles.header,
        isMobile && styles.mobileHeader,
        isCompact && styles.compactHeader,
      ]}>
        <View style={[styles.logoContainer, isCompact && styles.compactLogoContainer]}>
          {agency?.logoUrl ? (
            <Image
              source={{ uri: agency.logoUrl.startsWith('http') ? agency.logoUrl : `${BASE_SERVER_URL}${agency.logoUrl}` }}
              style={[
                styles.logoImage,
                isMobile && styles.mobileLogoImage,
                isCompact && styles.compactLogoImage,
              ]}
              resizeMode="contain"
            />
          ) : (
            <LinearGradient
              colors={themeColors.primary.gradient as [string, string]}
              style={[
                styles.logo,
                isMobile && styles.mobileLogo,
                isCompact && styles.compactLogo,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons
                name="business"
                size={isCompact ? 20 : isMobile ? 22 : 28}
                color="#FFFFFF"
              />
            </LinearGradient>
          )}
          {!isCompact && (
            <>
              <Text style={[
                styles.companyName,
                isMobile && styles.mobileCompanyName,
                { color: '#FFFFFF' }
              ]}>
                {agency?.companyName || '111prods'}
              </Text>
              <Text style={[
                styles.companyTagline,
                isMobile && styles.mobileCompanyTagline,
                { color: 'rgba(255, 255, 255, 0.5)' }
              ]}>
                Enterprise Solutions
              </Text>
            </>
          )}
        </View>

        {!isCompact && (
          <View style={[
            styles.userSection,
            isMobile && styles.mobileUserSection,
            { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1 }
          ]}>
            <LinearGradient
              colors={themeColors.accent.gradient as [string, string]}
              style={[
                styles.avatarGradient,
                isMobile && styles.mobileAvatarGradient
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[
                styles.avatarText,
                isMobile && styles.mobileAvatarText
              ]}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </LinearGradient>
            <View style={styles.userInfo}>
              <Text style={[
                styles.userName,
                isMobile && styles.mobileUserName,
                { color: '#FFFFFF' }
              ]} numberOfLines={1}>
                {user?.name || 'User'}
              </Text>
              <Text style={[
                styles.userRole,
                isMobile && styles.mobileUserRole,
                { color: 'rgba(255, 255, 255, 0.6)' }
              ]}>
                {user?.accountType === 'user' ? 'Individual Account' : (roleDescriptions[(user?.role || 'user') as UserRole] || user?.role || 'User')}
              </Text>
            </View>
          </View>
        )}

        {/* Compact avatar (tablet) */}
        {isCompact && (
          <LinearGradient
            colors={themeColors.accent.gradient as [string, string]}
            style={styles.compactAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.compactAvatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </LinearGradient>
        )}
      </View>

      <View style={[styles.dividerContainer, isCompact && styles.compactDividerContainer]}>
        <View style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
      </View>

      {/* Navigation Menu */}
      <ScrollView
        style={[
          styles.menuContainer,
          isMobile && styles.mobileMenuContainer,
          isCompact && styles.compactMenuContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item: MenuItem) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              isCompact && styles.compactMenuItem,
              activeRoute === item.route && styles.activeMenuItem
            ]}
            onPress={() => onNavigate(item.route)}
            activeOpacity={0.8}
          >
            {activeRoute === item.route && (
              <LinearGradient
                colors={themeColors.primary.gradient as [string, string]}
                style={styles.activeMenuBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            <View style={[
              styles.menuIconContainer,
              isCompact && styles.compactMenuIconContainer,
              { backgroundColor: activeRoute === item.route ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }
            ]}>
              <MaterialIcons
                name={item.icon as any}
                size={22}
                color={activeRoute === item.route ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
              />
            </View>
            {!isCompact && (
              <>
                <Text style={[
                  styles.menuText,
                  isMobile && styles.mobileMenuText,
                  { color: activeRoute === item.route ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)', fontWeight: activeRoute === item.route ? '700' : '500' }
                ]}>
                  {item.title}
                </Text>
                {activeRoute === item.route && (
                  <View style={[styles.activeIndicator, { backgroundColor: '#FFFFFF' }]} />
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, isCompact && styles.compactFooter]}>
        <TouchableOpacity style={[styles.logoutButton, isCompact && styles.compactLogoutButton]} onPress={handleLogout}>
          <LinearGradient
            colors={themeColors.error.gradient as [string, string]}
            style={[styles.logoutGradient, isCompact && styles.compactLogoutGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialIcons name="logout" size={18} color="#FFFFFF" />
            {!isCompact && <Text style={styles.logoutText}>Logout</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {!isCompact && (
          <Text style={styles.copyright}>
            {`© 2026 ${agency?.companyName || 'ERP System'}`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    flex: 1,
  },
  mobileContainer: {
    width: '100%',
  },
  compactContainer: {
    width: 72,
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  mobileHeader: {
    padding: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  mobileLogo: {
    width: 54,
    height: 54,
    borderRadius: 14,
    marginBottom: 12,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 16,
  },
  mobileLogoImage: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  mobileCompanyName: {
    fontSize: 16,
  },
  companyTagline: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  mobileCompanyTagline: {
    fontSize: 11,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  mobileUserSection: {
    marginTop: 12,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileAvatarGradient: {
    width: 38,
    height: 38,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  mobileAvatarText: {
    fontSize: 16,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  mobileUserName: {
    fontSize: 14,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mobileUserRole: {
    fontSize: 10,
  },
  dividerContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mobileMenuContainer: {
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeMenuBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    flex: 1,
    letterSpacing: 0.3,
  },
  mobileMenuText: {
    fontSize: 14,
  },
  activeIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    marginBottom: 20,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  copyright: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  compactHeader: {
    padding: 12,
    paddingTop: 24,
    alignItems: 'center',
    width: 72,
  },
  compactLogoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  compactLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginBottom: 0,
  },
  compactLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginBottom: 0,
  },
  compactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  compactAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  compactDividerContainer: {
    paddingHorizontal: 8,
    width: 72,
  },
  compactMenuContainer: {
    paddingHorizontal: 0,
    width: 72,
    alignItems: 'center',
  },
  compactMenuItem: {
    paddingHorizontal: 0,
    paddingVertical: 10,
    marginVertical: 2,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  compactMenuIconContainer: {
    marginRight: 0,
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  compactFooter: {
    padding: 12,
    paddingBottom: 24,
    alignItems: 'center',
    width: 72,
  },
  compactLogoutButton: {
    marginBottom: 0,
    width: 44,
  },
  compactLogoutGradient: {
    paddingVertical: 10,
    paddingHorizontal: 0,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
