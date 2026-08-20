import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { haptics } from '../utils/helpers';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surfaceAlt,
          borderColor: selected ? theme.primaryDark : theme.border,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          { color: selected ? theme.primaryDeep : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { ...typography.bodySmall },
});