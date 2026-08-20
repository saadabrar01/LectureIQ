// Ambient screen background shared by all dashboard tab screens.
// Mirrors the onboarding/auth visual language:
// charcoal base + soft mint, teal and lavender radial glows.
import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';

interface GlowBackgroundProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GlowBackground({ children, style }: GlowBackgroundProps) {
  const { theme } = useAppTheme();
  const isDark = theme.mode === 'dark';

  if (!isDark) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }, style]}>
        <View style={styles.ambient}>
          <LinearGradient
            colors={[theme.glowMint, 'rgba(142,240,163,0)']}
            style={[styles.glow, styles.glowMint]}
          />
          <LinearGradient
            colors={[theme.glowLavender, 'rgba(159,143,240,0)']}
            style={[styles.glow, styles.glowLavender]}
          />
        </View>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }, style]}>
      <View style={styles.ambient}>
        <LinearGradient
          colors={['rgba(142,240,163,0.13)', 'rgba(142,240,163,0)']}
          style={[styles.glow, styles.glowMint]}
        />
        <LinearGradient
          colors={['rgba(34,197,94,0.1)', 'rgba(34,197,94,0)']}
          style={[styles.glow, styles.glowTeal]}
        />
        <LinearGradient
          colors={['rgba(159,143,240,0.09)', 'rgba(159,143,240,0)']}
          style={[styles.glow, styles.glowLavender]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  ambient: { ...StyleSheet.absoluteFill },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowMint: {
    top: -160,
    left: -130,
    width: 440,
    height: 400,
  },
  glowTeal: {
    top: '32%',
    right: -150,
    width: 380,
    height: 360,
  },
  glowLavender: {
    bottom: -190,
    left: '28%',
    width: 460,
    height: 420,
  },
});