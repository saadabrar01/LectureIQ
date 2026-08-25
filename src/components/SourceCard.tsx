import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../context/ThemeContext';
import { haptics } from '../utils/helpers';

export type SourceType = 'document' | 'video';

export interface SourceCardProps {
  type: SourceType;
  name: string;
  date: string;
  sizeLabel: string;
  badge: string;
  onDelete: () => void;
  onAskAgain: () => void;
}

const BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  PDF: { bg: 'rgba(159,143,240,0.16)', fg: '#9F8FF0' },
  DOCX: { bg: 'rgba(56,207,168,0.16)', fg: '#38CFA8' },
  YOUTUBE: { bg: 'rgba(255,126,179,0.16)', fg: '#FF7EB3' },
};

export function SourceCard({
  type,
  name,
  date,
  sizeLabel,
  badge,
  onDelete,
  onAskAgain,
}: SourceCardProps) {
  const { theme } = useAppTheme();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const badgeStyle = BADGE_COLORS[badge.toUpperCase()] ?? BADGE_COLORS.PDF;

  return (
    <View style={styles.card}>
      <BlurView intensity={16} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
          <MaterialIcons
            name={type === 'document' ? 'description' : 'smart-display'}
            size={20}
            color="#22C55E"
          />
        </View>
        <View style={styles.meta}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.subMeta, { color: theme.textSecondary }]}>
            {date} · {sizeLabel}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.fg + '44' }]}>
          <Text style={[styles.badgeText, { color: badgeStyle.fg }]}>{badge}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            haptics.light();
            onAskAgain();
          }}
          style={({ pressed }) => [
            styles.askButton,
            pressed && { transform: [{ scale: 0.96 }] },
          ]}
        >
          <MaterialIcons name="chat-bubble-outline" size={15} color="#06281A" />
          <Text style={styles.askButtonText}>Ask a question</Text>
        </Pressable>

        {confirmingDelete ? (
          <View style={styles.confirmRow}>
            <Pressable
              onPress={() => {
                haptics.warning();
                setConfirmingDelete(false);
                onDelete();
              }}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.confirmDelete}>Confirm</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                haptics.light();
                setConfirmingDelete(false);
              }}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.confirmCancel, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              haptics.light();
              setConfirmingDelete(true);
            }}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && { transform: [{ scale: 0.9 }] },
            ]}
            hitSlop={6}
          >
            <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(38,38,38,0.85)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  meta: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  subMeta: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22C55E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  askButtonText: { color: '#06281A', fontSize: 13, fontWeight: '600' },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  confirmDelete: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  confirmCancel: { fontSize: 13 },
});
