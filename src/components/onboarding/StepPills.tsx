// Top navigation step pills for onboarding (desktop/tablet).
// Acts like a subtle progress/navigation system: numbered steps,
// active step highlighted with a soft mint pill + dot.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingPalette } from '../../theme/onboarding';

interface StepPillsProps {
  steps: string[];
  active: number;
  onPress: (index: number) => void;
}

export function StepPills({ steps, active, onPress }: StepPillsProps) {
  return (
    <View style={styles.row}>
      {steps.map((label, i) => {
        const isActive = i === active;
        return (
          <Pressable
            key={label}
            onPress={() => onPress(i)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.pill,
              isActive ? styles.pillActive : styles.pillIdle,
              pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 },
            ]}
          >
            {isActive ? <View style={styles.dot} /> : null}
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelIdle]}>
              {i + 1} · {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillIdle: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: onboardingPalette.border,
  },
  pillActive: {
    backgroundColor: 'rgba(142,240,163,0.1)',
    borderColor: 'rgba(142,240,163,0.35)',
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: onboardingPalette.primary },
  label: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  labelActive: { color: onboardingPalette.text },
  labelIdle: { color: onboardingPalette.muted },
});
