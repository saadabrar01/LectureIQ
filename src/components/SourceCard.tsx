import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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

// Exact styles from reference image:
// 1. Document / Notes: Deep Forest Green (#071C14) + Mint Green (#22C55E)
// 2. Video Lecture: Deep Cyan/Ocean Night (#081E29) + Cyan Blue (#38BDF8)
const THEMES = {
  document: {
    bgTop: '#0A2419',
    bgBottom: '#051610',
    border: 'rgba(34, 197, 94, 0.45)',
    glow: '#10B981',
    gradIcon: ['#22C55E', '#10B981'] as [string, string],
    gradButton: ['#22C55E', '#10B981'] as [string, string],
    accentText: '#22C55E',
    buttonTextColor: '#052316',
    badgeBg: 'rgba(34, 197, 94, 0.18)',
    badgeBorder: 'rgba(34, 197, 94, 0.45)',
    actionLabel: 'Open Note',
  },
  video: {
    bgTop: '#092330',
    bgBottom: '#05141D',
    border: 'rgba(56, 189, 248, 0.45)',
    glow: '#38BDF8',
    gradIcon: ['#38BDF8', '#0284C7'] as [string, string],
    gradButton: ['#38BDF8', '#0EA5E9'] as [string, string],
    accentText: '#38BDF8',
    buttonTextColor: '#041E2D',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    badgeBorder: 'rgba(56, 189, 248, 0.45)',
    actionLabel: 'Open Lecture',
  },
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
  const cfg = THEMES[type] ?? THEMES.document;

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={() => {
          haptics.light();
          onAskAgain();
        }}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: cfg.border,
            shadowColor: cfg.glow,
          },
          pressed && { transform: [{ scale: 0.985 }] },
        ]}
      >
        {/* Deep Ambient Background Gradient */}
        <LinearGradient
          colors={[cfg.bgTop, cfg.bgBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Radial Glow Sheen */}
        <LinearGradient
          colors={[`${cfg.glow}1A`, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Accent Stripe */}
        <View style={styles.accentStripe}>
          <LinearGradient
            colors={cfg.gradIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentStripeFill}
          />
        </View>

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
            <MaterialIcons name="delete-outline" size={16} color="rgba(255,255,255,0.45)" />
          </Pressable>
        )}

        {/* Source Badge (Top Left) */}
        <View style={styles.topBadgeRow}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: cfg.badgeBg,
                borderColor: cfg.badgeBorder,
              },
            ]}
          >
            <MaterialIcons
              name={type === 'document' ? 'description' : 'smart-display'}
              size={12}
              color={cfg.accentText}
            />
            <Text style={[styles.typeBadgeText, { color: cfg.accentText }]}>
              {badge}
            </Text>
          </View>
        </View>

        {/* Centered Circular Icon Circle with White Icon (matches user image) */}
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={cfg.gradIcon}
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

        {/* Title */}
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
          {name}
        </Text>

        {/* Subtitle / Meta info */}
        <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.65)' }]}>
          {date}  ·  {sizeLabel}
        </Text>

        {/* Pill Action Button (matches reference image: "Upload Notes +" / "Add Video +") */}
        <LinearGradient
          colors={cfg.gradButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionPill}
        >
          <Text style={[styles.actionPillText, { color: cfg.buttonTextColor }]}>
            {type === 'document' ? 'View Document →' : 'Watch Lecture →'}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    minWidth: 230,
    maxWidth: '100%',
    marginVertical: 8,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 7,
    position: 'relative',
    minHeight: 220,
    justifyContent: 'space-between',
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
  },
  accentStripeFill: {
    flex: 1,
  },
  topBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(239,68,68,0.88)',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  confirmCancelText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  deleteTopBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrap: {
    marginTop: 16,
    marginBottom: 8,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    ...typography.bodySemi,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 11,
    marginBottom: 14,
  },
  actionPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
