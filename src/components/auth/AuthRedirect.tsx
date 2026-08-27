import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { onboardingPalette, accent } from '../../theme/onboarding';
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
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered ?? false;
        return [
          styles.row,
          state.pressed && { opacity: 0.7 },
          hovered && { borderBottomColor: accent.emerald },
        ];
      }}
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
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  prompt: {
    ...typography.body,
    color: onboardingPalette.muted,
  },
  link: {
    ...typography.bodySemi,
    color: accent.emerald,
  },
});