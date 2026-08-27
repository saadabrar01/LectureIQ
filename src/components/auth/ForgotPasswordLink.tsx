import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { accent } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

interface ForgotPasswordLinkProps {
  onPress: () => void;
}

export function ForgotPasswordLink({ onPress }: ForgotPasswordLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered ?? false;
        return [
          styles.link,
          state.pressed && { opacity: 0.65 },
          hovered && { borderBottomColor: accent.emerald },
        ];
      }}
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
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  text: {
    ...typography.bodySmall,
    fontFamily: 'Inter_500Medium',
    color: accent.emerald,
  },
});
