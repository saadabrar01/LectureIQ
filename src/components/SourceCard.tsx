import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import { haptics } from '../utils/helpers';
import { typography } from '../theme/typography';

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

const GRADIENTS: Record<string, [string, string]> = {
  document: ['#35D47A', '#22C55E'],
  video: ['#8EA6E8', '#38CFA8'],
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
  const grad = GRADIENTS[type] ?? ['#35D47A', '#22C55E'];

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={() => {
          haptics.light();
          onAskAgain();
        }}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.985 }] },
        ]}
      >
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Delete Action (Top Right) */}
        {confirmingDelete ? (
          <View style={styles.topDeleteRow}>
            <Pressable
              onPress={() => {
                haptics.warning();
                setConfirmingDelete(false);
                onDelete();
              }}
              style={styles.confirmBtnDelete}
            >
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                haptics.light();
                setConfirmingDelete(false);
              }}
              style={styles.confirmBtnCancel}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              haptics.light();
              setConfirmingDelete(true);
            }}
            style={styles.deleteTopBtn}
            hitSlop={8}
          >
            <MaterialIcons name="delete-outline" size={16} color="rgba(255,255,255,0.4)" />
          </Pressable>
        )}

        {/* Centered Circular Icon Circle */}
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBg}
          >
            <MaterialIcons
              name={type === 'document' ? 'description' : 'smart-display'}
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
        </View>

        {/* Centered Title */}
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
          {name}
        </Text>

        {/* Centered Description / Meta */}
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {date}  ·  {sizeLabel}  ·  {badge}
        </Text>

        {/* Centered Circular Arrow Action Button */}
        <View style={styles.actionCircle}>
          <MaterialIcons name="arrow-forward" size={18} color="#34D399" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    minWidth: 220,
    maxWidth: '100%',
    marginVertical: 6,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(37,31,50,0.72)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
    position: 'relative',
    minHeight: 210,
    justifyContent: 'space-between',
  },
  topDeleteRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  confirmBtnDelete: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.85)',
  },
  confirmDeleteText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  confirmBtnCancel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  confirmCancelText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  deleteTopBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrap: {
    marginTop: 4,
    marginBottom: 10,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodySemi,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 17,
    fontSize: 11,
    marginBottom: 14,
  },
  actionCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(53,212,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(53,212,122,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
