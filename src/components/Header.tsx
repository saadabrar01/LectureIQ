// Shared screen header for stack screens (LectureDetail, Chat, Settings, ...).
// Premium dark-glass style: translucent surface, glass pill back button
// with border + subtle shadow, Poppins title + muted subtitle.
import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  back?: boolean;
  transparent?: boolean;
}

export function Header({ title, subtitle, right, back = false }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <View style={styles.row}>
        {back ? (
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.glassBorder },
              pressed && {
                transform: [{ scale: 0.92 }],
                backgroundColor: 'rgba(142,240,163,0.09)',
              },
            ]}
          >
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.titles}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  titles: { flex: 1 },
  title: { ...typography.h3, letterSpacing: -0.3 },
  subtitle: { ...typography.caption, marginTop: 2, opacity: 0.85 },
  right: { minWidth: 40, alignItems: 'flex-end' },
});