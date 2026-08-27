import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { haptics } from '../../utils/helpers';
import { typography } from '../../theme/typography';

const MINT = '#34D399';

interface AuthCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  children?: React.ReactNode;
}

export function AuthCheckbox({ checked, onChange, label, children }: AuthCheckboxProps) {
  const toggle = () => {
    haptics.light();
    onChange(!checked);
  };

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
      hitSlop={6}
    >
      <View
        style={[
          styles.box,
          checked && styles.boxChecked,
        ]}
      >
        {checked ? (
          <MaterialIcons name="check" size={13} color="#06281A" />
        ) : null}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  boxChecked: {
    backgroundColor: MINT,
    borderColor: MINT,
  },
  label: {
    ...typography.caption,
    fontSize: 12.5,
    color: '#8D9B92',
    fontWeight: '500',
  },
});
