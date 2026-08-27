import React, { type ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { onboardingPalette, accent, authTokens, radius, space } from '../../theme/onboarding';
import { typography } from '../../theme/typography';
import { haptics } from '../../utils/helpers';

interface FormFieldProps extends TextInputProps {
  label: string;
  icon?: ReactNode;
  right?: ReactNode;
  error?: string;
}

export function FormField({
  label,
  icon,
  right,
  error,
  onFocus,
  onBlur,
  ...inputProps
}: FormFieldProps) {
  const focus = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [authTokens.inputBorder, authTokens.inputBorderHover]
    ),
    backgroundColor: interpolateColor(
      focus.value,
      [0, 1],
      [authTokens.inputBg, authTokens.inputFocusBg]
    ),
    shadowOpacity: interpolateColor(focus.value, [0, 1], [0, 0.4]),
    shadowRadius: interpolateColor(focus.value, [0, 1], [0, 16]),
  }));

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          styles.inputRow,
          { shadowColor: accent.emerald },
          animatedStyle,
        ]}
      >
        {icon}
        <TextInput
          placeholderTextColor={authTokens.placeholder}
          selectionColor={accent.emerald}
          style={styles.input}
          onFocus={(e) => {
            focus.value = withTiming(1, { duration: 220 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.value = withTiming(0, { duration: 220 });
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {right}
      </Animated.View>
      <View style={styles.errorRow}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

export function PasswordField(props: FormFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <FormField
      {...props}
      secureTextEntry={!show}
      right={
        <Pressable
          onPress={() => {
            haptics.light();
            setShow((s) => !s);
          }}
          hitSlop={10}
        >
          <MaterialIcons
            name={show ? 'visibility-off' : 'visibility'}
            size={20}
            color={onboardingPalette.muted}
          />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  block: { gap: space.s2 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13.5,
    color: authTokens.label,
  },
  inputRow: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.s4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 0,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: onboardingPalette.text,
    paddingVertical: 0,
  },
  errorRow: { minHeight: 16, marginTop: 2 },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#FF7B7B',
  },
});