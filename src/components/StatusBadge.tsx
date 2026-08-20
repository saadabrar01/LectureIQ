import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';

export type BadgeStatus = 'processing' | 'ready' | 'error' | 'queued';

interface StatusBadgeProps {
  status: BadgeStatus;
}

const CONFIG: Record<BadgeStatus, { icon: string; label: string; color: string; bg: string }> = {
  processing: { icon: 'sync', label: 'Processing', color: '#FFB84D', bg: 'rgba(255,184,77,0.15)' },
  ready: { icon: 'check-circle', label: 'Ready', color: '#2FA866', bg: 'rgba(142,240,163,0.16)' },
  error: { icon: 'error', label: 'Failed', color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
  queued: { icon: 'schedule', label: 'Queued', color: '#9F8FF0', bg: 'rgba(159,143,240,0.16)' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <MaterialIcons name={cfg.icon as never} size={12} color={cfg.color} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: { ...typography.caption },
});