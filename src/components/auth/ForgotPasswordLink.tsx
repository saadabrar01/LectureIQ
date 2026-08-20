import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { onboardingPalette } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

interface ForgotPasswordLinkProps {
  onPress: () => void;
}

export function ForgotPasswordLink({ onPress }: ForgotPasswordLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.link, pressed && { opacity: 0.65 }]}
    >
      <Text style={styles.text}>Forgot password?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  text: {
    ...typography.bodySmall,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(142,240,163,0.85)',
  },
});