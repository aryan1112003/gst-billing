import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LandingNav } from '../../components/Landing/LandingNav';
import { useResponsive } from '../../utils/responsive';

interface FeatureCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, badge }) => {
    const { isMobile, isTablet, rs } = useResponsive();
    const s = useMemo(() => StyleSheet.create({
        featureCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 28,
            width: rs('100%', '48%', '30%') as any,
            borderWidth: 1,
            borderColor: '#E8EAEC',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
        },
    }), [isMobile, isTablet]);

    return (
        <View style={s.featureCard}>
            {badge && (
                <View style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>{badge}</Text>
                </View>
            )}
            <View style={styles.featureIconContainer}>
                <Ionicons name={icon} size={26} color="#068B5E" />
            </View>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    );
};

interface TrustBadgeProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, label }) => (
    <View style={styles.trustBadge}>
        <Ionicons name={icon} size={18} color="#068B5E" />
        <Text style={styles.trustBadgeText}>{label}</Text>
    </View>
);

export const LandingHomeScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { isMobile, isTablet, isDesktop, rs } = useResponsive();

    const handleStartTrial = () => navigation.navigate('AgencyRegistration');
    const handleLogin = () => navigation.navigate('Login');
    const handleViewPricing = () => navigation.navigate('LandingPricing');
    const handleViewFeatures = () => navigation.navigate('LandingFeatures');

    const s = useMemo(() => StyleSheet.create({
        heroSection: {
            paddingTop: rs(72, 96, 112),
            paddingBottom: rs(64, 80, 96),
            paddingHorizontal: rs(20, 32, 40),
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
        },
        heroTitle: {
            fontSize: rs(36, 48, 60),
            fontWeight: '800',
            color: '#191919',
            textAlign: 'center',
            marginBottom: 20,
            letterSpacing: -1.5,
            lineHeight: rs(44, 58, 72),
        },
        heroSubtitle: {
            fontSize: rs(16, 18, 20),
            color: '#43474B',
            textAlign: 'center',
            marginBottom: 44,
            lineHeight: rs(26, 30, 32),
            maxWidth: 680,
            fontWeight: '400',
        },
        heroButtons: {
            flexDirection: rs('column', 'row', 'row') as any,
            gap: 16,
            width: '100%',
            maxWidth: 520,
            marginBottom: 56,
        },
        primaryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#068B5E',
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            gap: 10,
            flex: !isMobile ? 1 : undefined,
            shadowColor: '#005437',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
        },
        secondaryButton: {
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#005437',
            alignItems: 'center',
            justifyContent: 'center',
            flex: !isMobile ? 1 : undefined,
            flexDirection: 'row',
            gap: 8,
        },
        statsStrip: {
            flexDirection: rs('column', 'row', 'row') as any,
            alignItems: 'center',
            gap: rs(28, 56, 72),
            paddingVertical: 36,
            paddingHorizontal: 32,
            backgroundColor: 'rgba(6, 139, 94, 0.05)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(6, 139, 94, 0.12)',
            width: '100%',
            maxWidth: 860,
        },
        statDivider: {
            width: !isMobile ? 1 : '60%' as any,
            height: !isMobile ? 44 : 1,
            backgroundColor: 'rgba(6, 139, 94, 0.15)',
        },
        sectionTitle: {
            fontSize: rs(30, 36, 44),
            fontWeight: '800',
            color: '#191919',
            textAlign: 'center',
            marginBottom: 14,
            letterSpacing: -0.8,
        },
        featuresGrid: {
            flexDirection: rs('column', 'row', 'row') as any,
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 20,
            maxWidth: 1200,
            alignSelf: 'center',
            width: '100%',
            marginBottom: 44,
        },
        ctaTitle: {
            fontSize: rs(30, 36, 44),
            fontWeight: '800',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: -0.8,
        },
        footerContent: {
            flexDirection: rs('column', 'row', 'row') as any,
            justifyContent: 'space-between',
            maxWidth: 1200,
            alignSelf: 'center',
            width: '100%',
            gap: 40,
            marginBottom: 48,
        },
        howItWorksRow: {
            flexDirection: rs('column', 'row', 'row') as any,
            gap: 24,
            maxWidth: 1100,
            alignSelf: 'center',
            width: '100%',
        },
        stepCard: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: 32,
            paddingHorizontal: 20,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E8EAEC',
        },
        testimonialGrid: {
            flexDirection: rs('column', 'row', 'row') as any,
            gap: 20,
            maxWidth: 1100,
            alignSelf: 'center',
            width: '100%',
        },
        testimonialCard: {
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 28,
            borderWidth: 1,
            borderColor: '#E8EAEC',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
        },
    }), [isMobile, isTablet]);

    return (
        <View style={styles.container}>
            <LandingNav currentPage="LandingHome" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                {/* Hero Section */}
                <View style={s.heroSection}>
                    <View style={styles.heroBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#068B5E" />
                        <Text style={styles.heroBadgeText}>GST Compliant · GSTIN Verified · Trusted by 10,000+ Businesses</Text>
                    </View>

                    <Text style={s.heroTitle}>
                        India's Smartest{'\n'}GST Billing Software
                    </Text>
                    <Text style={s.heroSubtitle}>
                        Create GST invoices, file GSTR-1 & GSTR-3B, manage e-invoices, track inventory, and grow your business — all in one place.
                    </Text>

                    <View style={s.heroButtons}>
                        <TouchableOpacity style={s.primaryButton} onPress={handleStartTrial}>
                            <Text style={styles.primaryButtonText}>Start 10-Day Free Trial</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.secondaryButton} onPress={handleViewPricing}>
                            <Text style={styles.secondaryButtonText}>View Plans</Text>
                            <Ionicons name="chevron-forward" size={16} color="#005437" />
                        </TouchableOpacity>
                    </View>

                    {/* Trust badges */}
                    <View style={styles.trustRow}>
                        <TrustBadge icon="checkmark-circle" label="No credit card needed" />
                        <TrustBadge icon="shield-checkmark" label="GST Portal integrated" />
                        <TrustBadge icon="lock-closed" label="Bank-level security" />
                    </View>

                    {/* Stats */}
                    <View style={s.statsStrip}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>1 Lakh+</Text>
                            <Text style={styles.statLabel}>Invoices Generated</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>50,000+</Text>
                            <Text style={styles.statLabel}>GST Returns Filed</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>10,000+</Text>
                            <Text style={styles.statLabel}>Active Businesses</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>99.9%</Text>
                            <Text style={styles.statLabel}>Uptime SLA</Text>
                        </View>
                    </View>
                </View>

                {/* Features Section */}
                <View style={styles.section}>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>POWERFUL FEATURES</Text>
                    </View>
                    <Text style={s.sectionTitle}>Everything Your Business Needs</Text>
                    <Text style={styles.sectionSubtitle}>
                        From GST invoicing to e-way bills — Zentax covers every aspect of your business finances
                    </Text>

                    <View style={s.featuresGrid}>
                        <FeatureCard
                            icon="document-text"
                            title="GST e-Invoice Ready"
                            description="Generate IRN-stamped e-invoices as per GSTN mandate. Auto QR code, e-invoice portal integration included."
                            badge="Mandatory 2024"
                        />
                        <FeatureCard
                            icon="receipt"
                            title="GSTR-1 & 3B Auto-fill"
                            description="Auto-populate GST returns from your invoices. One-click JSON export for direct GSTN portal upload."
                        />
                        <FeatureCard
                            icon="barcode"
                            title="HSN / SAC Code Library"
                            description="Built-in library of 5000+ HSN and SAC codes with auto tax-rate mapping. Never pick the wrong GST rate again."
                        />
                        <FeatureCard
                            icon="cube"
                            title="Inventory & Stock Tracking"
                            description="Real-time stock management with low-stock alerts, batch tracking, and multi-warehouse support."
                        />
                        <FeatureCard
                            icon="swap-horizontal"
                            title="Purchase & Vendor Management"
                            description="Track purchases, manage vendor payments, reconcile 2A/2B, and auto-capture input tax credit."
                        />
                        <FeatureCard
                            icon="analytics"
                            title="P&L and Tax Reports"
                            description="Profit & loss statements, GST liability reports, TDS summaries, and balance sheets in one click."
                        />
                    </View>

                    <TouchableOpacity style={styles.viewAllButton} onPress={handleViewFeatures}>
                        <Text style={styles.viewAllButtonText}>Explore All Features</Text>
                        <Ionicons name="arrow-forward" size={18} color="#068B5E" />
                    </TouchableOpacity>
                </View>

                {/* How It Works */}
                <View style={styles.howItWorksSection}>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>HOW IT WORKS</Text>
                    </View>
                    <Text style={s.sectionTitle}>Up and Running in Minutes</Text>
                    <Text style={styles.sectionSubtitle}>No complex setup, no accounting degree needed</Text>

                    <View style={s.howItWorksRow}>
                        <View style={s.stepCard}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepTitle}>Add Your GSTIN</Text>
                            <Text style={styles.stepDescription}>Enter your GSTIN and we auto-fetch your business details from the GST portal</Text>
                        </View>
                        <View style={s.stepCard}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepTitle}>Create Your First Invoice</Text>
                            <Text style={styles.stepDescription}>Pick a customer, add items with HSN codes, and generate a GST-compliant invoice instantly</Text>
                        </View>
                        <View style={s.stepCard}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepTitle}>File Returns Effortlessly</Text>
                            <Text style={styles.stepDescription}>Export GSTR-1 & 3B JSON, or auto-file directly from Zentax — your returns are always on time</Text>
                        </View>
                    </View>
                </View>

                {/* Testimonials */}
                <View style={styles.section}>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>TRUSTED BY BUSINESSES</Text>
                    </View>
                    <Text style={s.sectionTitle}>What Our Customers Say</Text>

                    <View style={s.testimonialGrid}>
                        <View style={s.testimonialCard}>
                            <View style={styles.starsRow}>
                                {[1,2,3,4,5].map(i => (
                                    <Ionicons key={i} name="star" size={16} color="#F59E0B" />
                                ))}
                            </View>
                            <Text style={styles.testimonialText}>
                                "Zentax has made GST filing a breeze. GSTR-1 used to take us 3 hours, now it's done in 10 minutes with one click."
                            </Text>
                            <View style={styles.testimonialAuthor}>
                                <View style={styles.authorAvatar}>
                                    <Text style={styles.authorAvatarText}>RS</Text>
                                </View>
                                <View>
                                    <Text style={styles.authorName}>Rajesh Shah</Text>
                                    <Text style={styles.authorRole}>Textile Trader, Surat</Text>
                                </View>
                            </View>
                        </View>
                        <View style={s.testimonialCard}>
                            <View style={styles.starsRow}>
                                {[1,2,3,4,5].map(i => (
                                    <Ionicons key={i} name="star" size={16} color="#F59E0B" />
                                ))}
                            </View>
                            <Text style={styles.testimonialText}>
                                "The e-invoice generation and HSN code library saved us from costly mistakes. Best billing software for GST compliance."
                            </Text>
                            <View style={styles.testimonialAuthor}>
                                <View style={[styles.authorAvatar, { backgroundColor: '#005437' }]}>
                                    <Text style={styles.authorAvatarText}>PM</Text>
                                </View>
                                <View>
                                    <Text style={styles.authorName}>Priya Mehta</Text>
                                    <Text style={styles.authorRole}>Pharma Distributor, Mumbai</Text>
                                </View>
                            </View>
                        </View>
                        <View style={s.testimonialCard}>
                            <View style={styles.starsRow}>
                                {[1,2,3,4,5].map(i => (
                                    <Ionicons key={i} name="star" size={16} color="#F59E0B" />
                                ))}
                            </View>
                            <Text style={styles.testimonialText}>
                                "Switched from Tally to Zentax — the cloud access and mobile invoicing changed how we run our business."
                            </Text>
                            <View style={styles.testimonialAuthor}>
                                <View style={[styles.authorAvatar, { backgroundColor: '#43474B' }]}>
                                    <Text style={styles.authorAvatarText}>AK</Text>
                                </View>
                                <View>
                                    <Text style={styles.authorName}>Anil Kumar</Text>
                                    <Text style={styles.authorRole}>Electronics Retailer, Delhi</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* CTA Section */}
                <LinearGradient
                    colors={['#005437', '#068B5E']}
                    style={styles.ctaSection}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={s.ctaTitle}>Ready to Simplify Your GST?</Text>
                    <Text style={styles.ctaSubtitle}>
                        Join 10,000+ Indian businesses already filing smarter with Zentax
                    </Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={handleStartTrial}>
                        <Text style={styles.ctaButtonText}>Start Your Free 10-Day Trial</Text>
                        <Ionicons name="arrow-forward" size={20} color="#005437" />
                    </TouchableOpacity>
                    <Text style={styles.ctaNote}>No credit card · Cancel anytime · Free GSTIN verification</Text>
                </LinearGradient>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={s.footerContent}>
                        <View style={styles.footerSection}>
                            <View style={styles.footerLogoRow}>
                                <View style={styles.footerLogoMark}>
                                    <Text style={styles.footerLogoMarkText}>Z</Text>
                                </View>
                                <Text style={styles.footerTitle}>Zentax</Text>
                            </View>
                            <Text style={styles.footerText}>
                                India's most trusted GST billing and accounting software for SMEs and traders.
                            </Text>
                            <View style={styles.footerCompliance}>
                                <Ionicons name="shield-checkmark" size={14} color="#068B5E" />
                                <Text style={styles.footerComplianceText}>GSTN Certified · e-Invoice Ready</Text>
                            </View>
                        </View>

                        <View style={styles.footerSection}>
                            <Text style={styles.footerHeading}>Product</Text>
                            <TouchableOpacity onPress={handleViewFeatures}>
                                <Text style={styles.footerLink}>Features</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleViewPricing}>
                                <Text style={styles.footerLink}>Pricing</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerLink}>e-Invoice</Text>
                            <Text style={styles.footerLink}>GST Returns</Text>
                        </View>

                        <View style={styles.footerSection}>
                            <Text style={styles.footerHeading}>Company</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('LandingAbout')}>
                                <Text style={styles.footerLink}>About Us</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('LandingContact')}>
                                <Text style={styles.footerLink}>Contact</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerLink}>Blog</Text>
                            <Text style={styles.footerLink}>Careers</Text>
                        </View>

                        <View style={styles.footerSection}>
                            <Text style={styles.footerHeading}>Legal</Text>
                            <Text style={styles.footerLink}>Privacy Policy</Text>
                            <Text style={styles.footerLink}>Terms of Service</Text>
                            <Text style={styles.footerLink}>Refund Policy</Text>
                            <Text style={styles.footerLink}>Data Security</Text>
                        </View>
                    </View>

                    <View style={styles.footerBottom}>
                        <Text style={styles.footerCopyright}>
                            © 2026 Zentax. All rights reserved. Made in India 🇮🇳
                        </Text>
                        <Text style={styles.footerGst}>
                            GST software for GSTR-1 · GSTR-3B · e-Invoice · e-Way Bill
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(6, 139, 94, 0.08)',
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 100,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.18)',
    },
    heroBadgeText: {
        fontSize: 12,
        color: '#005437',
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    secondaryButtonText: {
        color: '#005437',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    trustRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 48,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trustBadgeText: {
        fontSize: 13,
        color: '#43474B',
        fontWeight: '500',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 34,
        fontWeight: '800',
        color: '#005437',
        marginBottom: 6,
        letterSpacing: -0.8,
    },
    statLabel: {
        fontSize: 13,
        color: '#929598',
        fontWeight: '600',
        letterSpacing: 0.2,
        textAlign: 'center',
    },
    section: {
        paddingVertical: 88,
        paddingHorizontal: 24,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
    },
    howItWorksSection: {
        paddingVertical: 88,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
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
    },
    sectionBadgeText: {
        fontSize: 11,
        color: '#005437',
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    sectionSubtitle: {
        fontSize: 17,
        color: '#929598',
        textAlign: 'center',
        marginBottom: 56,
        lineHeight: 28,
        fontWeight: '400',
        maxWidth: 600,
    },
    featureBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 100,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    featureBadgeText: {
        fontSize: 10,
        color: '#D97706',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: 'rgba(6, 139, 94, 0.09)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.16)',
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#191919',
        marginBottom: 10,
        letterSpacing: 0.1,
    },
    featureDescription: {
        fontSize: 14,
        color: '#929598',
        lineHeight: 22,
        fontWeight: '400',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        alignSelf: 'center',
        paddingVertical: 13,
        paddingHorizontal: 28,
        borderRadius: 10,
        backgroundColor: 'rgba(6, 139, 94, 0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(6, 139, 94, 0.22)',
    },
    viewAllButtonText: {
        fontSize: 15,
        color: '#068B5E',
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    stepNumber: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#068B5E',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    stepNumberText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#191919',
        marginBottom: 10,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 14,
        color: '#929598',
        lineHeight: 22,
        textAlign: 'center',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 3,
        marginBottom: 16,
    },
    testimonialText: {
        fontSize: 15,
        color: '#43474B',
        lineHeight: 24,
        fontStyle: 'italic',
        marginBottom: 20,
    },
    testimonialAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    authorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#068B5E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    authorAvatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    authorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#191919',
    },
    authorRole: {
        fontSize: 12,
        color: '#929598',
        fontWeight: '400',
    },
    ctaSection: {
        paddingVertical: 88,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    ctaSubtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 28,
        fontWeight: '400',
        maxWidth: 540,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 17,
        paddingHorizontal: 40,
        borderRadius: 12,
        gap: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    ctaButtonText: {
        color: '#005437',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    ctaNote: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.65)',
        fontWeight: '400',
        textAlign: 'center',
    },
    footer: {
        backgroundColor: '#191919',
        borderTopWidth: 1,
        borderTopColor: '#2a2e32',
        paddingVertical: 64,
        paddingHorizontal: 24,
    },
    footerSection: {
        gap: 12,
        flex: 1,
        minWidth: 140,
    },
    footerLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    footerLogoMark: {
        width: 32,
        height: 32,
        borderRadius: 7,
        backgroundColor: '#068B5E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLogoMarkText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    footerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    footerHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    footerText: {
        fontSize: 13,
        color: '#929598',
        lineHeight: 21,
        fontWeight: '400',
        maxWidth: 240,
    },
    footerCompliance: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    footerComplianceText: {
        fontSize: 12,
        color: '#068B5E',
        fontWeight: '600',
    },
    footerLink: {
        fontSize: 13,
        color: '#929598',
        fontWeight: '400',
        paddingVertical: 3,
    },
    footerBottom: {
        paddingTop: 36,
        borderTopWidth: 1,
        borderTopColor: '#2a2e32',
        alignItems: 'center',
        gap: 8,
    },
    footerCopyright: {
        fontSize: 13,
        color: '#43474B',
        fontWeight: '400',
    },
    footerGst: {
        fontSize: 11,
        color: '#2a2e32',
        fontWeight: '400',
        letterSpacing: 0.3,
    },
});
