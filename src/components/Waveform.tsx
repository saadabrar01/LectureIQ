import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const BARS = 34;

function WaveBar({ index, active, color }: { index: number; active: boolean; color: string }) {
  const h = useSharedValue(6 + ((index * 7) % 18));

  useEffect(() => {
    if (!active) return;
    const base = 6 + ((index * 7) % 18);
    h.value = withRepeat(
      withSequence(
        withTiming(base + 18 + ((index * 5) % 20), { duration: 320 + (index % 4) * 90 }),
        withTiming(base, { duration: 320 + (index % 3) * 90 })
      ),
      -1,
      true
    );
    return () => {
      h.value = base;
    };
  }, [active, index, h]);

  const style = useAnimatedStyle(() => ({
    height: h.value,
  }));

  return (
    <Animated.View style={[styles.bar, { opacity: active ? 1 : 0.25 }, style]}>
      <LinearGradient
        colors={[color, color === '#FF7EB3' ? '#FF7EB3' : '#2FA866']}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

interface WaveformProps {
  active?: boolean;
  color?: string;
}

export function Waveform({ active = false, color = '#FF7EB3' }: WaveformProps) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: BARS }).map((_, i) => (
        <WaveBar key={i} index={i} active={active} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 64,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
  },
});