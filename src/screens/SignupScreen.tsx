import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { onboardingPalette, space, radius } from '../theme/onboarding';
import { typography } from '../theme/typography';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthHeader } from '../components/auth/AuthHeader';
import { FormField, PasswordField } from '../components/auth/FormField';
import { AuthButton } from '../components/auth/AuthButton';
import { AuthDivider } from '../components/auth/AuthDivider';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { AuthRedirect } from '../components/auth/AuthRedirect';
import { haptics } from '../utils/helpers';
import { authApi, ApiError } from '../services/api';

export function SignupScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim() && email.trim() && password.trim() && accepted;

  const submit = async () => {
    const next: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) next.name = 'Enter your full name';
    if (!email.trim()) next.email = 'Enter your email';
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
      navigation.navigate('Main' as never);
    } catch (err) {
      const apiErr = err as ApiError;
      haptics.warning();
      if (apiErr.status === 409 || /email/i.test(apiErr.message)) {
        setErrors({ email: apiErr.message });
      } else if (/password/i.test(apiErr.message)) {
        setErrors({ password: apiErr.message });
      } else {
        Alert.alert('Sign up failed', apiErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Animated.View entering={FadeInDown.duration(450)}>
        <AuthHeader
          title="Create your account"
          subtitle="Start learning smarter with AI in just a few seconds."
        />

        <View style={styles.form}>
          <FormField
            label="Full name"
            placeholder="Enter your full name"
            autoComplete="name"
            textContentType="name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            error={errors.name}
            icon={<MaterialIcons name="person-outline" size={19} color={onboardingPalette.muted} />}
          />
          <FormField
            label="Email"
            placeholder="Enter your email"
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
            icon={<MaterialIcons name="mail-outline" size={19} color={onboardingPalette.muted} />}
          />
          <PasswordField
            label="Password"
            placeholder="Create a secure password"
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            icon={<MaterialIcons name="lock-outline" size={19} color={onboardingPalette.muted} />}
          />

          <Pressable
            onPress={() => {
              haptics.light();
              setAccepted(!accepted);
            }}
            style={({ pressed }) => [styles.termsRow, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.checkbox, { borderColor: onboardingPalette.border }]}>
              {accepted ? (
                <LinearGradient
                  colors={[onboardingPalette.primary, onboardingPalette.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.checkboxInner}
                >
                  <MaterialIcons name="check" size={13} color={onboardingPalette.accentDeep} />
                </LinearGradient>
              ) : null}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Pressable>

          <AuthButton
            label="Create Account"
            icon={<MaterialIcons name="auto-awesome" size={16} color={onboardingPalette.accentDeep} />}
            loading={loading}
            loadingLabel="Creating account…"
            disabled={!canSubmit && !loading}
            onPress={submit}
          />

          <AuthDivider label="or continue with" />

          <GoogleAuthButton
            onPress={() => {
              haptics.medium();
              navigation.navigate('Main');
            }}
          />
        </View>

        <View style={styles.redirectRow}>
          <AuthRedirect
            prompt="Already have an account?"
            link="Log in"
            onPress={() => {
              haptics.light();
              navigation.goBack();
            }}
          />
        </View>
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: space.s6, gap: space.s5 },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkboxInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    ...typography.bodySmall,
    color: onboardingPalette.muted,
    flex: 1,
    lineHeight: 21,
  },
  termsLink: {
    fontFamily: 'Inter_600SemiBold',
    color: onboardingPalette.primary,
  },
  redirectRow: {
    marginTop: space.s6,
    alignItems: 'center',
  },
});