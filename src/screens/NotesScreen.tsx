import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Note } from '../data/mock';
import { FadeUp, GlowChip } from '../components/FadeUp';
import { timeAgo, haptics } from '../utils/helpers';
import { fetchAllNotes } from '../utils/notesStorage';
import type { RootStackParamList } from '../navigation/types';

const CONTENT_MAX = 1152;
const PAD_H = 28;
const GRID_GAP = 16;
const GRID_BREAKPOINT = 820;
const WIDE3_BREAKPOINT = 1120;

// Unified emerald → teal accent family (matches Home & Profile)
const MINT = '#34D399';
const MINT_BRIGHT = '#2DD4BF';
const MINT_DEEP = '#0EA5A0';
const MINT_RING = 'rgba(52,211,153,0.55)';
const CARD_BG = 'rgba(14,23,18,0.6)';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const DARK_TEXT = '#06281A';

function getHovered(state: {
  pressed: boolean;
  hovered?: boolean;
}): boolean {
  return state.hovered ?? false;
}

function NotesCard({
  item,
  theme,
  onPress,
  icon,
}: {
  item: Note;
  theme: ReturnType<typeof useAppTheme>['theme'];
  onPress: () => void;
  icon: 'sticky-note-2' | 'edit-note';
}) {
  const t = theme;
  const accentColor = item.color || MINT;

  return (
    <Pressable
      onPress={onPress}
      style={(state) => {
        const hovered = getHovered(state);
        return [
          styles.card,
          { backgroundColor: CARD_BG, borderColor: 'rgba(255,255,255,0.08)' },
          hovered && {
            transform: [{ translateY: -3 }],
            borderColor: accentColor + '88',
            backgroundColor: 'rgba(20,32,26,0.78)',
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.28,
            shadowRadius: 20,
            elevation: 9,
          },
          state.pressed && { transform: [{ scale: 0.98 }] },
        ];
      }}
    >
      <LinearGradient
        colors={['rgba(24,36,29,0.92)', 'rgba(14,23,18,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Colored glowing accent edge */}
      <View style={styles.accentEdge}>
        <LinearGradient
          colors={[accentColor, MINT_BRIGHT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.accentEdgeFill}
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.cardIcon,
              { backgroundColor: accentColor + '22', borderColor: accentColor + '44' },
            ]}
          >
            <MaterialIcons name={icon} size={18} color={accentColor} />
          </View>
          <Text style={[styles.cardTime, { color: t.textSecondary }]}>
            {timeAgo(item.updatedAt).toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.cardTitle, { color: t.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={[styles.cardPreview, { color: t.textSecondary }]} numberOfLines={3}>
          {item.content.replace(/[#*`>-]/g, '').replace(/\n+/g, ' ')}
        </Text>

        <View style={styles.cardBottomRow}>
          {item.lectureTitle ? (
            <GlowChip color={MINT}>
              <MaterialIcons name="smart-display" size={13} color={MINT} />
              <Text style={[styles.tagText, { color: MINT }]} numberOfLines={1}>
                {item.lectureTitle}
              </Text>
            </GlowChip>
          ) : (
            <GlowChip color={t.textSecondary}>
              <Text style={[styles.tagText, { color: t.textSecondary }]}>General</Text>
            </GlowChip>
          )}
          <View style={[styles.chevronPill, { borderColor: accentColor + '44', backgroundColor: accentColor + '18' }]}>
            <MaterialIcons name="arrow-forward" size={16} color={accentColor} />
          </View>
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
  const cols = width >= WIDE3_BREAKPOINT ? 3 : wide ? 2 : 1;

  const [notesList, setNotesList] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotes = useCallback(async () => {
    try {
      const list = await fetchAllNotes();
      setNotesList(list);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await loadNotes();
    setRefreshing(false);
  };

  const filteredNotes = notesList.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.lectureTitle && n.lectureTitle.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Notes</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {notesList.length} notes · synced across LectureIQ
          </Text>
        </View>
        <Pressable
          onPress={() => {
            haptics.light();
            navigation.navigate('AddNote', {});
          }}
          style={(state) => {
            const hovered = getHovered(state);
            return [
              styles.headerAdd,
              state.pressed && { transform: [{ scale: 0.94 }] },
              hovered ? { borderColor: MINT_RING, backgroundColor: MINT + '18' } : null,
            ];
          }}
          hitSlop={8}
        >
          <LinearGradient
            colors={[MINT, MINT_DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerAddGrad}
          >
            <MaterialIcons name="add" size={20} color={DARK_TEXT} />
          </LinearGradient>
          <Text style={[styles.headerAddText, { color: theme.textPrimary }]}>New note</Text>
        </Pressable>
      </View>

      {/* Main List */}
      <FlatList
        key={`grid-${cols}`}
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={MINT}
            colors={[MINT]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Search Bar */}
            <View style={[styles.searchBar, { borderColor: HAIRLINE, backgroundColor: 'rgba(255,255,255,0.04)' }]}>
              <MaterialIcons name="search" size={20} color={theme.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search notes, insights, lectures..."
                placeholderTextColor={theme.textSecondary + '88'}
                style={[styles.searchInput, { color: theme.textPrimary }]}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <MaterialIcons name="cancel" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            {/* Info Hint */}
            <View style={[styles.infoCard, { backgroundColor: CARD_BG, borderColor: HAIRLINE }]}>
              <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[styles.infoIcon, { backgroundColor: MINT + '26' }]}>
                <MaterialIcons name="auto-awesome" size={18} color={MINT} />
              </View>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Notes auto-sync with your lectures. Tap any note to edit, format with AI, or export.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: MINT + '18' }]}>
              <MaterialIcons name="note-add" size={36} color={MINT} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {searchQuery ? 'No matching notes' : 'No notes created yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {searchQuery
                ? `No notes match "${searchQuery}". Try a different keyword.`
                : 'Create your first study note to summarize key lecture concepts and quiz yourself.'}
            </Text>
            {!searchQuery ? (
              <Pressable
                onPress={() => {
                  haptics.light();
                  navigation.navigate('AddNote', {});
                }}
                style={styles.emptyActionBtn}
              >
                <LinearGradient
                  colors={[MINT, MINT_DEEP]}
                  style={styles.emptyActionGrad}
                >
                  <MaterialIcons name="add" size={18} color={DARK_TEXT} />
                  <Text style={styles.emptyActionText}>Create Note</Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[styles.cardWrap, cols > 1 && { maxWidth: cols === 3 ? '31.5%' : '50%' }]}>
            <FadeUp index={index}>
              <NotesCard
                item={item}
                theme={theme}
                onPress={() => navigation.navigate('AddNote', { noteId: item.id })}
                icon="sticky-note-2"
              />
            </FadeUp>
          </View>
        )}
      />

      {/* Floating Action Button (Mobile) */}
      {!wide ? (
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
            colors={[MINT, MINT_DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <MaterialIcons name="add" size={28} color={DARK_TEXT} />
          </LinearGradient>
        </Pressable>
      ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { gap: 2 },
  title: { ...typography.h1, letterSpacing: -0.5 },
  subtitle: { ...typography.caption, marginTop: 3 },
  headerAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingRight: 14,
    paddingLeft: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  headerAddGrad: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  headerAddText: { ...typography.bodySmall, fontWeight: '600' },
  headerSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    ...typography.bodySmall,
    flex: 1,
    padding: 0,
  },
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
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  accentEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    overflow: 'hidden',
  },
  accentEdgeFill: { flex: 1 },
  cardBody: { padding: 16 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardTime: { ...typography.caption, letterSpacing: 0.6 },
  cardTitle: { ...typography.subheading, marginTop: 12, lineHeight: 24 },
  cardPreview: { ...typography.bodySmall, marginTop: 8, lineHeight: 21, opacity: 0.9 },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  chevronPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tagText: { ...typography.caption, maxWidth: 200 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: 8,
  },
  emptyDesc: {
    ...typography.bodySmall,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 21,
    marginBottom: 20,
  },
  emptyActionBtn: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  emptyActionGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyActionText: {
    ...typography.button,
    color: DARK_TEXT,
    fontWeight: '700',
  },
});
