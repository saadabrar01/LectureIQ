import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Chip } from '../components/Chip';
import { GlassCard } from '../components/GlassCard';
import { FadeUp, GlowChip } from '../components/FadeUp';
import { bookmarks } from '../data/mock';
import { timeAgo, haptics } from '../utils/helpers';

const ACCENTS = ['#8EF0A3', '#22C55E', '#3FC9A7', '#6EE7B7'];

export function BookmarksScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [lectureFilter, setLectureFilter] = useState<string>('all');

  const lectures = [...new Set(bookmarks.map((b) => b.lectureId))];
  const filtered =
    lectureFilter === 'all'
      ? bookmarks
      : bookmarks.filter((b) => b.lectureId === lectureFilter);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Saved</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Bookmarks & highlights from your lectures
        </Text>
      </View>

      <View style={styles.chipRow}>
        <Chip
          label="All"
          selected={lectureFilter === 'all'}
          onPress={() => setLectureFilter('all')}
        />
        {lectures.map((id) => {
          const b = bookmarks.find((x) => x.lectureId === id);
          return (
            <Chip
              key={id}
              label={b ? b.lectureTitle.split(' ').slice(0, 3).join(' ') : id}
              selected={lectureFilter === id}
              onPress={() => setLectureFilter(id)}
            />
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="bookmark-border" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No saved items yet. Tap the bookmark icon on an AI answer or transcript highlight to save it.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const accent = ACCENTS[index % ACCENTS.length];
          return (
            <FadeUp index={index}>
              <GlassCard
                onPress={() =>
                  navigation.navigate('LectureDetail', {
                    lectureId: item.lectureId,
                  })
                }
                style={styles.card}
                accentColor={accent}
                blur={16}
              >
                <View style={styles.body}>
                  <View style={styles.topRow}>
                    <GlowChip color={accent}>
                      <MaterialIcons name="smart-display" size={13} color={accent} />
                      <Text style={[styles.lectureTagText, { color: accent }]} numberOfLines={1}>
                        {item.lectureTitle}
                      </Text>
                    </GlowChip>
                    <Text style={[styles.time, { color: theme.textSecondary }]}>
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                  <View style={[styles.quoteMark, { backgroundColor: accent + '22' }]}>
                    <MaterialIcons name="format-quote" size={16} color={accent} />
                    <Text style={[styles.quote, { color: theme.textPrimary }]}>
                      {item.quote}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </FadeUp>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    // saved surface: centered max-w-6xl column clear of the dock
    paddingHorizontal: 28,
    paddingBottom: 12,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  title: { ...typography.h1 },
  subtitle: { ...typography.caption, marginTop: 4 },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 28,
    paddingBottom: 14,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  list: {
    paddingHorizontal: 28,
    paddingBottom: 110,
    gap: 12,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  card: { marginBottom: 2 },
  body: { padding: 4 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lectureTagText: { ...typography.caption, maxWidth: 200 },
  time: { ...typography.caption },
  quoteMark: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  quote: { ...typography.body, flex: 1, fontStyle: 'italic', lineHeight: 24 },
  empty: { alignItems: 'center', paddingTop: 70, gap: 14, paddingHorizontal: 20 },
  emptyText: { ...typography.body, textAlign: 'center' },
});