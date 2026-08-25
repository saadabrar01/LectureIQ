import React, { type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface GradientBackgroundProps {
  children: ReactNode;
  colors?: readonly [string, string];
  animated?: boolean;
  pointer?: 'auto' | 'none';
}

export function GradientBackground({
  children,
  colors,
  animated = false,
  pointer = 'auto',
}: GradientBackgroundProps) {
  const shift = useSharedValue(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!animated || mounted.current) return;
    mounted.current = true;
    shift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000 }),
        withTiming(0, { duration: 4000 })
      ),
      -1,
      true
    );
  }, [animated, shift]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value * -60 }, { translateY: shift.value * -25 }],
    scale: 1.15,
  }));

  const finalColors = colors ?? ['#8EF0A3', '#2FA866'];

  return (
    <View style={[styles.container, { pointerEvents: pointer }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animated && animStyle]}>
        <LinearGradient
          colors={[...finalColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.overlay} />
      <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.content}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(253,255,253,0.55)',
  },
  content: { flex: 1 },
});