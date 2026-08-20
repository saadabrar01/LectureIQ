import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';

function Dot({ delay, color }: { delay: number; color: string }) {
  const pulse = useSharedValue(0.3);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 600 }), -1, true)
    );
    return () => {
      pulse.value = 0.3;
    };
  }, [delay, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ translateY: interpolate(pulse.value, [0, 1], [0, -4]) }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

interface TypingDotsProps {
  dotColor?: string;
}

export function TypingDots({ dotColor }: TypingDotsProps) {
  const { theme } = useAppTheme();
  const color = dotColor ?? theme.textSecondary;

  return (
    <View style={styles.wrap}>
      <Dot delay={0} color={color} />
      <Dot delay={120} color={color} />
      <Dot delay={240} color={color} />
    </View>
  );
}

export function ThinkingBubble() {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.bubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TypingDots dotColor={theme.primaryDark} />
      <Text style={[styles.thinking, { color: theme.textSecondary }]}>Thinking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 5, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thinking: { ...typography.caption },
});