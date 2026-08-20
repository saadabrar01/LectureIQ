import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { haptics } from '../utils/helpers';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gradient' | 'outline' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg' | 'sm';
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  size = 'lg',
}: AppButtonProps) {
  const { theme } = useAppTheme();

  const padding = size === 'lg' ? 16 : size === 'md' ? 13 : 9;
  const fontSize = size === 'lg' ? typography.button : typography.buttonSmall;

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  const baseStyle: StyleProp<ViewStyle> = [
    styles.base,
    { paddingVertical: padding, borderRadius: size === 'lg' ? 18 : 14 },
    style,
  ];

  if (variant === 'gradient') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          baseStyle,
          pressed && { transform: [{ scale: 0.97 }] },
          (disabled || loading) && styles.disabled,
        ]}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {loading ? (
            <ActivityIndicator color={theme.primaryDeep} />
          ) : (
            <>
              {icon}
              <Text style={[fontSize, { color: theme.primaryDeep }, styles.label]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const background =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.error
        : 'transparent';

  const color =
    variant === 'primary'
      ? theme.primaryDeep
      : variant === 'danger'
        ? theme.white
        : variant === 'outline'
          ? theme.primaryDark
          : theme.textSecondary;

  const border =
    variant === 'outline' ? { borderWidth: 1.5, borderColor: theme.primaryDark } : {};

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        baseStyle,
        { backgroundColor: background },
        border,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon}
          <Text style={[fontSize, { color }, styles.label]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { textAlign: 'center' },
  gradientFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: { opacity: 0.5 },
});
