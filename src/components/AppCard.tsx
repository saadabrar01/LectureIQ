import React, { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  highlighted?: boolean;
}

export function AppCard({ children, onPress, style, highlighted = false }: AppCardProps) {
  const { theme } = useAppTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.surface,
      borderColor: highlighted ? theme.primary : theme.border,
      shadowColor: theme.shadowColor,
      elevation: 2,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && { transform: [{ scale: 0.985 }], elevation: 6, opacity: 0.95 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
});
