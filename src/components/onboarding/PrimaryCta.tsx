import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onboardingPalette } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

interface PrimaryCtaProps {
  label: string;
  icon?: 'arrow' | 'sparkle';
  onPress: () => void;
}

export function PrimaryCta({ label, icon = 'arrow', onPress }: PrimaryCtaProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        pressed && { transform: [{ scale: 0.96 }], opacity: 0.94 },
      ]}
    >
      <LinearGradient
        colors={[onboardingPalette.primary, onboardingPalette.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {icon === 'arrow' ? (
          <Text style={styles.label}>
            <MaterialIcons name="arrow-forward" size={18} color={onboardingPalette.accentDeep} />{' '}
            {label}
          </Text>
        ) : (
          <Text style={styles.label}>
            <MaterialIcons name="auto-awesome" size={16} color={onboardingPalette.accentDeep} />{' '}
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 19,
    shadowColor: onboardingPalette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 12,
  },
  gradient: {
    minWidth: 180,
    paddingHorizontal: 26,
    height: 56,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    ...typography.button,
    color: onboardingPalette.accentDeep,
    textAlign: 'center',
  },
});