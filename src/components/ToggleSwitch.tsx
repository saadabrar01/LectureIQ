import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../context/ThemeContext';
import { haptics } from '../utils/helpers';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleSwitch({ value, onValueChange, disabled }: ToggleSwitchProps) {
  const { theme } = useAppTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 18, stiffness: 220 });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor:
      progress.value > 0.5
        ? theme.primary
        : disabled
          ? theme.border
          : theme.surfaceAlt,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * 22 },
      { scale: progress.value === 0 ? 1 : 0.92 },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      disabled={disabled}
      onPress={() => {
        haptics.light();
        onValueChange(!value);
      }}
      style={styles.wrap}
    >
      <Animated.View
        style={[styles.track, { borderColor: theme.border }, trackStyle]}
      >
        <Animated.View
          style={[
            styles.knob,
            { backgroundColor: theme.white, shadowColor: theme.shadowColor },
            knobStyle,
          ]}
        />
      </Animated.View>
      {disabled ? <Text style={styles.hidden} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 2 },
  track: {
    width: 50,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  hidden: { display: 'none' },
});
