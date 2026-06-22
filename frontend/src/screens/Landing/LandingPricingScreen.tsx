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
import { useNavigation } from '@react-navigation/native';
import { LandingNav } from '../../components/Landing/LandingNav';
import { useResponsive } from '../../utils/responsive';

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    onSelect: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
    title, price, period, description, features, isPopular, onSelect,
}) => {
    const { isMobile, isTablet, rs } = useResponsive();
    const s = useMemo(() => StyleSheet.create({
        pricingCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 32,
            width: rs('100%', '31.5%', '31.5%') as any,
            borderWidth: 1.5,
            borderColor: '#E8EAEC',
            position: 'relative',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
        },
        popularCard: {
            borderColor: '#068B5E',
            borderWidth: 2.5,
        },
    }), [isMobile, isTablet]);

    if (isPopular) {
        return (
            <View style={[s.pricingCard, s.popularCard]}>
                <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
                <Text style={styles.pricingTitle}>{title}</Text>
                <Text style={styles.pricingDescription}>{description}</Text>
                <View style={styles.priceContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={[styles.price, { color: '#068B5E' }]}>{price}</Text>
                    <Text style={styles.period}>/{period}</Text>
                </View>
                <View style={styles.featuresContainer}>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#068B5E" />
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>
                <TouchableOpacity style={styles.selectButtonPopular} onPress={onSelect}>
                    <Text style={styles.selectButtonTextPopular}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={s.pricingCard}>
            <Text style={styles.pricingTitle}>{title}</Text>
            <Text style={styles.pricingDescription}>{description}</Text>
            <View style={styles.priceContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.price}>{price}</Text>
                <Text style={styles.period}>/{period}</Text>
            </View>
            <View style={styles.featuresContainer}>
                {features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={18} color="#068B5E" />
                        <Text style={styles.featureText}>{feature}</Text>
                    </View>
                ))}
            </View>
            <TouchableOpacity style={styles.selectButton} onPress={onSelect}>
                <Text style={styles.selectButtonText}>Get Started</Text>
            </TouchableOpacity>
        </View>
    );
};

export const LandingPricingScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { isMobile, isTablet, rs } = useResponsive();

    const handlePlanSelect = (plan: string) => {
        navigation.navigate('AgencyRegistration');
    };

    const s = useMemo(() => StyleSheet.create({
        headerTitle: {
            fontSize: rs(32, 40, 48),
            fontWeight: '800',
            color: '#191919',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: -0.8,
        },
        pricingGrid: {
            flexDirection: rs('column', 'row', 'row') as any,
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 20,
            maxWidth: 1100,
            alignSelf: 'center',
            width: '100%',
            marginBottom: 32,
        },
        faqTitle: {
            fontSize: rs(26, 30, 36),
            fontWeight: '800',
            color: '#191919',
            textAlign: 'center',
            marginBottom: 44,
            letterSpacing: -0.5,
        },
    }), [isMobile, isTablet]);

    const plans = [
        {
            title: 'TRIAL',
            price: '0',
            period: '10 days',
            description: 'Full access to explore Zentax — no card needed',
            features: [
                '10 Days Full Access',
                'Up to 4 Users',
                'Up to 10 Invoices',
                'GST Invoice Generation',
                'Basic Inventory',
                'Email Support',
                'Mobile & Web Access',
            ],
        },
        {
            title: 'STARTER',
            price: '999',
            period: 'month',
            description: 'Perfect for small businesses and traders',
            isPopular: true,
            features: [
                'Unlimited GST Invoices',
                'e-Invoice (IRN) Generation',
                'GSTR-1 & 3B Auto-fill',
                'HSN Code Library',
                'Up to 4 Users',
                'Full Inventory Management',
                'Purchase & Vendor Module',
                'GST Reports & Analytics',
                'Priority Email Support',
            ],
        },
        {
            title: 'PRO',
            price: '2,999',
            period: 'month',
            description: 'For growing businesses with advanced needs',
            features: [
                'Everything in Starter',
                'e-Way Bill Management',
                'Up to 10 Users',
                '2A/2B ITC Reconciliation',
                'Multi-warehouse Inventory',
                'Tally Export Compatible',
                'Custom Reports',
                'API Access',
                'Dedicated Account Manager',
            ],
        },
    ];

    const faqs = [
        {
            q: 'Can I change my plan later?',
            a: 'Yes, you can upgrade or downgrade at any time from your account settings. Changes take effect immediately.',
        },
        {
            q: 'What payment methods do you accept?',
            a: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets including Paytm, PhonePe, and GPay.',
        },
        {
            q: 'Is my GST data secure?',
            a: 'Yes. All data is encrypted with bank-level AES-256 security. We are SOC 2 compliant and never share your data.',
        },
        {
            q: 'Can Zentax file GST returns directly?',
            a: 'Zentax generates GSTR-1 and GSTR-3B JSON files ready for direct upload. Direct API filing is available on the PRO plan.',
        },
        {
            q: 'Is there a setup fee?',
            a: 'No setup fees, ever. You only pay for your chosen subscription plan, starting after the free trial.',
        },
        {
            q: 'Can I cancel anytime?',
            a: 'Yes, you can cancel your subscription at any time with no questions asked. Your data remains available for 30 days after cancellation.',
        },
    ];

    return (
        <View style={styles.container}>
            <LandingNav currentPage="LandingPricing" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>PRICING</Text>
                    </View>
                    <Text style={s.headerTitle}>Simple, Transparent Pricing</Text>
                    <Text style={styles.headerSubtitle}>
                        Start free for 10 days. No credit card required. Cancel anytime.
                    </Text>

                    {/* Value props */}
                    <View style={styles.valuePropRow}>
                        {['GST Compliant', 'e-Invoice Ready', 'GSTN Integrated', 'Made in India'].map((v, i) => (
                            <View key={i} style={styles.valueProp}>
                                <Ionicons name="checkmark-circle" size={16} color="#068B5E" />
                                <Text style={styles.valuePropText}>{v}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Pricing Cards */}
                <View style={styles.pricingContainer}>
                    <View style={s.pricingGrid}>
                        {plans.map((plan, index) => (
                            <PricingCard
                                key={index}
                                {...plan}
                                onSelect={() => handlePlanSelect(plan.title.toLowerCase())}
                            />
                        ))}
                    </View>
                    <Text style={styles.pricingNote}>
                        * Prices in INR + GST. Annual plans available at 20% discount. Subscription purchased inside portal after registration.
                    </Text>
                </View>

                {/* FAQ Section */}
                <View style={styles.faqSection}>
                    <Text style={s.faqTitle}>Frequently Asked Questions</Text>
                    <View style={styles.faqGrid}>
                        {faqs.map((faq, index) => (
                            <View key={index} style={styles.faqItem}>
                                <Text style={styles.faqQuestion}>{faq.q}</Text>
                                <Text style={styles.faqAnswer}>{faq.a}</Text>
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
                    <Text style={styles.ctaTitle}>Start Your Free 10-Day Trial</Text>
                    <Text style={styles.ctaSubtitle}>No credit card · No setup fee · Cancel anytime</Text>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => navigation.navigate('AgencyRegistration')}
                    >
                        <Text style={styles.ctaButtonText}>Get Started Free</Text>
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
        marginBottom: 28,
    },
    valuePropRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        justifyContent: 'center',
    },
    valueProp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    valuePropText: {
        fontSize: 13,
        color: '#43474B',
        fontWeight: '500',
    },
    pricingContainer: {
        paddingVertical: 64,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    popularBadge: {
        position: 'absolute',
        top: -14,
        alignSelf: 'center',
        backgroundColor: '#068B5E',
        paddingVertical: 4,
        paddingHorizontal: 16,
        borderRadius: 100,
    },
    popularBadgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '800',
        letterSpacing: 1,
    },
    pricingTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#929598',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginTop: 8,
    },
    pricingDescription: {
        fontSize: 14,
        color: '#929598',
        marginBottom: 20,
        lineHeight: 21,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
        marginBottom: 24,
    },
    currencySymbol: {
        fontSize: 22,
        fontWeight: '700',
        color: '#191919',
        marginBottom: 8,
    },
    price: {
        fontSize: 48,
        fontWeight: '800',
        color: '#191919',
        letterSpacing: -1,
    },
    period: {
        fontSize: 15,
        color: '#929598',
        marginBottom: 12,
    },
    featuresContainer: {
        gap: 10,
        marginBottom: 28,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    featureText: {
        fontSize: 14,
        color: '#43474B',
        lineHeight: 21,
        flex: 1,
    },
    selectButton: {
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CACCCF',
        alignItems: 'center',
    },
    selectButtonText: {
        fontSize: 15,
        color: '#43474B',
        fontWeight: '700',
    },
    selectButtonPopular: {
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#068B5E',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#005437',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    selectButtonTextPopular: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    pricingNote: {
        fontSize: 12,
        color: '#929598',
        textAlign: 'center',
        maxWidth: 560,
        lineHeight: 20,
    },
    faqSection: {
        paddingVertical: 72,
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8EAEC',
    },
    faqGrid: {
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
        gap: 0,
    },
    faqItem: {
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F5',
    },
    faqQuestion: {
        fontSize: 17,
        fontWeight: '700',
        color: '#191919',
        marginBottom: 8,
    },
    faqAnswer: {
        fontSize: 15,
        color: '#929598',
        lineHeight: 24,
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
