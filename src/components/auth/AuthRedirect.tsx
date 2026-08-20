import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { onboardingPalette } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

interface AuthRedirectProps {
  prompt: string;
  link: string;
  onPress: () => void;
}

export function AuthRedirect({ prompt, link, onPress }: AuthRedirectProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      hitSlop={8}
    >
      <Text style={styles.prompt}>{prompt} </Text>
      <Text style={styles.link}>{link}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  prompt: {
    ...typography.body,
    color: onboardingPalette.muted,
  },
  link: {
    ...typography.bodySemi,
    color: onboardingPalette.primary,
  },
});