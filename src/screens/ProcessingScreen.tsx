import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { haptics } from '../utils/helpers';
import { GlowBackground } from '../components/GlowBackground';
import { AppButton } from '../components/AppButton';
import { lecturesApi, LectureItem } from '../services/api';

const processingSteps = [
  'Connecting to YouTube API...',
  'Extracting lecture transcript & timestamps...',
  'Splitting transcript into semantic chunks...',
  'Generating AI vector embeddings...',
  'Indexing lecture into pgvector database...',
];

export function ProcessingScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { url } = (route.params as { url?: string }) || {};

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createdLecture, setCreatedLecture] = useState<LectureItem | null>(null);
  const progress = useSharedValue(0.15);
  const done = step >= processingSteps.length;

  useEffect(() => {
    let isMounted = true;

    async function processLecture() {
      if (!url) {
        setError('No video URL was provided.');
        return;
      }

      // Step 1: Starting
      setStep(0);
      progress.value = withTiming(0.2, { duration: 800 });

      try {
        // Step 2: Transcript extraction simulated progress
        setTimeout(() => {
          if (isMounted) {
            setStep(1);
            progress.value = withTiming(0.45, { duration: 1000 });
          }
        }, 1200);

        setTimeout(() => {
          if (isMounted) {
            setStep(2);
            progress.value = withTiming(0.7, { duration: 1000 });
          }
        }, 2500);

        setTimeout(() => {
          if (isMounted) {
            setStep(3);
            progress.value = withTiming(0.85, { duration: 1000 });
          }
        }, 3800);

        // Real API call
        const lecture = await lecturesApi.importYouTube(url);

        if (!isMounted) return;

        setCreatedLecture(lecture);
        setStep(processingSteps.length);
        progress.value = withTiming(1, { duration: 500 });
        haptics.success();

        setTimeout(() => {
          if (isMounted) {
            (navigation as any).replace('LectureDetail', { lectureId: lecture.id });
          }
        }, 1200);
      } catch (err: any) {
        if (!isMounted) return;
        haptics.warning();
        setError(err.message || 'Failed to process YouTube video. Please try again.');
      }
    }

    processLecture();

    return () => {
      isMounted = false;
    };
  }, [url]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!done && !error) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [done, error, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <GlowBackground>
      <View style={styles.container}>
        <View style={[styles.center, { paddingTop: insets.top + 30 }]}>
          <Animated.View style={pulseStyle}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: error
                    ? 'rgba(255,107,107,0.15)'
                    : done
                    ? theme.primary
                    : theme.surfaceAlt,
                },
              ]}
            >
              {error ? (
                <MaterialIcons name="error-outline" size={52} color="#FF6B6B" />
              ) : done ? (
                <MaterialIcons name="check" size={52} color={theme.primaryDeep} />
              ) : (
                <MaterialIcons name="auto-fix-high" size={48} color={theme.secondary} />
              )}
            </View>
          </Animated.View>

          <Animated.Text
            entering={FadeIn.duration(400)}
            style={[styles.title, { color: theme.textPrimary }]}
          >
            {error
              ? 'Processing Failed'
              : done
              ? 'Lecture Ready!'
              : 'Processing your video'}
          </Animated.Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {error
              ? error
              : done
              ? 'Your video transcript is indexed. Opening lecture...'
              : 'Extracting transcript, timestamps & AI vectors...'}
          </Text>

          {!error && (
            <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: done ? theme.primary : theme.secondary,
                  },
                  fillStyle,
                ]}
              />
            </View>
          )}

          {error ? (
            <View style={{ marginTop: 24, width: '100%', maxWidth: 300 }}>
              <AppButton
                title="Go Back"
                variant="outline"
                onPress={() => navigation.goBack()}
              />
            </View>
          ) : (
            <View style={styles.steps}>
              {processingSteps.map((s, i) => {
                const isActive = i === step && !done;
                const isDone = i < step || done;
                return (
                  <Animated.View
                    key={s}
                    entering={FadeInDown.delay(i * 90).duration(400)}
                    style={[
                      styles.stepRow,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.stepIcon,
                        {
                          backgroundColor: isDone
                            ? theme.primary
                            : isActive
                            ? theme.secondary
                            : theme.surfaceAlt,
                        },
                      ]}
                    >
                      {isDone ? (
                        <MaterialIcons name="check" size={16} color={theme.primaryDeep} />
                      ) : isActive ? (
                        <View style={styles.spinner} />
                      ) : (
                        <MaterialIcons
                          name="radio-button-unchecked"
                          size={16}
                          color={theme.textSecondary}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepText,
                        {
                          color: isDone
                            ? theme.textPrimary
                            : isActive
                            ? theme.textPrimary
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {s}
                    </Text>
                    <Text
                      style={[
                        styles.stepState,
                        {
                          color: isDone
                            ? theme.primaryDark
                            : isActive
                            ? theme.secondary
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {isDone ? 'Done' : isActive ? 'Now' : 'Queued'}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { ...typography.h2, marginBottom: 6, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', color: '#6B7280', marginBottom: 28 },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  steps: { width: '100%', marginTop: 20, gap: 10 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { ...typography.body, flex: 1 },
  stepState: { ...typography.caption },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderTopColor: '#FFFFFF',
  },
});