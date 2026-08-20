import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { onboardingPalette, radius } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

interface AuthButtonProps {
  label: string;
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  onPress: () => void;
}

export function AuthButton({
  label,
  icon,
  loading = false,
  loadingLabel = 'Please wait…',
  disabled = false,
  onPress,
}: AuthButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.wrap,
        pressed && !inactive && { transform: [{ scale: 0.975 }] },
        inactive && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={[onboardingPalette.primary, onboardingPalette.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color={onboardingPalette.accentDeep} />
            <Text style={styles.label}>{loadingLabel}</Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>{label}</Text>
            {icon}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 52,
    borderRadius: radius.md,
    shadowColor: onboardingPalette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    ...typography.button,
    color: onboardingPalette.accentDeep,
  },
  disabled: { opacity: 0.45 },
});