import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { onboardingPalette, space } from '../theme/onboarding';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthHeader } from '../components/auth/AuthHeader';
import { FormField, PasswordField } from '../components/auth/FormField';
import { ForgotPasswordLink } from '../components/auth/ForgotPasswordLink';
import { AuthButton } from '../components/auth/AuthButton';
import { AuthDivider } from '../components/auth/AuthDivider';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { AuthRedirect } from '../components/auth/AuthRedirect';
import { haptics } from '../utils/helpers';

export function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Enter your email';
    if (!password.trim()) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptics.warning();
      return;
    }
    haptics.light();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      haptics.success();
      navigation.navigate('Main');
    }, 900);
  };

  return (
    <AuthLayout>
      <Animated.View entering={FadeInDown.duration(450)}>
        <AuthHeader
          title="Welcome back"
          subtitle="Continue your learning journey with LectureIQ."
        />

        <View style={styles.form}>
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

          <View>
            <PasswordField
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              textContentType="password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              error={errors.password}
              icon={<MaterialIcons name="lock-outline" size={19} color={onboardingPalette.muted} />}
            />
            <View style={styles.forgotRow}>
              <ForgotPasswordLink onPress={() => haptics.light()} />
            </View>
          </View>

          <AuthButton
            label="Log In"
            icon={<MaterialIcons name="arrow-forward" size={18} color={onboardingPalette.accentDeep} />}
            loading={loading}
            loadingLabel="Logging in…"
            onPress={submit}
          />

          <AuthDivider />

          <GoogleAuthButton
            onPress={() => {
              haptics.medium();
              navigation.navigate('Main');
            }}
          />
        </View>

        <View style={styles.redirectRow}>
          <AuthRedirect
            prompt="Don't have an account?"
            link="Sign up"
            onPress={() => {
              haptics.light();
              navigation.navigate('Signup');
            }}
          />
        </View>
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: space.s6, gap: space.s5 },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginBottom: space.s2,
  },
  redirectRow: {
    marginTop: space.s6,
    alignItems: 'center',
  },
});