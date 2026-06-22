import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Switch, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { RootState } from '../../store/store';
import { useResponsive } from '../../utils/responsive';

export const SettingsTabsScreen: React.FC = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const { isMobile, isTablet, isDesktop, rs } = useResponsive();
    const user = useSelector((state: RootState) => state.auth.user) || {
        name: 'Admin User',
        email: 'admin@mawebtechnologies.com',
        role: 'admin'
    };

    const [activeTab, setActiveTab] = useState('settings');
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [autoBackup, setAutoBackup] = useState(true);

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    const settingsOptions = [
        {
            title: 'Account Settings',
            items: [
                { label: 'Edit Profile', icon: 'person', action: () => console.log('Edit Profile') },
                { label: 'Change Password', icon: 'lock', action: () => console.log('Change Password') },
                { label: 'Privacy Settings', icon: 'security', action: () => console.log('Privacy') },
            ]
        },
        {
            title: 'App Preferences',
            items: [
                { label: 'Notifications', icon: 'notifications', toggle: notifications, onToggle: setNotifications },
                { label: 'Dark Mode', icon: 'brightness-6', toggle: darkMode, onToggle: setDarkMode },
                { label: 'Auto Backup', icon: 'backup', toggle: autoBackup, onToggle: setAutoBackup },
            ]
        },
        {
            title: 'Business Settings',
            items: [
                { label: 'Company Information', icon: 'business', action: () => navigation.navigate('OrganizationProfile') },
                { label: 'Tax Settings', icon: 'receipt', action: () => console.log('Tax Settings') },
                { label: 'Invoice Templates', icon: 'description', action: () => console.log('Templates') },
            ]
        }
    ];

    return (
        <MainLayout currentRoute="Settings" onNavigate={handleNavigate}>
            <ScrollView style={styles.container}>
                {/* Profile Section */}
                <LinearGradient
                    colors={colors.primary.gradient as any}
                    style={styles.profileSection}
                >
                    <View style={styles.profileContent}>
                        <LinearGradient
                            colors={colors.secondary.gradient as any}
                            style={styles.avatarContainer}
                        >
                            <Text style={styles.avatarText}>{user.name?.charAt(0) || 'A'}</Text>
                        </LinearGradient>

                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{user.name || 'User'}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                            <View style={styles.roleContainer}>
                                <MaterialIcons name="admin-panel-settings" size={16} color="rgba(255, 255, 255, 0.8)" />
                                <Text style={styles.userRole}>{user.role || 'User'}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.editButton}>
                            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Settings Sections */}
                {settingsOptions.map((section, sectionIndex) => (
                    <LinearGradient
                        key={sectionIndex}
                        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] as any}
                        style={styles.settingsSection}
                    >
                        <Text style={styles.sectionTitle}>{section.title}</Text>

                        {section.items.map((item: any, itemIndex: number) => (
                            <View key={itemIndex}>
                                <TouchableOpacity
                                    style={styles.settingsItem}
                                    onPress={'action' in item ? item.action : undefined}
                                    disabled={'toggle' in item}
                                >
                                    <View style={styles.settingsItemLeft}>
                                        <View style={styles.iconContainer}>
                                            <MaterialIcons name={item.icon as any} size={22} color={colors.primary.main} />
                                        </View>
                                        <Text style={styles.settingsItemText}>{item.label}</Text>
                                    </View>

                                    {'toggle' in item ? (
                                        <Switch
                                            value={item.toggle}
                                            onValueChange={item.onToggle}
                                            color={colors.primary.main}
                                        />
                                    ) : (
                                        <MaterialIcons name="chevron-right" size={24} color={colors.neutral[400]} />
                                    )}
                                </TouchableOpacity>

                                {itemIndex < section.items.length - 1 && <Divider style={styles.divider} />}
                            </View>
                        ))}
                    </LinearGradient>
                ))}

                {/* Logout Section */}
                <TouchableOpacity onPress={handleLogout} style={styles.logoutSection}>
                    <LinearGradient
                        colors={colors.error.gradient as any}
                        style={styles.logoutButton}
                    >
                        <MaterialIcons name="logout" size={24} color="#FFFFFF" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>Erp System</Text>
                    <Text style={styles.versionText}>Version 2.1.0</Text>
                    <Text style={styles.copyrightText}>© 2026 Erp System</Text>
                </View>
            </ScrollView>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    profileSection: {
        margin: 16,
        borderRadius: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 6,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userRole: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 4,
        fontWeight: '600',
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsSection: {
        margin: 16,
        marginTop: 8,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        padding: 20,
        paddingBottom: 12,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    settingsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 60, 114, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingsItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text.primary,
    },
    divider: {
        marginHorizontal: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    logoutSection: {
        margin: 16,
        marginTop: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    appInfo: {
        alignItems: 'center',
        padding: 24,
        marginBottom: 20,
    },
    appInfoText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 4,
    },
    versionText: {
        fontSize: 14,
        color: colors.text.secondary,
        marginBottom: 8,
    },
    copyrightText: {
        fontSize: 12,
        color: colors.text.muted,
    },
});
