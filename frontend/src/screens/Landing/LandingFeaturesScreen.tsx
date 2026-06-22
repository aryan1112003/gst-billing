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

interface FeatureDetailProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    features: string[];
    tag?: string;
}

const FeatureDetail: React.FC<FeatureDetailProps> = ({ icon, title, description, features, tag }) => {
    const { isMobile, isTablet, rs } = useResponsive();
    const s = useMemo(() => StyleSheet.create({
        featureHeader: {
            flexDirection: rs('column', 'row', 'row') as any,
            gap: 20,
            marginBottom: 24,
        },
    }), [isMobile, isTablet]);

    return (
        <View style={styles.featureDetail}>
            {tag && (
                <View style={styles.featureTag}>
                    <Text style={styles.featureTagText}>{tag}</Text>
                </View>
            )}
            <View style={s.featureHeader}>
                <View style={styles.featureIconLarge}>
                    <Ionicons name={icon} size={36} color="#068B5E" />
                </View>
                <View style={styles.featureHeaderText}>
                    <Text style={styles.featureTitle}>{title}</Text>
                    <Text style={styles.featureDescription}>{description}</Text>
                </View>
            </View>
            <View style={styles.featureList}>
                {features.map((feature, index) => (
                    <View key={index} style={styles.featureListItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#068B5E" />
                        <Text style={styles.featureListText}>{feature}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export const LandingFeaturesScreen: React.FC = () => {
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
        featuresGrid: {
            flexDirection: rs('column', 'row', 'row') as any,
            flexWrap: 'wrap',
            gap: 20,
            maxWidth: 1200,
            alignSelf: 'center',
            width: '100%',
        },
    }), [isMobile, isTablet]);

    const featureGroups = [
        {
            icon: 'document-text' as const,
            title: 'GST Invoicing & e-Invoice',
            description: 'Create 100% GST-compliant invoices and generate IRN-stamped e-invoices directly from Zentax.',
            tag: 'Mandatory from Oct 2024',
            features: [
                'GST-compliant tax invoices, credit notes, debit notes',
                'e-Invoice with IRN & QR code (IRP integration)',
                'HSN/SAC code library with auto tax rate mapping',
                'CGST, SGST, IGST auto calculation',
                'Multi-currency invoicing',
                'Custom invoice templates with logo & signature',
                'Bulk invoice generation',
                'WhatsApp & email delivery',
            ],
        },
        {
            icon: 'receipt' as const,
            title: 'GST Returns Filing',
            description: 'Auto-prepare GSTR-1, GSTR-3B, and more from your invoices. Export JSON for direct portal upload.',
            features: [
                'GSTR-1 auto-preparation from sales invoices',
                'GSTR-3B summary with tax liability',
                'GSTR-2A/2B reconciliation for ITC',
                'One-click JSON export for GSTN portal',
                'Annual return (GSTR-9) summary',
                'Return filing reminders & calendar',
                'E-filing directly from Zentax (API)',
            ],
        },
        {
            icon: 'cube' as const,
            title: 'Inventory & Stock Management',
            description: 'Track stock across warehouses with batch-level detail. Never run out of stock or over-stock.',
            features: [
                'Real-time stock tracking with low-stock alerts',
                'Multi-warehouse & multi-location support',
                'Batch and serial number tracking',
                'Bill of Materials (BOM) for manufacturing',
                'Stock transfer between locations',
                'Expiry date management',
                'Stock valuation (FIFO / Weighted Average)',
            ],
        },
        {
            icon: 'swap-horizontal' as const,
            title: 'Purchases & Vendor Management',
            description: 'Manage supplier orders, track payables, reconcile ITC, and streamline your procurement.',
            features: [
                'Purchase orders & goods receipt notes',
                'Vendor invoice management',
                'Input Tax Credit (ITC) tracking',
                '2A/2B vs. purchase reconciliation',
                'Advance payment tracking',
                'Vendor aging reports',
                'Auto debit notes on returns',
            ],
        },
        {
            icon: 'car' as const,
            title: 'e-Way Bill Management',
            description: 'Generate, cancel, and track e-way bills for goods movement. Fully integrated with NIC portal.',
            tag: 'Required for ₹50,000+ consignments',
            features: [
                'Auto e-way bill from invoice/delivery challan',
                'NIC portal integration',
                'Part-A and Part-B filling',
                'Extension and cancellation support',
                'Bulk e-way bill generation',
                'Vehicle update & transporter management',
            ],
        },
        {
            icon: 'analytics' as const,
            title: 'Reports & Analytics',
            description: 'Deep business insights with P&L, balance sheet, and GST-specific tax reports.',
            features: [
                'Profit & Loss statement',
                'Balance sheet & trial balance',
                'GST liability report',
                'TDS/TCS summary',
                'Customer-wise & item-wise sales analysis',
                'Outstanding receivables & payables',
                'Cash flow statement',
                'Export to Excel, PDF, CSV',
            ],
        },
    ];

    return (
        <View style={styles.container}>
            <LandingNav currentPage="LandingFeatures" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>ALL FEATURES</Text>
                    </View>
                    <Text style={s.headerTitle}>Built for Indian GST Compliance</Text>
                    <Text style={styles.headerSubtitle}>
                        Every feature you need to run a GST-compliant business — from e-invoicing to GSTR filing to inventory
                    </Text>
                </View>

                {/* Feature Groups */}
                <View style={styles.featuresContainer}>
                    <View style={s.featuresGrid}>
                        {featureGroups.map((group, index) => (
                            <FeatureDetail key={index} {...group} />
                        ))}
                    </View>
                </View>

                {/* CTA Banner */}
                <LinearGradient
                    colors={['#005437', '#068B5E']}
                    style={styles.ctaBanner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
                    <Text style={styles.ctaSubtitle}>10-day free trial. No credit card required.</Text>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => navigation.navigate('AgencyRegistration')}
                    >
                        <Text style={styles.ctaButtonText}>Start Free Trial</Text>
                        <Ionicons name="arrow-forward" size={18} color="#005437" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Footer */}
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
    featuresContainer: {
        paddingVertical: 64,
        paddingHorizontal: 24,
    },
    featureDetail: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 28,
        borderWidth: 1,
        borderColor: '#E8EAEC',
        flex: 1,
        minWidth: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    featureTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 100,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    featureTagText: {
        fontSize: 10,
        color: '#D97706',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    featureIconLarge: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(6, 139, 94, 0.09)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.16)',
        flexShrink: 0,
    },
    featureHeaderText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#191919',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 14,
        color: '#929598',
        lineHeight: 22,
    },
    featureList: {
        gap: 10,
    },
    featureListItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    featureListText: {
        fontSize: 14,
        color: '#43474B',
        lineHeight: 22,
        flex: 1,
    },
    ctaBanner: {
        marginHorizontal: 24,
        marginBottom: 48,
        borderRadius: 20,
        padding: 48,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    ctaSubtitle: {
        fontSize: 16,
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
        paddingVertical: 32,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E8EAEC',
    },
    footerText: {
        fontSize: 13,
        color: '#929598',
    },
});
