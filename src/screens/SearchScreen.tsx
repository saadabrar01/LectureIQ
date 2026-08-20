import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { AppInput } from '../components/AppInput';
import { Chip } from '../components/Chip';
import { GlassCard } from '../components/GlassCard';
import { FadeUp } from '../components/FadeUp';
import { lectures, notes, chatMessages, transcript } from '../data/mock';
import { formatClock, haptics } from '../utils/helpers';

type Filter = 'all' | 'lectures' | 'notes' | 'chats';

interface SearchItem {
  id: string;
  type: Filter;
  title: string;
  snippet: string;
  matched: string;
  lectureId?: string;
  time?: number;
}

export function SearchScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const inputRef = useRef<any>(null);

  const results = useMemo<SearchItem[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const items: SearchItem[] = [];

    if (filter === 'all' || filter === 'lectures') {
      lectures.forEach((l) => {
        const idx = l.title.toLowerCase().indexOf(q);
        if (idx !== -1) {
          const start = Math.max(0, idx - 8);
          items.push({
            id: `l-${l.id}`,
            type: 'lectures',
            title: l.title,
            snippet: `Lecture • ${l.channel}`,
            matched: l.title.substr(start, Math.min(q.length + 30, l.title.length)),
            lectureId: l.id,
          });
        }
      });
    }

    if (filter === 'all' || filter === 'notes') {
      notes.forEach((n) => {
        const idx = (n.title + ' ' + n.content).toLowerCase().indexOf(q);
        if (idx !== -1) {
          items.push({
            id: `n-${n.id}`,
            type: 'notes',
            title: n.title,
            snippet: n.content.replace(/\n/g, ' ').slice(0, 90),
            matched: n.title,
          });
        }
      });
    }

    if (filter === 'all' || filter === 'chats') {
      chatMessages.forEach((m) => {
        const idx = m.text.toLowerCase().indexOf(q);
        if (idx !== -1) {
          items.push({
            id: `c-${m.id}`,
            type: 'chats',
            title: m.role === 'ai' ? 'AI Answer' : 'Your Question',
            snippet: m.text.slice(0, 110),
            matched: m.text.slice(Math.max(0, idx - 6), idx + q.length + 30),
          });
        }
      });
      transcript.forEach((seg, i) => {
        if (seg.text.toLowerCase().includes(q)) {
          items.push({
            id: `t-${i}`,
            type: 'chats',
            title: 'Transcript',
            snippet: seg.text,
            matched: seg.text,
            lectureId: 'l1',
            time: seg.start,
          });
        }
      });
    }

    return items.slice(0, 20);
  }, [query, filter]);

  const openItem = (item: SearchItem) => {
    haptics.light();
    if (item.type === 'lectures' && item.lectureId) {
      navigation.navigate('LectureDetail', { lectureId: item.lectureId });
    } else if (item.type === 'notes') {
      navigation.navigate('AddNote', { noteId: item.id.slice(2) });
    } else if (item.type === 'chats' && item.lectureId) {
      navigation.navigate('LectureDetail', { lectureId: item.lectureId });
    }
  };

  const highlight = (text: string) => {
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={i} style={{ color: theme.primaryDark, fontWeight: '700' }}>
          {part}
        </Text>
      ) : (
        <Text key={i}>{part}</Text>
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <AppInput
          ref={inputRef}
          placeholder="Search lectures, notes, chat history..."
          value={query}
          onChangeText={setQuery}
          icon={<MaterialIcons name="search" size={22} color={theme.textSecondary} />}
          rightElement={
            query ? (
              <Pressable onPress={() => setQuery('')}>
                <MaterialIcons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            ) : undefined
          }
          containerStyle={styles.searchInput}
        />

        <View style={styles.chipRow}>
          {(['all', 'lectures', 'notes', 'chats'] as Filter[]).map((f) => (
            <Chip
              key={f}
              label={f === 'all' ? 'All' : `${f[0].toUpperCase()}${f.slice(1)}`}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            {query ? (
              <>
                <MaterialIcons name="search-off" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No results for "{query}"
                </Text>
              </>
            ) : (
              <>
                <MaterialIcons name="travel-explore" size={48} color={theme.primaryDark} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Search across all your lectures, notes and chats
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeUp index={index}>
            <GlassCard onPress={() => openItem(item)} style={styles.resultCard} blur={14}>
              <View
                style={[
                  styles.resultIcon,
                  {
                    backgroundColor:
                      item.type === 'lectures'
                        ? 'rgba(142,240,163,0.16)'
                        : item.type === 'notes'
                          ? 'rgba(34,197,94,0.15)'
                          : 'rgba(63,201,167,0.18)',
                  },
                ]}
              >
                <MaterialIcons
                  name={
                    (item.type === 'lectures'
                      ? 'smart-display'
                      : item.type === 'notes'
                        ? 'sticky-note-2'
                        : 'history') as never
                  }
                  size={20}
                  color={theme.primaryDark}
                />
              </View>
              <View style={styles.resultBody}>
                <View style={styles.resultTopRow}>
                  <Text style={[styles.resultTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.time !== undefined ? (
                    <View style={[styles.timeChip, { backgroundColor: theme.primaryDark + '26' }]}>
                      <Text style={[styles.timeChipText, { color: theme.primaryDark }]}>
                        {formatClock(item.time)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.resultSnippet, { color: theme.textSecondary }]} numberOfLines={2}>
                  {highlight(item.matched)}
                </Text>
                <Text style={[styles.resultMeta, { color: theme.textSecondary }]}>{item.snippet}</Text>
              </View>
            </GlassCard>
          </FadeUp>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    // search surface: centered max-w-6xl so it clears the dock with balance
    paddingHorizontal: 28,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 12,
  },
  searchInput: { marginBottom: 10 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  list: {
    paddingHorizontal: 28,
    paddingBottom: 110,
    gap: 12,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 0,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: { flex: 1 },
  resultTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle: { ...typography.bodySemi, flex: 1 },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  timeChipText: { ...typography.caption },
  resultSnippet: { ...typography.bodySmall, marginTop: 3 },
  resultMeta: { ...typography.caption, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { ...typography.body, textAlign: 'center', color: '#6B7280' },
});