import React, { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../context/ThemeContext';

interface GlassCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  blur?: number;
  tint?: 'light' | 'dark' | 'default';
  highlighted?: boolean;
  accentColor?: string;
}

export function GlassCard({
  children,
  onPress,
  style,
  blur = 22,
  tint = 'dark',
  highlighted = false,
  accentColor,
}: GlassCardProps) {
  const { theme } = useAppTheme();
  const isDark = theme.mode === 'dark';

  const cardStyle: ViewStyle = {
    // dark mode: neutral-900/60 glass fill + hairline neutral border
    borderColor: highlighted
      ? theme.primary
      : isDark
        ? 'rgba(255,255,255,0.08)'
        : theme.glassBorder,
    shadowColor: theme.shadowColor,
    backgroundColor: isDark ? 'rgba(23,23,23,0.6)' : 'rgba(255,255,255,0.85)',
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={(state) => {
          // `hovered` is web-only; RN's types don't expose it yet
          const hovered = (state as { hovered?: boolean }).hovered ?? false;
          return [
            styles.card,
            cardStyle,
            accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
            style,
            state.pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            hovered && {
              // hover lifts the card and reveals the mint brand accent
              transform: [{ translateY: -2 }],
              backgroundColor: isDark ? 'rgba(30,35,32,0.65)' : 'rgba(255,255,255,0.95)',
              borderColor: 'rgba(34,197,94,0.45)',
            },
          ];
        }}
      >
        <BlurView intensity={blur} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.content}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, cardStyle, accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null, style]}>
      <BlurView intensity={blur} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  content: { padding: 16 },
});