import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';

interface AppInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  ref?: React.Ref<TextInput>;
  glass?: boolean;
}

export function AppInput({
  label,
  icon,
  rightElement,
  containerStyle,
  ref,
  glass = false,
  onFocus,
  onBlur,
  ...props
}: AppInputProps) {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const ring = useSharedValue(0);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value,
    transform: [{ scale: 1 + ring.value * 0.02 }],
  }));

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      ) : null}
      <Animated.View
        style={[
          styles.ring,
          { borderColor: glass ? theme.glassBorder : theme.primary, shadowColor: theme.primary },
          ringStyle,
        ]}
      >
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: glass ? theme.glassBg : theme.surfaceAlt,
              borderColor: focused ? theme.primary : theme.glassBorder,
            },
          ]}
        >
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={theme.textSecondary}
            selectionColor={theme.primaryDark}
            style={[
              styles.input,
              { color: theme.textPrimary },
              icon ? { paddingLeft: 0 } : null,
            ]}
            onFocus={(e) => {
              setFocused(true);
              ring.value = withTiming(1, { duration: 200 });
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              ring.value = withTiming(0, { duration: 200 });
              onBlur?.(e);
            }}
            {...props}
          />
          {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.caption,
    marginBottom: 8,
    marginLeft: 4,
  },
  ring: {
    borderRadius: 18,
    borderWidth: 0,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: 14,
    paddingLeft: 0,
  },
  right: { marginLeft: 8 },
});
