import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { User } from '../../types';
import { validateEmail } from '../../utils/validation';
import { useResponsive } from '../../utils/responsive';

export const LoginScreen: React.FC<{ navigation?: any }> = ({ navigation: navProp }) => {
  const navigation = navProp || useNavigation<any>();
  const dispatch = useDispatch();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');
    dispatch(loginStart());

    try {
      const { authAPI } = await import('../../services/api');
      const response: any = await authAPI.login({ email, password });

      const roleMap: Record<string, 'admin' | 'agency' | 'user'> = {
        'admin': 'admin',
        'agency': 'agency',
        'user': 'user',
      };

      const user: User = {
        id: String(response.user.id),
        email: response.user.email,
        name: response.user.username,
        role: roleMap[response.user.role] || 'user',
        agencyId: response.user.agencyId,
        permissions: ['read', 'write', 'delete'],
        isActive: true,
        isTrial: response.user?.isTrial ?? false,
        trialEndsAt: response.user?.trialEndsAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      dispatch(loginSuccess({ user, token: response.token }));

      if (user.agencyId) {
        const { agenciesAPI } = await import('../../services/api');
        const agencyRes = await agenciesAPI.getById(user.agencyId);
        if (agencyRes.data.success) {
          const { setAgency } = await import('../../store/slices/agencySlice');
          dispatch(setAgency(agencyRes.data.data.agency));
        }
      }
    } catch (err) {
      dispatch(loginFailure());
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => navigation.navigate('LandingHome');
  const handleSignup = () => navigation.navigate('AgencyRegistration');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#005437', '#003828']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Left panel — branding (desktop only) */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: !isMobile ? 40 : 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>

          {/* Login Card */}
          <View style={[styles.loginCard, { maxWidth: rs('100%', 460, 460) as any, padding: rs(24, 36, 40) }]}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoMark}>
                <Text style={styles.logoMarkText}>Z</Text>
              </View>
              <Text style={styles.logoText}>Zentax</Text>
            </View>

            <Text style={[styles.title, { fontSize: !isMobile ? 30 : 26 }]}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your Zentax dashboard</Text>

            {/* GST trust line */}
            <View style={styles.trustLine}>
              <Ionicons name="shield-checkmark" size={14} color="#068B5E" />
              <Text style={styles.trustText}>Secure · GSTN Integrated · Bank-level Encryption</Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#f43f5e" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldLabel}>
              <Text style={styles.label}>Email Address</Text>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color="#929598" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor="#CACCCF"
                value={email}
                onChangeText={(text) => { setEmail(text); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldLabel}>
              <Text style={styles.label}>Password</Text>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#929598" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#CACCCF"
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#929598"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New to Zentax?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Text style={styles.signupButtonText}>Start 10-Day Free Trial</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 Zentax. All rights reserved.</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  backButtonText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 36,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#005437',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#191919',
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#191919',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#929598',
    textAlign: 'center',
    marginBottom: 16,
  },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
    backgroundColor: 'rgba(6, 139, 94, 0.06)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(6, 139, 94, 0.14)',
  },
  trustText: {
    fontSize: 11,
    color: '#005437',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#f43f5e',
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#43474B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8EAEC',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#191919',
  },
  eyeIcon: {
    padding: 6,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 22,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#068B5E',
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#068B5E',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#005437',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8EAEC',
  },
  dividerText: {
    fontSize: 13,
    color: '#929598',
    marginHorizontal: 14,
  },
  signupButton: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#068B5E',
    borderRadius: 12,
    paddingVertical: 14,
  },
  signupButtonText: {
    fontSize: 15,
    color: '#068B5E',
    fontWeight: '700',
  },
  footer: {
    marginTop: 36,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
});
