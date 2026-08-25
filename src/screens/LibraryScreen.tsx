import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { SourceCard, type SourceType } from '../components/SourceCard';
import { documentsApi, lecturesApi, type ApiError } from '../services/api';
import { haptics } from '../utils/helpers';
import type { RootStackParamList } from '../navigation/types';

type FilterKey = 'all' | 'document' | 'video';

interface LibraryItem {
  id: string;
  type: SourceType;
  name: string;
  date: string;
  sizeLabel: string;
  badge: string;
}

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'document', label: 'Documents', icon: 'description' },
  { key: 'video', label: 'Lectures', icon: 'smart-display' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const MINT = '#22C55E';

export function LibraryScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [docs, lectures] = await Promise.all([
        documentsApi.list().catch(() => []),
        lecturesApi.list().catch(() => []),
      ]);

      const docItems: LibraryItem[] = docs.map((d) => ({
        id: `document:${d.id}`,
        type: 'document',
        name: d.file_name,
        date: formatDate(d.created_at),
        sizeLabel: formatBytes(d.file_size),
        badge: (d.file_type ?? 'PDF').toUpperCase(),
      }));

      const videoItems: LibraryItem[] = lectures.map((l) => ({
        id: `video:${l.id}`,
        type: 'video',
        name: l.title,
        date: formatDate(l.added_at),
        sizeLabel: formatDuration(l.duration_sec ?? l.duration),
        badge: 'YouTube',
      }));

      setItems(
        [...docItems, ...videoItems].sort((a, b) => (a.date < b.date ? 1 : -1))
      );
    } catch (err) {
      setError((err as ApiError)?.message ?? 'Could not load library');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.type === filter)),
    [items, filter]
  );

  const handleDelete = async (item: LibraryItem) => {
    haptics.warning();
    const [type, rawId] = item.id.split(':');
    try {
      if (type === 'document') await documentsApi.remove(Number(rawId));
      else await lecturesApi.remove(rawId);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError((err as ApiError)?.message ?? 'Delete failed');
    }
  };

  const handleAskAgain = (item: LibraryItem) => {
    haptics.light();
    const [type, rawId] = item.id.split(':');
    if (type === 'document') {
      navigation.navigate('Documents');
    } else {
      navigation.navigate('Chat', { lectureId: rawId });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={MINT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Library</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {items.length} source{items.length !== 1 ? 's' : ''} indexed
        </Text>
      </View>

      {error ? (
        <View style={[styles.banner, { borderColor: '#EF444444' }]}>
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => {
              haptics.light();
              setFilter(f.key);
            }}
            style={({ pressed }) => [
              styles.chip,
              filter === f.key && styles.chipActive,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <MaterialIcons
              name={f.icon as never}
              size={14}
              color={filter === f.key ? '#06281A' : theme.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                { color: filter === f.key ? '#06281A' : theme.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MINT}
          />
        }
        renderItem={({ item }) => (
          <SourceCard
            type={item.type}
            name={item.name}
            date={item.date}
            sizeLabel={item.sizeLabel}
            badge={item.badge}
            onDelete={() => handleDelete(item)}
            onAskAgain={() => handleAskAgain(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <MaterialIcons name="folder-open" size={36} color="rgba(255,255,255,0.18)" />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
              No sources yet
            </Text>
            <Text style={[styles.emptyDesc, { color: 'rgba(255,255,255,0.35)' }]}>
              Upload documents or add lectures to see them here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 28,
    paddingBottom: 14,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  title: { ...typography.h1 },
  subtitle: { ...typography.caption, marginTop: 3 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    marginBottom: 14,
    marginHorizontal: 28,
  },
  bannerText: { ...typography.bodySmall, color: '#EF4444', flex: 1 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 28,
    marginBottom: 16,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: MINT,
    borderColor: MINT,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  listContent: {
    paddingHorizontal: 28,
    paddingBottom: 120,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(38,38,38,0.85)',
    gap: 8,
  },
  emptyTitle: { ...typography.bodySemi, marginTop: 8 },
  emptyDesc: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },
});
