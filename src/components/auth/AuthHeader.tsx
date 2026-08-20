import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { onboardingPalette } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: onboardingPalette.text,
  },
  subtitle: {
    ...typography.body,
    color: onboardingPalette.muted,
    maxWidth: 340,
    lineHeight: 24,
  },
});