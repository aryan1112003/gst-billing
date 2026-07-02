import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { BASE_SERVER_URL } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

interface TopBarProps {
  title: string;
  onMenuPress?: () => void;
  showMenuButton?: boolean;
  showSearch?: boolean;
  onAddPress?: () => void;
  showAddButton?: boolean;
  onNavigate?: (route: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onMenuPress,
  showMenuButton = false,
  showSearch = true,
  onAddPress,
  showAddButton = false,
  onNavigate,
}) => {
  const { colors: themeColors, isDarkMode, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const agency = useSelector((state: RootState) => state.agency.agency);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const { isDesktop, isTablet, isMobile, rs } = useResponsive();

  const displayName = user?.name || 'Admin';
  const logoUri = agency?.logoUrl
    ? (agency.logoUrl.startsWith('http') ? agency.logoUrl : `${BASE_SERVER_URL}${agency.logoUrl}`)
    : null;

  const handleLogout = () => {
    setMenuVisible(false);
    dispatch(logout());
  };

  const handleMenuOption = (route: string) => {
    setMenuVisible(false);
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          paddingHorizontal: rs(16, 16, 24),
          height: isMobile ? 56 : 70,
        }
      ]}
    >
      <View style={styles.leftSection}>
        {showMenuButton && (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress} activeOpacity={0.7}>
            <LinearGradient
              colors={themeColors.primary.gradient as [string, string]}
              style={styles.menuButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="menu" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: themeColors.text.primary }]}>{title}</Text>
          <View style={styles.breadcrumb}>
            <MaterialIcons name="home" size={12} color={themeColors.text.muted} />
            <Text style={[styles.breadcrumbText, { color: themeColors.text.muted }]}>{` / ${title}`}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        {showSearch && isDesktop && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchWrapper, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
              <MaterialIcons name="search" size={20} color={themeColors.text.muted} style={styles.searchIcon} />
              <Searchbar
                placeholder="Search anything..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={[styles.searchInput, { color: themeColors.text.primary }]}
                iconColor="transparent"
                placeholderTextColor={themeColors.text.muted}
              />
            </View>
          </View>
        )}
        {/* Compact search icon on tablet */}
        {showSearch && isTablet && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
            activeOpacity={0.7}
          >
            <MaterialIcons name="search" size={20} color={themeColors.text.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.userSection}>
          <TouchableOpacity style={styles.themeButton} onPress={toggleTheme} activeOpacity={0.7}>
            <View style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
              <MaterialIcons
                name={isDarkMode ? "light-mode" : "dark-mode"}
                size={22}
                color={themeColors.text.primary}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.7}
            onPress={() => setMenuVisible(true)}
          >
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={themeColors.secondary.gradient as [string, string]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* User Dropdown Menu */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.dropdownMenu,
                {
                  backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                }
              ]}>
                <View style={[styles.menuHeader, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <Text style={[styles.menuUserName, { color: themeColors.text.primary }]}>{displayName}</Text>
                  <Text style={[styles.menuUserEmail, { color: themeColors.text.secondary }]}>{user?.email || 'admin@demo.com'}</Text>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('Settings')}>
                  <MaterialIcons name="person-outline" size={20} color={themeColors.text.primary} />
                  <Text style={[styles.menuItemText, { color: themeColors.text.primary }]}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('SubscriptionManagement')}>
                  <MaterialIcons name="card-membership" size={20} color={themeColors.text.primary} />
                  <Text style={[styles.menuItemText, { color: themeColors.text.primary }]}>Subscription</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('Settings')}>
                  <MaterialIcons name="settings" size={20} color={themeColors.text.primary} />
                  <Text style={[styles.menuItemText, { color: themeColors.text.primary }]}>Settings</Text>
                </TouchableOpacity>

                <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} />

                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <MaterialIcons name="logout" size={20} color={themeColors.error.main} />
                  <Text style={[styles.menuItemText, { color: themeColors.error.main }]}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    zIndex: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 16,
  },
  menuButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  breadcrumbText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    marginRight: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 40,
    width: 280,
  },
  searchIcon: {
    marginRight: 0,
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'transparent',
    elevation: 0,
    height: 40,
  },
  searchInput: {
    fontSize: 14,
    minHeight: 0,
    paddingLeft: -8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeButton: {
    // Styling for theme button
  },
  notificationButton: {
    position: 'relative',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: '#f43f5e',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  avatarContainer: {
    // Container for avatar
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 65,
    right: 24,
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  menuHeader: {
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  menuUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuUserEmail: {
    fontSize: 12,
    opacity: 0.7,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
});
