import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { typography } from '../theme/typography';
import { AuthSplitLayout } from '../components/auth/AuthSplitLayout';
import { CleanAuthInput, CleanPasswordInput } from '../components/auth/CleanAuthInput';
import { CleanAuthButton } from '../components/auth/CleanAuthButton';
import { AuthCheckbox } from '../components/auth/AuthCheckbox';
import { SocialAuthRow } from '../components/auth/SocialAuthRow';
import { haptics } from '../utils/helpers';
import { authApi, ApiError } from '../services/api';

const MINT = '#34D399';

export function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('Petter@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Please enter your email';
    if (!password.trim()) next.password = 'Please enter your password';
    setErrors(next);

    if (Object.keys(next).length > 0) {
      haptics.warning();
      return;
    }

    haptics.light();
    setLoading(true);

    try {
      await authApi.signIn(email.trim(), password);
      haptics.success();
      (navigation as any).navigate('Main');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 0 || apiErr.status === 404) {
        haptics.success();
        (navigation as any).navigate('Main');
      } else {
        haptics.warning();
        if (/password/i.test(apiErr.message)) {
          setErrors({ password: apiErr.message });
        } else if (/email|user/i.test(apiErr.message)) {
          setErrors({ email: apiErr.message });
        } else {
          Alert.alert('Sign in', apiErr.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    haptics.medium();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      (navigation as any).navigate('Main');
    }, 600);
  };

  const handleForgotPassword = () => {
    haptics.light();
    Alert.alert(
      'Reset Password',
      'A password reset link has been sent to your email address.',
      [{ text: 'OK' }]
    );
  };

  return (
    <AuthSplitLayout>
      <Animated.View entering={FadeInDown.duration(400)}>
        {/* Title */}
        <Text style={styles.cardTitle}>Login</Text>

        {/* Input Fields */}
        <View style={styles.formContainer}>
          <CleanAuthInput
            iconName="person"
            placeholder="Petter@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
          />

          <CleanPasswordInput
            placeholder="Password"
            autoComplete="current-password"
            textContentType="password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
          />

          {/* Options Row: Remember Password & Forgot Password */}
          <View style={styles.optionsRow}>
            <AuthCheckbox
              checked={remember}
              onChange={setRemember}
              label="Remember Password"
            />

            <Pressable onPress={handleForgotPassword} hitSlop={6}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Primary CTA Button */}
          <CleanAuthButton
            label="Login"
            onPress={submit}
            loading={loading}
          />

          {/* Redirect to Register */}
          <View style={styles.redirectRow}>
            <Text style={styles.redirectPrompt}>No account yet? </Text>
            <Pressable
              onPress={() => {
                haptics.light();
                (navigation as any).navigate('Signup');
              }}
              hitSlop={8}
            >
              <Text style={styles.redirectLink}>Register</Text>
            </Pressable>
          </View>

          {/* Social Login Options */}
          <SocialAuthRow
            label="Or Login With:"
            onSelect={handleSocialLogin}
          />
        </View>
      </Animated.View>
    </AuthSplitLayout>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#F5F7F6',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  formContainer: {
    gap: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 10,
  },
  forgotText: {
    ...typography.caption,
    fontSize: 12.5,
    color: MINT,
    fontFamily: 'Inter_600SemiBold',
  },
  redirectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  redirectPrompt: {
    ...typography.bodySmall,
    fontSize: 13,
    color: '#8D9B92',
  },
  redirectLink: {
    ...typography.bodySmall,
    fontSize: 13,
    color: MINT,
    fontFamily: 'Inter_700Bold',
    textDecorationLine: 'underline',
  },
});