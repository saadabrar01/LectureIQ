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
import { onboardingPalette, accent, authTokens } from '../../theme/onboarding';
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
      {/* Soft ambient glows behind the card (subtle emerald + lavender) */}
      <View style={styles.ambient}>
        <LinearGradient
          colors={['rgba(52,211,153,0.14)', 'rgba(52,211,153,0)']}
          style={[styles.ambientGlow, styles.ambientMint]}
        />
        <LinearGradient
          colors={['rgba(159,143,240,0.1)', 'rgba(159,143,240,0)']}
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
            <View style={styles.cardGlow} />
            <View style={styles.card}>
              {/* Brand header: small gradient logo tile + wordmark */}
              <View style={styles.brandRow}>
                <View style={styles.logoHalo} />
                <LinearGradient
                  colors={[accent.emerald, accent.tealDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoTile}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={accent.onGradient} />
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
  // Soft emerald glow floating behind the card so it reads as elevated
  cardGlow: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: accent.glow,
    opacity: 0.6,
    shadowColor: accent.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
  },
  // The glass card: max-w-xl (560px) so forms never stretch across the screen
  card: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: authTokens.cardBorder,
    backgroundColor: 'rgba(14,23,18,0.72)',
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 44,
    elevation: 14,
    overflow: 'hidden',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    marginBottom: 26,
  },
  logoHalo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: accent.glow,
    shadowColor: accent.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  logoTile: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: accent.tealDeep,
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