import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../utils/responsive';

interface LandingNavProps {
    currentPage?: string;
}

export const LandingNav: React.FC<LandingNavProps> = ({ currentPage = 'home' }) => {
    const navigation = useNavigation<any>();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isMobile } = useResponsive();

    const navItems = [
        { name: 'Home', route: 'LandingHome', icon: 'home-outline' },
        { name: 'Features', route: 'LandingFeatures', icon: 'flash-outline' },
        { name: 'Pricing', route: 'LandingPricing', icon: 'pricetag-outline' },
        { name: 'About', route: 'LandingAbout', icon: 'information-circle-outline' },
        { name: 'Contact', route: 'LandingContact', icon: 'mail-outline' },
    ];

    const handleNavigation = (route: string) => {
        navigation.navigate(route);
        setMobileMenuOpen(false);
    };

    const handleLogin = () => {
        navigation.navigate('Login');
        setMobileMenuOpen(false);
    };

    const handleSignup = () => {
        navigation.navigate('AgencyRegistration');
        setMobileMenuOpen(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.navContent}>
                {/* Logo */}
                <TouchableOpacity
                    style={styles.logoContainer}
                    onPress={() => handleNavigation('LandingHome')}
                >
                    <View style={styles.logoMark}>
                        <Text style={styles.logoMarkText}>Z</Text>
                    </View>
                    <Text style={styles.logoText}>Zentax</Text>
                </TouchableOpacity>

                {/* Desktop Navigation */}
                {!isMobile && (
                    <View style={styles.desktopNav}>
                        <View style={styles.navLinks}>
                            {navItems.map((item) => (
                                <TouchableOpacity
                                    key={item.route}
                                    style={[
                                        styles.navLink,
                                        currentPage === item.route && styles.navLinkActive,
                                    ]}
                                    onPress={() => handleNavigation(item.route)}
                                >
                                    <Text
                                        style={[
                                            styles.navLinkText,
                                            currentPage === item.route && styles.navLinkTextActive,
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.navActions}>
                            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                                <Text style={styles.loginButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                                <Text style={styles.signupButtonText}>Start Free Trial</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Mobile Menu Button */}
                {isMobile && (
                    <TouchableOpacity
                        style={styles.mobileMenuButton}
                        onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <Ionicons
                            name={mobileMenuOpen ? 'close' : 'menu'}
                            size={26}
                            color="#191919"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Mobile Menu */}
            {isMobile && mobileMenuOpen && (
                <View style={styles.mobileMenu}>
                    <ScrollView style={styles.mobileMenuScroll}>
                        {navItems.map((item) => (
                            <TouchableOpacity
                                key={item.route}
                                style={[
                                    styles.mobileNavLink,
                                    currentPage === item.route && styles.mobileNavLinkActive,
                                ]}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={20}
                                    color={currentPage === item.route ? '#005437' : '#929598'}
                                />
                                <Text
                                    style={[
                                        styles.mobileNavLinkText,
                                        currentPage === item.route && styles.mobileNavLinkTextActive,
                                    ]}
                                >
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.mobileNavActions}>
                            <TouchableOpacity
                                style={styles.mobileLoginButton}
                                onPress={handleLogin}
                            >
                                <Text style={styles.mobileLoginButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.mobileSignupButton}
                                onPress={handleSignup}
                            >
                                <Text style={styles.mobileSignupButtonText}>Start Free Trial</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#CACCCF',
        position: 'sticky' as any,
        top: 0,
        zIndex: 1000,
    },
    navContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 14,
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoMark: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#005437',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoMarkText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#191919',
        letterSpacing: -0.3,
    },
    desktopNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    navLink: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    navLinkActive: {
        backgroundColor: 'rgba(6, 139, 94, 0.08)',
    },
    navLinkText: {
        fontSize: 15,
        color: '#43474B',
        fontWeight: '500',
    },
    navLinkTextActive: {
        color: '#005437',
        fontWeight: '600',
    },
    navActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    loginButton: {
        paddingVertical: 9,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#CACCCF',
    },
    loginButtonText: {
        fontSize: 15,
        color: '#43474B',
        fontWeight: '600',
    },
    signupButton: {
        paddingVertical: 9,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#068B5E',
        shadowColor: '#005437',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    signupButtonText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    mobileMenuButton: {
        padding: 6,
    },
    mobileMenu: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8EAEC',
    },
    mobileMenuScroll: {
        maxHeight: 420,
    },
    mobileNavLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F5',
    },
    mobileNavLinkActive: {
        backgroundColor: 'rgba(6, 139, 94, 0.06)',
    },
    mobileNavLinkText: {
        fontSize: 16,
        color: '#43474B',
        fontWeight: '500',
    },
    mobileNavLinkTextActive: {
        color: '#005437',
        fontWeight: '700',
    },
    mobileNavActions: {
        padding: 20,
        gap: 12,
    },
    mobileLoginButton: {
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#CACCCF',
        alignItems: 'center',
    },
    mobileLoginButtonText: {
        fontSize: 16,
        color: '#43474B',
        fontWeight: '600',
    },
    mobileSignupButton: {
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#068B5E',
        alignItems: 'center',
        shadowColor: '#005437',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    mobileSignupButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
