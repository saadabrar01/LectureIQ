import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { onboardingPalette, accent } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

export function AuthDivider({ label = 'or continue with' }: { label?: string }) {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={['rgba(52,211,153,0)', accent.emerald]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
      <Text style={styles.label}>{label}</Text>
      <LinearGradient
        colors={[accent.emerald, 'rgba(52,211,153,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  line: { flex: 1, height: 1 },
  label: {
    ...typography.caption,
    color: onboardingPalette.muted,
  },
});
