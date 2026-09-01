import React, { type ReactNode } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

interface FadeUpProps {
  children: ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeUp({ children, index = 0, delay = 0, style }: FadeUpProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay + index * 70).duration(480)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function GlowChip({ children, color }: { children: ReactNode; color: string }) {
  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: color + '1A',
          borderWidth: 1,
          borderColor: color + '44',
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}