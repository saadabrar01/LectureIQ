import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { notes } from '../data/mock';
import { FadeUp, GlowChip } from '../components/FadeUp';
import { timeAgo, haptics } from '../utils/helpers';
import type { RootStackParamList } from '../navigation/types';

const CONTENT_MAX = 1152;
const PAD_H = 28;
const GRID_GAP = 16;
const GRID_BREAKPOINT = 820;
const MINT = '#22C55E';
const MINT_BRIGHT = '#34D399';

function NotesCard({
  item,
  theme,
  onPress,
}: {
  item: (typeof notes)[number];
  theme: ReturnType<typeof useAppTheme>['theme'];
  onPress: () => void;
}) {
  const t = theme;
  return (
    <Pressable
      onPress={onPress}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered ?? false;
        return [
          styles.card,
          { backgroundColor: 'rgba(23,23,23,0.6)', borderColor: 'rgba(255,255,255,0.08)' },
          { borderLeftWidth: 3, borderLeftColor: hovered ? t.primary : t.primaryDark },
          state.pressed && { transform: [{ scale: 0.98 }] },
          hovered && {
            transform: [{ translateY: -2 }],
            backgroundColor: 'rgba(30,35,32,0.65)',
            borderColor: 'rgba(34,197,94,0.45)',
          },
        ];
      }}
    >
      <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, { color: t.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.cardTime, { color: t.textSecondary }]}>
            {timeAgo(item.updatedAt).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.cardPreview, { color: t.textSecondary }]} numberOfLines={3}>
          {item.content.replace(/\n/g, ' ')}
        </Text>
        <View style={styles.cardBottomRow}>
          {item.lectureTitle ? (
            <GlowChip color={t.primaryDark}>
              <MaterialIcons name="smart-display" size={13} color={t.primaryDark} />
              <Text style={[styles.tagText, { color: t.primaryDark }]} numberOfLines={1}>
                {item.lectureTitle}
              </Text>
            </GlowChip>
          ) : (
            <GlowChip color={t.textSecondary}>
              <Text style={[styles.tagText, { color: t.textSecondary }]}>General</Text>
            </GlowChip>
          )}
          <MaterialIcons name="chevron-right" size={18} color={t.primaryDark} />
        </View>
      </View>
    </Pressable>
  );
}

export function NotesScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const wide = width >= GRID_BREAKPOINT;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Notes</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {notes.length} notes · synced with your lectures
          </Text>
        </View>
      </View>

      <FlatList
        key={wide ? 'grid' : 'list'}
        data={notes}
        keyExtractor={(item) => item.id}
        numColumns={wide ? 2 : 1}
        columnWrapperStyle={wide ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={[styles.infoCard, { backgroundColor: 'rgba(23,23,23,0.6)', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.infoIcon, { backgroundColor: theme.primaryDark + '26' }]}>
              <MaterialIcons name="lightbulb" size={18} color={theme.primaryDark} />
            </View>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Notes sync with their linked lecture. Tap a note to edit it anytime.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.cardWrap}>
            <FadeUp index={index}>
              <NotesCard
                item={item}
                theme={theme}
                onPress={() => navigation.navigate('AddNote', { noteId: item.id })}
              />
            </FadeUp>
          </View>
        )}
      />

      <Pressable
        onPress={() => {
          haptics.light();
          navigation.navigate('AddNote', {});
        }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 24 },
          pressed && { transform: [{ scale: 0.92 }] },
        ]}
        hitSlop={8}
      >
        <LinearGradient
          colors={[MINT, '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: PAD_H,
    paddingBottom: 14,
    maxWidth: CONTENT_MAX,
    width: '100%',
    alignSelf: 'center',
  },
  title: { ...typography.h1 },
  subtitle: { ...typography.caption, marginTop: 3 },
  fab: {
    position: 'absolute',
    right: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
    zIndex: 30,
  },
  fabInner: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  list: {
    paddingHorizontal: PAD_H,
    paddingBottom: 140,
    paddingTop: 4,
    maxWidth: CONTENT_MAX,
    width: '100%',
    alignSelf: 'center',
  },
  gridRow: { gap: GRID_GAP },
  cardWrap: { marginBottom: 16, flex: 1 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { ...typography.bodySmall, flex: 1 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  cardBody: { padding: 16 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: { ...typography.subheading, flex: 1 },
  cardTime: { ...typography.caption, letterSpacing: 0.6 },
  cardPreview: { ...typography.bodySmall, marginTop: 8, lineHeight: 22 },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  tagText: { ...typography.caption, maxWidth: 220 },
});