import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../../theme/typography';
import { haptics } from '../../utils/helpers';

const MINT_GRAD = ['#34D399', '#0EA5A0'] as const;

interface CleanAuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function CleanAuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: CleanAuthButtonProps) {
  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered ?? false;
        return [
          styles.wrap,
          (disabled || loading) && styles.disabled,
          state.pressed && { transform: [{ scale: 0.98 }] },
          hovered && !disabled && !loading && {
            transform: [{ translateY: -2 }],
            shadowOpacity: 0.45,
            shadowRadius: 18,
          },
        ];
      }}
    >
      <LinearGradient
        colors={[...MINT_GRAD]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#06281A" />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 50,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#06281A',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
