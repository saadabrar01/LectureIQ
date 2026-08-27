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

export function SignupScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) next.name = 'Please enter your full name';
    if (!email.trim()) next.email = 'Please enter your email';
    if (!password.trim()) next.password = 'Create a secure password';
    setErrors(next);

    if (Object.keys(next).length > 0 || !accepted) {
      haptics.warning();
      return;
    }

    haptics.light();
    setLoading(true);

    try {
      await authApi.signUp(name.trim(), email.trim(), password);
      haptics.success();
      (navigation as any).navigate('Main');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 0 || apiErr.status === 404) {
        haptics.success();
        (navigation as any).navigate('Main');
      } else {
        haptics.warning();
        if (apiErr.status === 409 || /email/i.test(apiErr.message)) {
          setErrors({ email: apiErr.message });
        } else if (/password/i.test(apiErr.message)) {
          setErrors({ password: apiErr.message });
        } else {
          Alert.alert('Registration Failed', apiErr.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    haptics.medium();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      (navigation as any).navigate('Main');
    }, 600);
  };

  return (
    <AuthSplitLayout>
      <Animated.View entering={FadeInDown.duration(400)}>
        {/* Title */}
        <Text style={styles.cardTitle}>Register</Text>

        {/* Input Fields */}
        <View style={styles.formContainer}>
          <CleanAuthInput
            iconName="person-outline"
            placeholder="Full name"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            error={errors.name}
          />

          <CleanAuthInput
            iconName="mail-outline"
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
            placeholder="Create password"
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
          />

          {/* Terms and Privacy Policy */}
          <View style={styles.termsRow}>
            <AuthCheckbox
              checked={accepted}
              onChange={setAccepted}
            >
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </AuthCheckbox>
          </View>

          {/* Primary CTA Button */}
          <CleanAuthButton
            label="Register"
            onPress={submit}
            loading={loading}
          />

          {/* Redirect to Login */}
          <View style={styles.redirectRow}>
            <Text style={styles.redirectPrompt}>Already have an account? </Text>
            <Pressable
              onPress={() => {
                haptics.light();
                (navigation as any).navigate('Login');
              }}
              hitSlop={8}
            >
              <Text style={styles.redirectLink}>Login</Text>
            </Pressable>
          </View>

          {/* Social Signup Options */}
          <SocialAuthRow
            label="Or Sign Up With:"
            onSelect={handleSocialSignup}
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
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  formContainer: {
    gap: 4,
  },
  termsRow: {
    marginTop: 2,
    marginBottom: 10,
  },
  termsText: {
    ...typography.caption,
    fontSize: 12,
    color: '#8D9B92',
  },
  termsLink: {
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