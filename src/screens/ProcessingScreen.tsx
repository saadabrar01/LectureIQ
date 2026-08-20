import React, { useEffect, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { processingSteps, lectures } from '../data/mock';
import { haptics } from '../utils/helpers';
import { GlowBackground } from '../components/GlowBackground';

export function ProcessingScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const progress = useSharedValue(0);
  const done = step >= processingSteps.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => {
        if (s >= processingSteps.length) {
          clearInterval(interval);
          return s;
        }
        if (s === processingSteps.length - 2) {
          haptics.success();
        }
        return s + 1;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!done) {
      progress.value = withTiming((step + 1) / processingSteps.length, { duration: 1300 });
    }
  }, [step, done, progress]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        const first = lectures.find((l) => l.status === 'processing') ?? lectures[0];
        (navigation as any).replace('LectureDetail', { lectureId: first.id });
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [done, navigation]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!done) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [done, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <GlowBackground>
    <View style={styles.container}>
      <View style={[styles.center, { paddingTop: insets.top + 30 }]}>
        <Animated.View style={pulseStyle}>
          <View
            style={[styles.iconCircle, { backgroundColor: done ? theme.primary : theme.surfaceAlt }]}
          >
            {done ? (
              <MaterialIcons name="check" size={52} color={theme.primaryDeep} />
            ) : (
              <MaterialIcons name="auto-fix-high" size={48} color={theme.secondary} />
            )}
          </View>
        </Animated.View>

        <Animated.Text entering={FadeIn.duration(400)} style={[styles.title, { color: theme.textPrimary }]}>
          {done ? 'Lecture ready!' : 'Processing your lecture'}
        </Animated.Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {done
            ? 'Your transcript is indexed. You can now ask questions.'
            : 'This usually takes under a minute.'}
        </Text>

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

        <View style={styles.steps}>
          {processingSteps.map((s, i) => {
            const isActive = i === step && !done;
            const isDone = i < step;
            return (
              <Animated.View
                key={s}
                entering={FadeInDown.delay(i * 90).duration(400)}
                style={[styles.stepRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
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
                    <MaterialIcons name="radio-button-unchecked" size={16} color={theme.textSecondary} />
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
      </View>
    </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 24, maxWidth: 900, width: '100%', alignSelf: 'center' },
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