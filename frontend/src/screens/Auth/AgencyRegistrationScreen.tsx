import React, { useState, useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
} from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { TextInput, ProgressBar } from 'react-native-paper';
import { PhoneInput } from '../../components/Common/PhoneInput';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { publicAPI } from '../../services/api';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INPUT_THEME = {
    colors: {
        onSurfaceVariant: '#929598',
        background: '#FAFAFA',
        primary: '#068B5E',
    },
};

export const AgencyRegistrationScreen = ({ navigation }: any) => {
    const { isMobile, isTablet, isDesktop, rs } = useResponsive();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [userId, setUserId] = useState<string | number | null>(null);

    const [formData, setFormData] = useState({
        accountType: 'agency',
        companyName: '',
        ownerName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        gstNumber: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (formData.accountType === 'agency' && !formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.ownerName.trim()) newErrors.ownerName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            const response = await publicAPI.registerAgency(formData);
            if (response.success) {
                if (response.data.requiresVerification) {
                    setUserId(response.data.userId);
                    setShowOtp(true);
                } else if (response.data.token) {
                    dispatch(loginSuccess({
                        user: {
                            id: String(response.data.user.id),
                            email: response.data.user.email,
                            name: response.data.user.username,
                            role: response.data.user.role,
                            agencyId: response.data.user.agencyId,
                            isTrial: response.data.user?.isTrial,
                            trialEndsAt: response.data.user?.trialEndsAt,
                            permissions: ['read', 'write', 'delete'],
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        token: response.data.token,
                    }));
                }
            }
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            setErrors({ otp: 'Please enter the 6-digit code' });
            return;
        }
        if (userId === null || userId === undefined) {
            setErrors({ otp: 'Session expired. Please restart registration.' });
            return;
        }
        setLoading(true);
        try {
            const response = await publicAPI.verifyRegistrationOtp(userId, otp);
            if (response.success) {
                const userData = response.data.user;
                setVerificationSuccess(true);
                setTimeout(() => {
                    dispatch(loginSuccess({
                        user: {
                            id: String(userData.id),
                            email: userData.email,
                            name: userData.username,
                            role: userData.role,
                            agencyId: userData.agencyId,
                            isTrial: userData.isTrial,
                            trialEndsAt: userData.trialEndsAt,
                            permissions: ['read', 'write', 'delete'],
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        token: response.data.token
                    }));
                }, 2000);
            }
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            await publicAPI.resendRegistrationOtp(userId);
            Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (showOtp) { setShowOtp(false); setOtp(''); }
        else if (step > 1) setStep(1);
        else navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top, maxWidth: rs(undefined, 800, 1000) as any }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Green gradient header */}
                    <LinearGradient
                        colors={['#005437', '#068B5E']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Back button */}
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.85)" />
                        </TouchableOpacity>

                        {/* Logo row */}
                        <View style={styles.logoRow}>
                            <View style={styles.logoMark}>
                                <Text style={styles.logoMarkText}>Z</Text>
                            </View>
                            <Text style={styles.logoText}>Zentax</Text>
                        </View>

                        <Text style={styles.headerTitle}>
                            {showOtp ? 'Verify Your Email' : 'Start Free Trial'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {showOtp
                                ? `We sent a 6-digit code to ${formData.email}`
                                : `Step ${step} of 2 · ${step === 1 ? 'Basic Info' : 'Business Details'}`}
                        </Text>

                        {!showOtp && (
                            <View style={styles.progressOuter}>
                                <View style={[styles.progressInner, { width: `${(step / 2) * 100}%` }]} />
                            </View>
                        )}
                    </LinearGradient>

                    {/* Form Card */}
                    <View style={styles.card}>
                        {verificationSuccess ? (
                            <View style={styles.successContainer}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark-circle" size={56} color="#068B5E" />
                                </View>
                                <Text style={styles.successTitle}>Account Created!</Text>
                                <Text style={styles.successSubtitle}>
                                    Setting up your Zentax dashboard...
                                </Text>
                                <ProgressBar indeterminate color="#068B5E" style={styles.successProgress} />
                            </View>
                        ) : showOtp ? (
                            <View style={styles.formSection}>
                                <View style={styles.otpIconContainer}>
                                    <Ionicons name="mail" size={28} color="#068B5E" />
                                </View>
                                <Text style={styles.otpInstructions}>
                                    Enter the 6-digit verification code sent to your email address.
                                </Text>

                                <TextInput
                                    label="Verification Code"
                                    value={otp}
                                    onChangeText={(t) => { setOtp(t); setErrors({}); }}
                                    mode="outlined"
                                    style={styles.input}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    error={!!errors.otp}
                                    outlineColor="#E8EAEC"
                                    activeOutlineColor="#068B5E"
                                    textColor="#191919"
                                    theme={INPUT_THEME}
                                    left={<TextInput.Icon icon="shield-check" color="#929598" />}
                                />
                                {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

                                <TouchableOpacity onPress={handleResendOtp} disabled={loading} style={styles.resendButton}>
                                    <Text style={styles.resendText}>
                                        Didn't receive a code?{' '}
                                        <Text style={styles.resendTextBold}>Resend Code</Text>
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleVerifyOtp}
                                    disabled={loading}
                                    style={[styles.mainButton, loading && styles.mainButtonDisabled]}
                                >
                                    <Text style={styles.mainButtonText}>
                                        {loading ? 'Verifying...' : 'Verify & Activate'}
                                    </Text>
                                    {!loading && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.formSection}>
                                {step === 1 ? (
                                    <>
                                        {/* Account type */}
                                        <Text style={styles.sectionLabel}>ACCOUNT TYPE</Text>
                                        <View style={styles.tabContainer}>
                                            <TouchableOpacity
                                                style={[styles.tab, formData.accountType === 'agency' && styles.activeTab]}
                                                onPress={() => setFormData({ ...formData, accountType: 'agency' })}
                                            >
                                                <MaterialIcons
                                                    name="business"
                                                    size={20}
                                                    color={formData.accountType === 'agency' ? '#068B5E' : '#929598'}
                                                />
                                                <Text style={[styles.tabText, formData.accountType === 'agency' && styles.activeTabText]}>
                                                    Agency
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.tab, formData.accountType === 'user' && styles.activeTab]}
                                                onPress={() => setFormData({ ...formData, accountType: 'user' })}
                                            >
                                                <MaterialIcons
                                                    name="person"
                                                    size={20}
                                                    color={formData.accountType === 'user' ? '#068B5E' : '#929598'}
                                                />
                                                <Text style={[styles.tabText, formData.accountType === 'user' && styles.activeTabText]}>
                                                    Personal
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {formData.accountType === 'agency' && (
                                            <>
                                                <TextInput
                                                    label="Company Name *"
                                                    value={formData.companyName}
                                                    onChangeText={(t) => setFormData({ ...formData, companyName: t })}
                                                    mode="outlined"
                                                    style={styles.input}
                                                    error={!!errors.companyName}
                                                    outlineColor="#E8EAEC"
                                                    activeOutlineColor="#068B5E"
                                                    textColor="#191919"
                                                    theme={INPUT_THEME}
                                                    left={<TextInput.Icon icon="domain" color="#929598" />}
                                                />
                                                {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}
                                            </>
                                        )}

                                        <TextInput
                                            label="Your Full Name *"
                                            value={formData.ownerName}
                                            onChangeText={(t) => setFormData({ ...formData, ownerName: t })}
                                            mode="outlined"
                                            style={styles.input}
                                            error={!!errors.ownerName}
                                            outlineColor="#E8EAEC"
                                            activeOutlineColor="#068B5E"
                                            textColor="#191919"
                                            theme={INPUT_THEME}
                                            left={<TextInput.Icon icon="account" color="#929598" />}
                                        />
                                        {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName}</Text>}

                                        <TextInput
                                            label="Email Address *"
                                            value={formData.email}
                                            onChangeText={(t) => setFormData({ ...formData, email: t.toLowerCase() })}
                                            mode="outlined"
                                            style={styles.input}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            error={!!errors.email}
                                            outlineColor="#E8EAEC"
                                            activeOutlineColor="#068B5E"
                                            textColor="#191919"
                                            theme={INPUT_THEME}
                                            left={<TextInput.Icon icon="email" color="#929598" />}
                                        />
                                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                                        <TextInput
                                            label="Password *"
                                            value={formData.password}
                                            onChangeText={(t) => setFormData({ ...formData, password: t })}
                                            mode="outlined"
                                            secureTextEntry
                                            style={styles.input}
                                            error={!!errors.password}
                                            outlineColor="#E8EAEC"
                                            activeOutlineColor="#068B5E"
                                            textColor="#191919"
                                            theme={INPUT_THEME}
                                            left={<TextInput.Icon icon="lock" color="#929598" />}
                                        />
                                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                                        <TextInput
                                            label="Confirm Password *"
                                            value={formData.confirmPassword}
                                            onChangeText={(t) => setFormData({ ...formData, confirmPassword: t })}
                                            mode="outlined"
                                            secureTextEntry
                                            style={styles.input}
                                            error={!!errors.confirmPassword}
                                            outlineColor="#E8EAEC"
                                            activeOutlineColor="#068B5E"
                                            textColor="#191919"
                                            theme={INPUT_THEME}
                                            left={<TextInput.Icon icon="lock-check" color="#929598" />}
                                        />
                                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                                    </>
                                ) : (
                                    <>
                                        <PhoneInput
                                            label="Phone Number"
                                            value={formData.phone}
                                            onChangePhone={(fullPhone, isValid) => {
                                                setFormData({ ...formData, phone: fullPhone });
                                            }}
                                            activeColor="#068B5E"
                                            borderColor="#E8EAEC"
                                            selectorBg="#F3F4F5"
                                            textColor="#191919"
                                            labelColor="#929598"
                                            style={styles.input}
                                        />

                                        <TextInput
                                            label="GSTIN (Optional)"
                                            value={formData.gstNumber}
                                            onChangeText={(t) => setFormData({ ...formData, gstNumber: t.toUpperCase() })}
                                            mode="outlined"
                                            style={styles.input}
                                            autoCapitalize="characters"
                                            maxLength={15}
                                            outlineColor="#E8EAEC"
                                            activeOutlineColor="#068B5E"
                                            textColor="#191919"
                                            theme={INPUT_THEME}
                                            left={<TextInput.Icon icon="file-document" color="#929598" />}
                                        />
                                        <Text style={styles.inputHint}>15-digit GSTIN — required for e-invoice generation</Text>

                                        <TextInput
                                            label="Business Address"
                                            value={formData.address}
                                            onChangeText={(t) => setFormData({ ...formData, address: t })}
                                            mode="outlined"
                                            style={styles.input}
                                            multiline
                                            numberOfLines={2}
                                            outlineColor="#E8EAEC"
                                            activeOutlineColor="#068B5E"
                                            textColor="#191919"
                                            theme={INPUT_THEME}
                                            left={<TextInput.Icon icon="map-marker" color="#929598" />}
                                        />

                                        <View style={styles.row}>
                                            <TextInput
                                                label="City"
                                                value={formData.city}
                                                onChangeText={(t) => setFormData({ ...formData, city: t })}
                                                mode="outlined"
                                                style={[styles.input, styles.half]}
                                                outlineColor="#E8EAEC"
                                                activeOutlineColor="#068B5E"
                                                textColor="#191919"
                                                theme={INPUT_THEME}
                                            />
                                            <TextInput
                                                label="State"
                                                value={formData.state}
                                                onChangeText={(t) => setFormData({ ...formData, state: t })}
                                                mode="outlined"
                                                style={[styles.input, styles.half]}
                                                outlineColor="#E8EAEC"
                                                activeOutlineColor="#068B5E"
                                                textColor="#191919"
                                                theme={INPUT_THEME}
                                            />
                                        </View>

                                        <TextInput
                                            label="PIN Code"
                                            value={formData.zipCode}
                                            onChangeText={(t) => setFormData({ ...formData, zipCode: t })}
                                            mode="outlined"
                                            style={[styles.input, styles.half]}
                                            keyboardType="numeric"
                                            maxLength={6}
                                            outlineColor="#E8EAEC"
                                            activeOutlineColor="#068B5E"
                                            textColor="#191919"
                                            theme={INPUT_THEME}
                                        />
                                    </>
                                )}

                                <TouchableOpacity
                                    onPress={step === 1 ? handleNext : handleRegister}
                                    disabled={loading}
                                    style={[styles.mainButton, loading && styles.mainButtonDisabled]}
                                >
                                    <Text style={styles.mainButtonText}>
                                        {loading ? 'Processing...' : step === 1 ? 'Continue' : 'Create My Account'}
                                    </Text>
                                    {!loading && (
                                        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>

                                {step === 1 && (
                                    <Text style={styles.termsText}>
                                        By continuing, you agree to Zentax's{' '}
                                        <Text style={styles.termsLink}>Terms of Service</Text>
                                        {' '}and{' '}
                                        <Text style={styles.termsLink}>Privacy Policy</Text>
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Benefits strip */}
                    {!verificationSuccess && (
                        <View style={styles.benefits}>
                            <Text style={styles.benefitsTitle}>What's included in your trial</Text>
                            <View style={styles.benefitsGrid}>
                                {[
                                    { icon: 'receipt-outline' as const, text: 'Unlimited GST Invoices' },
                                    { icon: 'shield-checkmark-outline' as const, text: 'e-Invoice (IRN) Ready' },
                                    { icon: 'card-outline' as const, text: 'No credit card needed' },
                                    { icon: 'people-outline' as const, text: 'Up to 4 team members' },
                                    { icon: 'document-text-outline' as const, text: 'GSTR-1 & 3B auto-fill' },
                                    { icon: 'headset-outline' as const, text: 'Priority email support' },
                                ].map((item, i) => (
                                    <View key={i} style={styles.benefitChip}>
                                        <Ionicons name={item.icon} size={15} color="#068B5E" />
                                        <Text style={styles.benefitText}>{item.text}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    flex: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 60,
        alignSelf: 'center',
        width: '100%',
    },
    headerGradient: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    logoMark: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoMarkText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    logoText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 20,
    },
    progressOuter: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressInner: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
    },
    card: {
        marginHorizontal: 16,
        marginTop: -20,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8EAEC',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 10,
        overflow: 'hidden',
    },
    formSection: {
        padding: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#929598',
        marginBottom: 12,
        letterSpacing: 1.2,
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E8EAEC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
    },
    activeTab: {
        borderColor: '#068B5E',
        backgroundColor: 'rgba(6, 139, 94, 0.06)',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#929598',
    },
    activeTabText: {
        color: '#068B5E',
    },
    input: {
        marginBottom: 4,
        backgroundColor: '#FAFAFA',
    },
    inputHint: {
        fontSize: 11,
        color: '#929598',
        marginBottom: 16,
        marginTop: 2,
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    half: {
        flex: 1,
    },
    mainButton: {
        marginTop: 20,
        borderRadius: 13,
        backgroundColor: '#068B5E',
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#005437',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
        elevation: 8,
    },
    mainButtonDisabled: {
        opacity: 0.65,
    },
    mainButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    termsText: {
        fontSize: 12,
        color: '#929598',
        textAlign: 'center',
        marginTop: 14,
        lineHeight: 18,
    },
    termsLink: {
        color: '#068B5E',
        fontWeight: '600',
    },
    errorText: {
        color: '#f43f5e',
        fontSize: 12,
        marginTop: -2,
        marginBottom: 14,
        marginLeft: 4,
    },
    otpIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(6, 139, 94, 0.09)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(6, 139, 94, 0.16)',
    },
    otpInstructions: {
        fontSize: 15,
        color: '#43474B',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 24,
    },
    resendButton: {
        alignSelf: 'center',
        paddingVertical: 12,
        marginBottom: 8,
    },
    resendText: {
        fontSize: 14,
        color: '#929598',
    },
    resendTextBold: {
        color: '#068B5E',
        fontWeight: '700',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    successIcon: {
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#191919',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    successSubtitle: {
        fontSize: 15,
        color: '#929598',
        textAlign: 'center',
        marginBottom: 32,
    },
    successProgress: {
        width: 160,
        height: 4,
        borderRadius: 2,
    },
    benefits: {
        marginTop: 32,
        marginHorizontal: 16,
        paddingHorizontal: 4,
        paddingBottom: 8,
    },
    benefitsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#43474B',
        marginBottom: 14,
        textAlign: 'center',
    },
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    benefitChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#E8EAEC',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    benefitText: {
        fontSize: 13,
        color: '#43474B',
        fontWeight: '500',
    },
});
