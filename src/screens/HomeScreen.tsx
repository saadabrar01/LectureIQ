import React from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { lectures, userProfile } from '../data/mock';
import { StatusBadge } from '../components/StatusBadge';
import { GlassCard } from '../components/GlassCard';
import { FadeUp, GlowChip } from '../components/FadeUp';
import { timeAgo, formatClock, haptics } from '../utils/helpers';
import type { Lecture } from '../data/mock';

const STAT_META = [
  { key: 'lectures' as const, icon: 'library-books' as const, color: '#8EF0A3' },
  { key: 'questions' as const, icon: 'question-answer' as const, color: '#22C55E' },
  { key: 'processing' as const, icon: 'auto-fix-high' as const, color: '#3FC9A7' },
];

const STAT_LABEL: Record<string, string> = {
  lectures: 'Lectures',
  questions: 'Questions',
  processing: 'Processing',
};

export function HomeScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const stats = {
    lectures: lectures.length,
    questions: userProfile.questionsAsked,
    processing: lectures.filter((l) => l.status === 'processing').length,
  };

  const openLecture = (lecture: Lecture) => {
    haptics.light();
    navigation.navigate('LectureDetail', { lectureId: lecture.id });
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            Welcome back
          </Text>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {userProfile.name}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={[
            styles.avatarRing,
            {
              shadowColor: theme.primary,
            },
          ]}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarInner}>
            <Text style={[styles.avatarText, { color: theme.primaryDeep }]}>
              {userProfile.avatar}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {STAT_META.map((s, i) => (
          <FadeUp key={s.key} index={i} delay={80}>
            <GlassCard style={styles.statCard} blur={14}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '26' }]}>
                <MaterialIcons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {stats[s.key]}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {STAT_LABEL[s.key]}
              </Text>
            </GlassCard>
          </FadeUp>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Your Lectures
        </Text>
        <Pressable onPress={() => navigation.navigate('Search')}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lectures}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 12 },
        ]}
        ListHeaderComponent={renderHeader()}
        renderItem={({ item, index }) => (
          <FadeUp index={index}>
            <GlassCard onPress={() => openLecture(item)} style={styles.lectureCard} blur={16}>
              <View style={styles.thumbWrap}>
                <ImageBackground
                  source={{ uri: item.thumbnail }}
                  style={styles.thumb}
                  imageStyle={styles.thumbImage}
                >
                  <LinearGradient
                    colors={['rgba(11,15,14,0.05)', 'rgba(11,15,14,0.6)', 'rgba(11,15,14,0.9)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.thumbTopRow}>
                    {item.status === 'processing' ? (
                      <GlowChip color={theme.amber}>
                        <View style={[styles.progressDot, { backgroundColor: theme.amber }]} />
                        <Text style={[styles.progressText, { color: theme.amber }]}>
                          {item.progress}%
                        </Text>
                      </GlowChip>
                    ) : item.status === 'queued' ? (
                      <GlowChip color={theme.lavender}>
                        <Text style={[styles.progressText, { color: theme.lavender }]}>
                          Queued
                        </Text>
                      </GlowChip>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                    <View
                      style={[
                        styles.durationBadge,
                        { backgroundColor: 'rgba(11,15,14,0.65)' },
                      ]}
                    >
                      <MaterialIcons name="schedule" size={13} color="#FFFFFF" />
                      <Text style={styles.durationText}>{formatClock(item.duration)}</Text>
                    </View>
                  </View>
                  <View style={styles.thumbBottomRow}>
                    <View style={styles.playGlow}>
                      <View style={styles.playBtn}>
                        <MaterialIcons name="play-arrow" size={26} color="#06281A" />
                      </View>
                    </View>
                    <View style={styles.thumbMeta}>
                      <Text style={styles.thumbChannel} numberOfLines={1}>
                        {item.channel}
                      </Text>
                      <Text style={styles.thumbTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </View>
              <View style={styles.lectureMeta}>
                <View style={[styles.channelDot, { backgroundColor: theme.lavender }]} />
                <Text style={[styles.lectureDate, { color: theme.textSecondary }]}>
                  Added {timeAgo(item.addedAt)}
                </Text>
              </View>
            </GlassCard>
          </FadeUp>
        )}
      />

      <Pressable
        onPress={() => {
          haptics.medium();
          navigation.navigate('AddLecture');
        }}
        style={[
          styles.fab,
          {
            shadowColor: theme.primary,
            borderColor: theme.glassBorder,
            backgroundColor: theme.glassBg,
          },
        ]}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <MaterialIcons name="add" size={26} color={theme.primaryDeep} />
          <Text style={[styles.fabText, { color: theme.primaryDeep }]}>Add Video</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    // content surfaces as a centered max-w-6xl column; the dock offset is
    // already reserved by MainTabs, so centering keeps cards away from edges
    paddingHorizontal: 28,
    paddingBottom: 120,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greeting: { ...typography.caption },
  name: { ...typography.h2, marginTop: 2 },
  avatarRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h3 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { ...typography.h3 },
  statLabel: { ...typography.caption, marginTop: 2, textAlign: 'center' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { ...typography.h3 },
  seeAll: { ...typography.bodySmall },
  lectureCard: { padding: 0, marginBottom: 16 },
  thumbWrap: { position: 'relative' },
  thumb: { width: '100%', height: 190 },
  thumbImage: { borderRadius: 0 },
  thumbTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  progressDot: { width: 6, height: 6, borderRadius: 3 },
  progressText: { ...typography.caption, fontWeight: '700' },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  durationText: { color: '#FFFFFF', ...typography.caption },
  thumbBottomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  playGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8EF0A3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8EF0A3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  thumbMeta: { flex: 1 },
  thumbChannel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  thumbTitle: { ...typography.bodySemi, color: '#FFFFFF', marginTop: 2 },
  lectureMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  channelDot: { width: 6, height: 6, borderRadius: 3 },
  lectureDate: { ...typography.caption },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    borderRadius: 32,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 32,
  },
  fabText: { ...typography.bodySemi },
});