import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LandingNav } from '../../components/Landing/LandingNav';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../utils/responsive';

export const LandingAboutScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { isMobile, isTablet, rs } = useResponsive();

    const s = useMemo(() => StyleSheet.create({
        headerTitle: {
            fontSize: rs(32, 40, 48),
            fontWeight: '800',
            color: '#191919',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: -0.8,
        },
        sectionTitle: {
            fontSize: rs(24, 28, 32),
            fontWeight: '800',
            color: '#191919',
            marginBottom: 16,
            letterSpacing: -0.5,
        },
        valueGrid: {
            flexDirection: rs('column', 'row', 'row') as any,
            gap: 20,
        },
        statsGrid: {
            flexDirection: rs('column', 'row', 'row') as any,
            flexWrap: 'wrap',
            gap: 20,
        },
        statCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 32,
            width: rs('100%', '48%', '23%') as any,
            borderWidth: 1,
            borderColor: '#E8EAEC',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
        },
        teamRow: {
            flexDirection: rs('column', 'row', 'row') as any,
            gap: 20,
        },
    }), [isMobile, isTablet]);

    const values = [
        {
            icon: 'shield-checkmark' as const,
            title: 'Compliance First',
            description: 'Every feature is built around Indian GST rules. We track every CBIC update so you don\'t have to.',
        },
        {
            icon: 'people' as const,
            title: 'Made for SMEs',
            description: 'Zentax is built for Indian traders, manufacturers, and service businesses — not enterprise giants.',
        },
        {
            icon: 'lock-closed' as const,
            title: 'Data Privacy',
            description: 'Your financial data stays yours. AES-256 encryption, SOC 2 compliance, servers in India.',
        },
        {
            icon: 'flash' as const,
            title: 'Always Improving',
            description: 'Regular updates aligned with GSTN changes, new e-invoice mandates, and your feedback.',
        },
    ];

    return (
        <View style={styles.container}>
            <LandingNav currentPage="LandingAbout" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>ABOUT ZENTAX</Text>
                    </View>
                    <Text style={s.headerTitle}>Built for India. Built for GST.</Text>
                    <Text style={styles.headerSubtitle}>
                        We started Zentax because filing GST returns shouldn't require an accountant on speed dial. We make compliance simple for every Indian business.
                    </Text>
                </View>

                {/* Mission Section */}
                <View style={styles.section}>
                    <View style={styles.missionCard}>
                        <View style={styles.missionIcon}>
                            <Ionicons name="rocket" size={32} color="#068B5E" />
                        </View>
                        <Text style={s.sectionTitle}>Our Mission</Text>
                        <Text style={styles.missionText}>
                            To empower every Indian business — from a single-person trader to a 100-person SME — with world-class GST billing and accounting tools at an affordable price. We believe compliance should be effortless, not a burden.
                        </Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsSection}>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>BY THE NUMBERS</Text>
                    </View>
                    <Text style={s.sectionTitle}>Trusted Across India</Text>
                    <View style={s.statsGrid}>
                        {[
                            { number: '10,000+', label: 'Active Businesses', icon: 'business' as const },
                            { number: '1 Lakh+', label: 'Invoices Generated', icon: 'document-text' as const },
                            { number: '50,000+', label: 'GST Returns Filed', icon: 'receipt' as const },
                            { number: '99.9%', label: 'Uptime Reliability', icon: 'server' as const },
                        ].map((stat, i) => (
                            <View key={i} style={s.statCard}>
                                <View style={styles.statIcon}>
                                    <Ionicons name={stat.icon} size={24} color="#068B5E" />
                                </View>
                                <Text style={styles.statNumber}>{stat.number}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Values */}
                <View style={styles.valuesSection}>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>OUR VALUES</Text>
                    </View>
                    <Text style={s.sectionTitle}>What We Stand For</Text>
                    <View style={s.valueGrid}>
                        {values.map((value, i) => (
                            <View key={i} style={styles.valueCard}>
                                <View style={styles.valueIcon}>
                                    <Ionicons name={value.icon} size={24} color="#068B5E" />
                                </View>
                                <Text style={styles.valueTitle}>{value.title}</Text>
                                <Text style={styles.valueDescription}>{value.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Team */}
                <View style={styles.section}>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>OUR TEAM</Text>
                    </View>
                    <Text style={s.sectionTitle}>Built by Tax & Tech Experts</Text>
                    <Text style={styles.teamDescription}>
                        Our team combines deep knowledge of Indian taxation, CA expertise, and world-class software engineering. We've worked with GST since Day 1 of its rollout in 2017.
                    </Text>
                    <View style={s.teamRow}>
                        {[
                            { initials: 'AK', name: 'Arjun Kumar', role: 'Founder & CEO', bg: '#005437' },
                            { initials: 'PS', name: 'Priya Sharma', role: 'Head of Product', bg: '#068B5E' },
                            { initials: 'RV', name: 'Rohan Verma', role: 'Lead Engineer', bg: '#43474B' },
                        ].map((member, i) => (
                            <View key={i} style={styles.teamCard}>
                                <View style={[styles.teamAvatar, { backgroundColor: member.bg }]}>
                                    <Text style={styles.teamAvatarText}>{member.initials}</Text>
                                </View>
                                <Text style={styles.teamName}>{member.name}</Text>
                                <Text style={styles.teamRole}>{member.role}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* CTA */}
                <LinearGradient
                    colors={['#005437', '#068B5E']}
                    style={styles.ctaSection}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.ctaTitle}>Join the Zentax Family</Text>
                    <Text style={styles.ctaSubtitle}>Start your free 10-day trial today</Text>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => navigation.navigate('AgencyRegistration')}
                    >
                        <Text style={styles.ctaButtonText}>Get Started Free</Text>
                        <Ionicons name="arrow-forward" size={18} color="#005437" />
                    </TouchableOpacity>
                </LinearGradient>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 Zentax. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingVertical: 72,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E8EAEC',
    },
    headerBadge: {
        backgroundColor: 'rgba(6, 139, 94, 0.08)',
        paddingVertical: 5,
        paddingHorizontal: 14,
        borderRadius: 100,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.18)',
    },
    headerBadgeText: {
        fontSize: 11,
        color: '#005437',
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    headerSubtitle: {
        fontSize: 17,
        color: '#929598',
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 620,
    },
    section: {
        paddingVertical: 64,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8EAEC',
        alignItems: 'center',
    },
    sectionBadge: {
        backgroundColor: 'rgba(6, 139, 94, 0.08)',
        paddingVertical: 5,
        paddingHorizontal: 14,
        borderRadius: 100,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.18)',
        alignSelf: 'center',
    },
    sectionBadgeText: {
        fontSize: 11,
        color: '#005437',
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    missionCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 40,
        maxWidth: 720,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8EAEC',
    },
    missionIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(6, 139, 94, 0.09)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.16)',
    },
    missionText: {
        fontSize: 16,
        color: '#43474B',
        lineHeight: 28,
        textAlign: 'center',
    },
    statsSection: {
        paddingVertical: 64,
        paddingHorizontal: 24,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E8EAEC',
        alignItems: 'center',
    },
    statIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(6, 139, 94, 0.09)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.16)',
    },
    statNumber: {
        fontSize: 36,
        fontWeight: '800',
        color: '#005437',
        marginBottom: 6,
        letterSpacing: -0.8,
    },
    statLabel: {
        fontSize: 13,
        color: '#929598',
        fontWeight: '500',
        textAlign: 'center',
    },
    valuesSection: {
        paddingVertical: 64,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8EAEC',
        alignItems: 'center',
    },
    valueCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E8EAEC',
        minWidth: 200,
    },
    valueIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(6, 139, 94, 0.09)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.16)',
    },
    valueTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#191919',
        marginBottom: 8,
    },
    valueDescription: {
        fontSize: 14,
        color: '#929598',
        lineHeight: 22,
    },
    teamDescription: {
        fontSize: 16,
        color: '#43474B',
        textAlign: 'center',
        lineHeight: 26,
        maxWidth: 600,
        marginBottom: 40,
    },
    teamCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 28,
        borderWidth: 1,
        borderColor: '#E8EAEC',
    },
    teamAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    teamAvatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    teamName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#191919',
        marginBottom: 4,
    },
    teamRole: {
        fontSize: 13,
        color: '#929598',
    },
    ctaSection: {
        paddingVertical: 72,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    ctaSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 28,
        textAlign: 'center',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#005437',
    },
    footer: {
        paddingVertical: 28,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E8EAEC',
    },
    footerText: {
        fontSize: 13,
        color: '#929598',
    },
});
