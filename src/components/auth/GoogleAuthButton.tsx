import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onboardingPalette, accent, authTokens, radius } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

interface GoogleAuthButtonProps {
  onPress: () => void;
}

export function GoogleAuthButton({ onPress }: GoogleAuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered ?? false;
        return [
          styles.row,
          {
            backgroundColor: authTokens.inputBg,
            borderColor: authTokens.inputBorder,
          },
          state.pressed && {
            borderColor: accent.ring,
            backgroundColor: authTokens.inputFocusBg,
            transform: [{ scale: 0.985 }],
          },
          hovered && {
            borderColor: accent.ring,
            backgroundColor: 'rgba(52,211,153,0.08)',
            shadowColor: accent.emerald,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 14,
            elevation: 6,
          },
        ];
      }}
    >
      <MaterialCommunityIcons name="google" size={20} color={onboardingPalette.text} />
      <Text style={styles.label}>Continue with Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  label: {
    ...typography.bodySemi,
    color: onboardingPalette.text,
    opacity: 0.92,
  },
});