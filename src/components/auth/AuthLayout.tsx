import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onboardingPalette } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

/**
 * AuthLayout — shared shell for Login / Signup.
 * All content lives inside a single centered glass card
 * (max width ≈ 560px, i.e. tailwind max-w-xl) so the form
 * feels focused and balanced instead of stretching edge-to-edge.
 *
 * Card structure:
 *   brand header (logo + name) → children (heading, fields, CTA, redirect)
 */
interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[onboardingPalette.bgDeep, onboardingPalette.bgSoft, onboardingPalette.bgDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      {/* Soft ambient glows behind the card (subtle green + lavender) */}
      <View style={styles.ambient}>
        <LinearGradient
          colors={['rgba(34,197,94,0.12)', 'rgba(34,197,94,0)']}
          style={[styles.ambientGlow, styles.ambientMint]}
        />
        <LinearGradient
          colors={['rgba(159,143,240,0.08)', 'rgba(159,143,240,0)']}
          style={[styles.ambientGlow, styles.ambientLavender]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Centered card — the single focal container for auth content */}
          <View style={styles.cardWrap}>
            <View style={styles.card}>
              {/* Brand header: small gradient logo tile + wordmark */}
              <View style={styles.brandRow}>
                <LinearGradient
                  colors={[onboardingPalette.primary, onboardingPalette.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoTile}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={onboardingPalette.accentDeep} />
                </LinearGradient>
                <Text style={styles.logoName}>LectureIQ</Text>
              </View>

              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  ambient: { ...StyleSheet.absoluteFill },
  ambientGlow: { position: 'absolute', borderRadius: 999 },
  ambientMint: { top: -160, left: -120, width: 420, height: 380 },
  ambientLavender: { bottom: -180, right: -140, width: 440, height: 400 },
  scroll: { flexGrow: 1 },
  // Wrapper that centers the card horizontally (vertical centering via justifyContent)
  cardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  // The glass card: max-w-xl (560px) so forms never stretch across the screen
  card: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: onboardingPalette.borderStrong,
    backgroundColor: onboardingPalette.cardStrong,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    marginBottom: 26,
  },
  logoTile: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: onboardingPalette.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoName: {
    ...typography.h3,
    color: onboardingPalette.text,
    letterSpacing: 0.3,
  },
});