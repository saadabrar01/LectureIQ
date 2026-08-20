import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { onboardingPalette, authTokens } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

export function AuthDivider({ label = 'or continue with' }: { label?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  line: { flex: 1, height: 1, backgroundColor: authTokens.divider },
  label: {
    ...typography.caption,
    color: onboardingPalette.muted,
  },
});