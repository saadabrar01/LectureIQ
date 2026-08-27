import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { haptics } from '../../utils/helpers';
import { typography } from '../../theme/typography';

interface SocialAuthRowProps {
  label?: string;
  onSelect?: (provider: string) => void;
}

export function SocialAuthRow({ label = 'Or Login With:', onSelect }: SocialAuthRowProps) {
  const handlePress = (provider: string) => {
    haptics.medium();
    onSelect?.(provider);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dividerLabel}>{label}</Text>

      <View style={styles.socialButtonsRow}>
        {/* Apple */}
        <Pressable
          onPress={() => handlePress('apple')}
          style={({ pressed }) => [
            styles.socialBtn,
            pressed && { transform: [{ scale: 0.94 }], backgroundColor: 'rgba(255,255,255,0.1)' },
          ]}
          hitSlop={6}
        >
          <FontAwesome5 name="apple" size={20} color="#F5F7F6" />
        </Pressable>

        {/* Twitter / X */}
        <Pressable
          onPress={() => handlePress('twitter')}
          style={({ pressed }) => [
            styles.socialBtn,
            pressed && { transform: [{ scale: 0.94 }], backgroundColor: 'rgba(255,255,255,0.1)' },
          ]}
          hitSlop={6}
        >
          <Ionicons name="logo-twitter" size={19} color="#38BDF8" />
        </Pressable>

        {/* Facebook */}
        <Pressable
          onPress={() => handlePress('facebook')}
          style={({ pressed }) => [
            styles.socialBtn,
            pressed && { transform: [{ scale: 0.94 }], backgroundColor: 'rgba(255,255,255,0.1)' },
          ]}
          hitSlop={6}
        >
          <FontAwesome5 name="facebook-f" size={17} color="#60A5FA" />
        </Pressable>

        {/* Google */}
        <Pressable
          onPress={() => handlePress('google')}
          style={({ pressed }) => [
            styles.socialBtn,
            pressed && { transform: [{ scale: 0.94 }], backgroundColor: 'rgba(255,255,255,0.1)' },
          ]}
          hitSlop={6}
        >
          <Ionicons name="logo-google" size={18} color="#F87171" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
    gap: 14,
  },
  dividerLabel: {
    ...typography.caption,
    fontSize: 12,
    color: '#8D9B92',
    fontWeight: '500',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
});
