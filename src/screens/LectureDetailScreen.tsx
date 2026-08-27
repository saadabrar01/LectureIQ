import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { AppButton } from '../components/AppButton';
import { GlowBackground } from '../components/GlowBackground';
import { lectures as mockLectures, transcript as mockTranscript, Note } from '../data/mock';
import { formatClock } from '../utils/helpers';
import { fetchAllNotes } from '../utils/notesStorage';
import { lecturesApi, LectureDetailItem, TranscriptSegmentItem } from '../services/api';

type Tab = 'Transcript' | 'Notes' | 'Chat';

export function LectureDetailScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { lectureId } = route.params as { lectureId: string };

  const [lecture, setLecture] = useState<LectureDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Transcript');
  const [currentTime, setCurrentTime] = useState(0);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const listRef = useRef<FlatList>(null);
  const isScrolling = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchAllNotes().then(setAllNotes).catch(() => {});
    }, [])
  );

  useEffect(() => {
    let isMounted = true;
    async function loadLecture() {
      setLoading(true);
      try {
        const data = await lecturesApi.get(lectureId);
        if (isMounted) {
          setLecture(data);
        }
      } catch {
        // Fallback to local mock if backend lecture not found
        const fallback = mockLectures.find((l) => l.id === lectureId) ?? mockLectures[0];
        if (isMounted) {
          setLecture({
            ...fallback,
            video_id: fallback.videoId || '',
            transcript: mockTranscript,
            added_at: (fallback as any).addedAt?.toISOString?.() ?? new Date().toISOString(),
            duration_sec: (fallback as any).duration ?? 0,
          } as any);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLecture();
    return () => {
      isMounted = false;
    };
  }, [lectureId]);

  const lectureNotes = allNotes.filter((n) => n.lectureId === lectureId);
  const transcriptData: TranscriptSegmentItem[] = lecture?.transcript || [];

  const videoId =
    lecture?.video_id ||
    (lecture as any)?.videoId ||
    (lecture?.url ? lecture.url.split('v=')[1]?.split('&')[0] : '') ||
    'dQw4w9WgXcQ';

  const jumpTo = (time: number) => {
    setCurrentTime(time);
  };

  const tabs: Tab[] = ['Transcript', 'Notes', 'Chat'];

  if (loading && !lecture) {
    return (
      <GlowBackground>
        <View style={[styles.container, styles.centerLoading]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading lecture & transcript...
          </Text>
        </View>
      </GlowBackground>
    );
  }

  return (
    <GlowBackground>
      <View style={styles.container}>
        <Header
          title={lecture?.title || 'Lecture Detail'}
          subtitle={lecture?.channel || 'YouTube'}
          back
          right={<StatusBadge status={(lecture?.status || 'ready') as any} />}
        />

        <View style={styles.playerWrap}>
          {Platform.OS === 'web' ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&playsinline=1`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <WebView
              source={{
                uri: `https://www.youtube.com/embed/${videoId}?autoplay=0&playsinline=1`,
              }}
              style={styles.player}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction
            />
          )}
          <View style={[styles.timeOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <MaterialIcons name="timer" size={13} color="#fff" />
            <Text style={styles.timeOverlayText}>{formatClock(currentTime)}</Text>
          </View>
        </View>

        <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
          {tabs.map((t) => (
            <View key={t} style={styles.tabItem}>
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === t ? theme.textPrimary : theme.textSecondary },
                ]}
                onPress={() => {
                  setTab(t);
                  if (t === 'Chat') {
                    (navigation as any).navigate('Chat', { lectureId });
                  }
                }}
              >
                {t}
              </Text>
              <View
                style={[
                  styles.tabUnderline,
                  {
                    backgroundColor: tab === t ? theme.primaryDark : 'transparent',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.content}>
          {tab === 'Transcript' && (
            <FlatList
              ref={listRef}
              data={transcriptData}
              keyExtractor={(item, index) => `${item.start}-${index}`}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={() => {
                isScrolling.current = true;
              }}
              onMomentumScrollEnd={() => {
                isScrolling.current = false;
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <MaterialIcons name="subtitles-off" size={44} color={theme.textSecondary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No transcript segments found for this lecture.
                  </Text>
                </View>
              }
              contentContainerStyle={styles.transcriptContent}
              renderItem={({ item }) => {
                const isCurrent = item.start <= currentTime && currentTime < item.start + 35;
                return (
                  <Pressable
                    onPress={() => jumpTo(item.start)}
                    style={[
                      styles.transcriptRow,
                      {
                        backgroundColor: isCurrent ? theme.surfaceAlt : theme.surface,
                        borderColor: isCurrent ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={[styles.timeChip, { backgroundColor: theme.surfaceAlt }]}>
                      <Text
                        style={[
                          styles.timestamp,
                          { color: isCurrent ? theme.primaryDark : theme.primary },
                        ]}
                      >
                        {formatClock(item.start)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transcriptText,
                        { color: isCurrent ? theme.textPrimary : theme.textSecondary },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          {tab === 'Notes' && (
            <ScrollView contentContainerStyle={styles.notesContent}>
              {lectureNotes.length === 0 ? (
                <View style={styles.empty}>
                  <MaterialIcons name="sticky-note-2" size={48} color={theme.textSecondary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No notes for this lecture yet
                  </Text>
                  <AppButton
                    title="Add a note"
                    variant="outline"
                    onPress={() => (navigation as any).navigate('AddNote', { lectureId })}
                  />
                </View>
              ) : (
                lectureNotes.map((n) => (
                  <Pressable
                    key={n.id}
                    onPress={() => (navigation as any).navigate('AddNote', { noteId: n.id })}
                    style={({ pressed }) => [
                      styles.noteCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: (n.color || theme.border) + '44',
                      },
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <Text style={[styles.noteTitle, { color: theme.textPrimary, flex: 1 }]}>
                        {n.title}
                      </Text>
                      <MaterialIcons
                        name="edit"
                        size={16}
                        color={n.color || theme.textSecondary}
                      />
                    </View>
                    <Text
                      style={[styles.noteContent, { color: theme.textSecondary }]}
                      numberOfLines={3}
                    >
                      {n.content}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}

          {tab === 'Chat' && (
            <View style={styles.empty}>
              <MaterialIcons name="chat-bubble-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Ask any question about this lecture with AI citations & timestamps.
              </Text>
              <AppButton
                title="Ask AI a question"
                variant="gradient"
                onPress={() => (navigation as any).navigate('Chat', { lectureId })}
              />
            </View>
          )}
        </View>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.body,
  },
  playerWrap: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  player: { flex: 1, backgroundColor: '#000' },
  timeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeOverlayText: { color: '#fff', ...typography.caption },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 12,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: {
    ...typography.subheading,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabUnderline: {
    height: 3,
    width: '60%',
    borderRadius: 2,
    marginTop: -2,
  },
  content: { flex: 1, maxWidth: 900, width: '100%', alignSelf: 'center' },
  transcriptContent: { padding: 20, paddingBottom: 30, gap: 8, width: '100%' },
  transcriptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timestamp: { ...typography.caption, fontWeight: '700' },
  transcriptText: { ...typography.body, flex: 1, lineHeight: 22 },
  notesContent: { padding: 16, gap: 12 },
  noteCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  noteTitle: { ...typography.h3, marginBottom: 6 },
  noteContent: { ...typography.body },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  emptyText: { ...typography.body, textAlign: 'center' },
});