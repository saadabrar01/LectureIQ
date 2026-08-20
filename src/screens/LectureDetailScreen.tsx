import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { AppButton } from '../components/AppButton';
import { GlowBackground } from '../components/GlowBackground';
import { transcript, lectures, notes } from '../data/mock';
import { formatClock } from '../utils/helpers';

type Tab = 'Transcript' | 'Notes' | 'Chat';

export function LectureDetailScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { lectureId } = route.params as { lectureId: string };

  const lecture = lectures.find((l) => l.id === lectureId) ?? lectures[0];
  const [tab, setTab] = useState<Tab>('Transcript');
  const [currentTime, setCurrentTime] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isScrolling = useRef(false);

  const lectureNotes = notes.filter((n) => n.lectureId === lectureId);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((t) => (t + 1) % (lecture.duration + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lecture.duration]);

  useEffect(() => {
    if (tab !== 'Transcript') return;
    const idx = transcript.findIndex((seg) => seg.start <= currentTime && currentTime < seg.start + 35);
    if (idx > 0 && listRef.current && !isScrolling.current) {
      listRef.current.scrollToIndex({ index: Math.max(0, idx - 1), animated: true, viewPosition: 0.3 });
    }
  }, [currentTime, tab]);

  const jumpTo = (time: number) => {
    setCurrentTime(time);
  };

  const tabs: Tab[] = ['Transcript', 'Notes', 'Chat'];

  return (
    <GlowBackground>
      <View style={styles.container}>
        <Header
          title={lecture.title}
          subtitle={lecture.channel}
          back
          right={<StatusBadge status={lecture.status} />}
        />

      <View style={styles.playerWrap}>
        <WebView
          source={{
            uri: `https://www.youtube.com/embed/${lecture.videoId}?autoplay=0&playsinline=1`,
          }}
          style={styles.player}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
        />
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
                  navigation.navigate('Chat', { lectureId });
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
            data={transcript}
            keyExtractor={(item) => String(item.start)}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => {
              isScrolling.current = true;
            }}
            onMomentumScrollEnd={() => {
              isScrolling.current = false;
            }}
            contentContainerStyle={styles.transcriptContent}
            renderItem={({ item, index }) => {
              const isCurrent =
                item.start <= currentTime && currentTime < item.start + 35;
              return (
                <View
                  style={[
                    styles.transcriptRow,
                    {
                      backgroundColor: isCurrent ? theme.surfaceAlt : 'transparent',
                      borderColor: isCurrent ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    onPress={() => jumpTo(item.start)}
                    style={[
                      styles.timestamp,
                      { color: isCurrent ? theme.primaryDark : theme.textSecondary },
                    ]}
                  >
                    {formatClock(item.start)}
                  </Text>
                  <Text
                    style={[
                      styles.transcriptText,
                      { color: isCurrent ? theme.textPrimary : theme.textSecondary },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
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
                <AppButton title="Add a note" variant="outline" onPress={() => (navigation as any).navigate('AddNote')} />
              </View>
            ) : (
              lectureNotes.map((n) => (
                <View
                  key={n.id}
                  style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={[styles.noteTitle, { color: theme.textPrimary }]}>{n.title}</Text>
                  <Text style={[styles.noteContent, { color: theme.textSecondary }]}>{n.content}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {tab === 'Chat' && (
          <View style={styles.empty}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              You can ask anything about this lecture
            </Text>
            <AppButton
              title="Ask a question"
              variant="gradient"
              onPress={() => navigation.navigate('Chat', { lectureId })}
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
  playerWrap: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
    maxWidth: 900,
    width: '100%',
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
  content: { flex: 1 },
  transcriptContent: { padding: 20, paddingBottom: 30, gap: 4, maxWidth: 900, width: '100%' },
  transcriptRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  timestamp: { ...typography.bodySmall, fontWeight: '700', width: 48 },
  transcriptText: { ...typography.body, flex: 1 },
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