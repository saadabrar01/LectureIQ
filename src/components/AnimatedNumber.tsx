import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { useCountUp } from '../hooks/useCountUp';

interface AnimatedNumberProps {
  value: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

export function AnimatedNumber({ value, style, duration }: AnimatedNumberProps) {
  const display = useCountUp(value, duration ? { duration } : undefined);
  return <Text style={[styles.text, style]}>{display}</Text>;
}

const styles = StyleSheet.create({
  text: {},
});
