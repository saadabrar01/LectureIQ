import React, { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import { haptics } from '../utils/helpers';

interface AnimatedMicButtonProps {
  active?: boolean;
  onPress: () => void;
  size?: number;
  children?: ReactNode;
}

export function AnimatedMicButton({
  active = false,
  onPress,
  size = 64,
  children,
}: AnimatedMicButtonProps) {
  const { theme } = useAppTheme();
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      ring1.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
      ring2.value = withRepeat(
        withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 1200 })),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(withTiming(0.92, { duration: 400 }), withTiming(1.08, { duration: 400 })),
        -1,
        true
      );
    } else {
      ring1.value = 0;
      ring2.value = 0;
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [active, ring1, ring2, scale]);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: 1 - ring1.value,
    transform: [{ scale: 1 + ring1.value * 1.6 }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: 1 - ring2.value,
    transform: [{ scale: 1 + ring2.value * 1.2 }],
  }));

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const baseRing = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: size / 2,
    borderWidth: 2.5,
  };

  return (
    <Pressable
      onPress={() => {
        haptics.medium();
        onPress();
      }}
      style={[styles.wrap, { width: size, height: size }]}
    >
      <Animated.View
        style={[baseRing, { borderColor: theme.mic }, ring2Style]}
      />
      <Animated.View style={[baseRing, { borderColor: theme.primary }, ring1Style]} />
      <Animated.View style={micStyle}>
        <LinearGradient
          colors={active ? [theme.mic, '#FF9CC6'] : [theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  btn: { alignItems: 'center', justifyContent: 'center' },
});