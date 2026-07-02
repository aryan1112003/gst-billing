import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { canAccessRoute, UserRole } from '../../utils/rolePermissions';
import { Text } from 'react-native-paper';
import { useResponsive } from '../../utils/responsive';

interface MainLayoutProps {
    children: React.ReactNode;
    currentRoute: string;
    title?: string;
    onNavigate: (route: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    currentRoute,
    title,
    onNavigate
}) => {
    const { colors: themeColors, isDarkMode } = useTheme();
    const user = useSelector((state: RootState) => state.auth.user);
    const agency = useSelector((state: RootState) => state.agency.agency);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const [authorized, setAuthorized] = useState(true);
    const { isMobile, isTablet, isDesktop, width: screenWidth, rs } = useResponsive();

    useEffect(() => {
        if (user && currentRoute) {
            const role = (user.role || 'user') as UserRole;
            const accountType = user.accountType || 'agency';
            const businessType = agency?.businessType;
            const hasAccess = canAccessRoute(role, accountType, currentRoute, businessType);
            if (!hasAccess) {
                setAuthorized(false);
                if (onNavigate) {
                    setTimeout(() => onNavigate('Dashboard'), 2000);
                }
            } else {
                setAuthorized(true);
            }
        }
    }, [currentRoute, user, agency]);

    // Close mobile sidebar when switching to tablet/desktop
    useEffect(() => {
        if (!isMobile && sidebarVisible) setSidebarVisible(false);
    }, [isMobile]);

    const sidebarWidth = useMemo(() => rs(280, 72, 280), [isMobile, isTablet]);

    const toggleSidebar = () => {
        if (isMobile) {
            setSidebarVisible(!sidebarVisible);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
            <StatusBar
                style={isDarkMode ? "light" : "dark"}
                translucent={true}
                backgroundColor="transparent"
                hidden={false}
            />
            {!authorized ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: themeColors.error.main }}>Access Denied</Text>
                    <Text style={{ marginTop: 10, color: themeColors.text.primary }}>You do not have permission to view this page.</Text>
                    <Text style={{ marginTop: 5, color: themeColors.text.secondary }}>Redirecting to Dashboard...</Text>
                </View>
            ) : (
                <View style={[styles.layoutContainer, { paddingTop: isMobile ? insets.top : 0 }]}>
                    {/* Persistent Sidebar for Tablet/Desktop - Always show if not mobile */}
                    {!isMobile && (
                        <View style={[styles.persistentSidebar, { width: sidebarWidth }]}>
                            <Sidebar
                                activeRoute={currentRoute}
                                onNavigate={onNavigate}
                            />
                        </View>
                    )}

                    {/* Mobile Sidebar Overlay */}
                    {isMobile && sidebarVisible && (
                        <View style={[styles.mobileSidebar, { width: Math.min(300, screenWidth * 0.85) }]}>
                            <Sidebar
                                activeRoute={currentRoute}
                                onNavigate={(route) => {
                                    onNavigate(route);
                                    setSidebarVisible(false); // Close sidebar after navigation
                                }}
                            />
                        </View>
                    )}

                    {/* Main Content Area */}
                    <View style={[
                        styles.mainContent,
                        !isMobile && styles.mainContentWithSidebar
                    ]}>
                        <TopBar
                            title={title || currentRoute}
                            onMenuPress={toggleSidebar}
                            showMenuButton={isMobile}
                            showSearch={!isMobile}
                            onNavigate={onNavigate}
                        />
                        <View style={[styles.contentArea, { paddingBottom: isMobile ? Math.max(insets.bottom, 24) : 0 }]}>
                            {children}
                        </View>
                    </View>

                    {/* Mobile Sidebar Overlay Background */}
                    {isMobile && sidebarVisible && (
                        <TouchableOpacity
                            style={styles.overlay}
                            activeOpacity={1}
                            onPress={toggleSidebar}
                        >
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    layoutContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    persistentSidebar: {
        // width set dynamically via sidebarWidth
        zIndex: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderRightWidth: 1,
        borderRightColor: 'rgba(0, 0, 0, 0.1)',
    },
    mobileSidebar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1001,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    mainContent: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingBottom: 0,
    },
    mainContentWithSidebar: {
        flex: 1,
        marginLeft: 0, // No margin needed as flexDirection handles it
    },
    contentArea: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 0,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
});