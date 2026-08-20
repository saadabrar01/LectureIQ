import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onboardingPalette, authTokens, radius } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

interface GoogleAuthButtonProps {
  onPress: () => void;
}

export function GoogleAuthButton({ onPress }: GoogleAuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: authTokens.inputBg,
          borderColor: authTokens.inputBorder,
        },
        pressed && {
          borderColor: authTokens.inputBorderHover,
          backgroundColor: authTokens.inputFocusBg,
          transform: [{ scale: 0.985 }],
        },
      ]}
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
  },
  label: {
    ...typography.bodySemi,
    color: onboardingPalette.text,
    opacity: 0.92,
  },
});