import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { onboardingPalette } from '../../theme/onboarding';

interface ProgressDotsProps {
  count: number;
  active: number;
}

const DOT_SIZE = 7;
const ACTIVE_WIDTH = 28;

export function ProgressDots({ count, active }: ProgressDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === active} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? ACTIVE_WIDTH : DOT_SIZE);

  useEffect(() => {
    w.value = withTiming(active ? ACTIVE_WIDTH : DOT_SIZE, { duration: 320 });
  }, [active, w]);

  const style = useAnimatedStyle(() => ({ width: w.value }));

  return (
    <Animated.View style={[styles.dot, style]}>
      {active ? (
        <LinearGradient
          colors={[onboardingPalette.primary, onboardingPalette.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
});