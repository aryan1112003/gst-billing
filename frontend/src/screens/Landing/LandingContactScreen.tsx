import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LandingNav } from '../../components/Landing/LandingNav';
import { useResponsive } from '../../utils/responsive';

export const LandingContactScreen: React.FC = () => {
    const { isMobile, isTablet, rs } = useResponsive();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        gstin: '',
        subject: '',
        message: '',
    });

    const handleSubmit = () => {
        if (!formData.name || !formData.email || !formData.message) {
            Alert.alert('Error', 'Please fill in name, email, and message fields');
            return;
        }
        Alert.alert('Message Sent!', 'Thank you for reaching out. Our team will get back to you within 24 hours.');
        setFormData({ name: '', email: '', phone: '', gstin: '', subject: '', message: '' });
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
        contentLayout: {
            flexDirection: rs('column', 'row', 'row') as any,
            gap: 40,
            maxWidth: 1100,
            alignSelf: 'center',
            width: '100%',
        },
    }), [isMobile, isTablet]);

    const contactMethods = [
        {
            icon: 'mail' as const,
            label: 'Email Support',
            value: 'support@zentax.in',
            note: 'Response within 24 hours',
        },
        {
            icon: 'call' as const,
            label: 'Phone Support',
            value: '+91 98765 43210',
            note: 'Mon–Sat, 9 AM – 6 PM IST',
        },
        {
            icon: 'location' as const,
            label: 'Office',
            value: 'Mumbai, Maharashtra',
            note: 'India',
        },
    ];

    return (
        <View style={styles.container}>
            <LandingNav currentPage="LandingContact" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>CONTACT US</Text>
                    </View>
                    <Text style={s.headerTitle}>We're Here to Help</Text>
                    <Text style={styles.headerSubtitle}>
                        Questions about GST compliance, billing features, or enterprise pricing? Our team of tax and tech experts is ready to assist.
                    </Text>
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                    <View style={s.contentLayout}>
                        {/* Contact Form */}
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>Send Us a Message</Text>
                            <Text style={styles.formSubtitle}>We typically respond within 24 hours</Text>

                            <View style={styles.formField}>
                                <Text style={styles.fieldLabel}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your full name"
                                    placeholderTextColor="#CACCCF"
                                    value={formData.name}
                                    onChangeText={(v) => setFormData({ ...formData, name: v })}
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={styles.fieldLabel}>Email Address *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@company.com"
                                    placeholderTextColor="#CACCCF"
                                    value={formData.email}
                                    onChangeText={(v) => setFormData({ ...formData, email: v })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={styles.fieldLabel}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+91 XXXXX XXXXX"
                                    placeholderTextColor="#CACCCF"
                                    value={formData.phone}
                                    onChangeText={(v) => setFormData({ ...formData, phone: v })}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={styles.fieldLabel}>GSTIN (optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="15-digit GSTIN"
                                    placeholderTextColor="#CACCCF"
                                    value={formData.gstin}
                                    onChangeText={(v) => setFormData({ ...formData, gstin: v.toUpperCase() })}
                                    autoCapitalize="characters"
                                    maxLength={15}
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={styles.fieldLabel}>Subject</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. e-Invoice setup, pricing, billing issue"
                                    placeholderTextColor="#CACCCF"
                                    value={formData.subject}
                                    onChangeText={(v) => setFormData({ ...formData, subject: v })}
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={styles.fieldLabel}>Message *</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Describe your question or issue in detail..."
                                    placeholderTextColor="#CACCCF"
                                    value={formData.message}
                                    onChangeText={(v) => setFormData({ ...formData, message: v })}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.submitButtonText}>Send Message</Text>
                                <Ionicons name="send" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Contact Info */}
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactInfoTitle}>Get in Touch</Text>
                            {contactMethods.map((method, i) => (
                                <View key={i} style={styles.contactMethod}>
                                    <View style={styles.contactMethodIcon}>
                                        <Ionicons name={method.icon} size={20} color="#068B5E" />
                                    </View>
                                    <View>
                                        <Text style={styles.contactMethodLabel}>{method.label}</Text>
                                        <Text style={styles.contactMethodValue}>{method.value}</Text>
                                        <Text style={styles.contactMethodNote}>{method.note}</Text>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.gstHelpBox}>
                                <View style={styles.gstHelpHeader}>
                                    <Ionicons name="help-circle" size={20} color="#068B5E" />
                                    <Text style={styles.gstHelpTitle}>GST Helpdesk</Text>
                                </View>
                                <Text style={styles.gstHelpText}>
                                    Need help with GSTR filing, e-invoice setup, or HSN code queries? Our dedicated GST support team is available Mon–Sat.
                                </Text>
                                <View style={styles.gstHelpTopics}>
                                    {['GSTR-1 Filing', 'e-Invoice Setup', 'ITC Reconciliation', 'e-Way Bill'].map((t, i) => (
                                        <View key={i} style={styles.gstTopic}>
                                            <Ionicons name="checkmark-circle" size={14} color="#068B5E" />
                                            <Text style={styles.gstTopicText}>{t}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

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
        maxWidth: 580,
    },
    contentSection: {
        paddingVertical: 56,
        paddingHorizontal: 24,
    },
    formCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        borderWidth: 1,
        borderColor: '#E8EAEC',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#191919',
        marginBottom: 6,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#929598',
        marginBottom: 28,
    },
    formField: {
        marginBottom: 18,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#43474B',
        marginBottom: 7,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#E8EAEC',
        borderRadius: 10,
        paddingVertical: 13,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#191919',
        backgroundColor: '#FAFAFA',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 13,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#068B5E',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: '#005437',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    contactInfo: {
        width: 320,
        flexShrink: 0,
        gap: 0,
    },
    contactInfoTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#191919',
        marginBottom: 24,
    },
    contactMethod: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    contactMethodIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(6, 139, 94, 0.09)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.16)',
        flexShrink: 0,
    },
    contactMethodLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#929598',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    contactMethodValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#191919',
        marginBottom: 2,
    },
    contactMethodNote: {
        fontSize: 12,
        color: '#929598',
    },
    gstHelpBox: {
        backgroundColor: 'rgba(6, 139, 94, 0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.15)',
        marginTop: 12,
    },
    gstHelpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    gstHelpTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#005437',
    },
    gstHelpText: {
        fontSize: 13,
        color: '#43474B',
        lineHeight: 20,
        marginBottom: 14,
    },
    gstHelpTopics: {
        gap: 8,
    },
    gstTopic: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    gstTopicText: {
        fontSize: 13,
        color: '#43474B',
        fontWeight: '500',
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
