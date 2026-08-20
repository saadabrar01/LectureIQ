import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { onboardingPalette, onboardingMetrics } from '../../theme/onboarding';
import { typography } from '../../theme/typography';

/**
 * The hero visual shown on each onboarding slide.
 * Composition (centered, layered):
 *   - A large organic gradient "shape" with an icon badge (the focal point)
 *   - Small glass "mini cards" around it that communicate the product
 *     (e.g. video player, chat bubbles, quiz, library) without clutter.
 * Intentionally no floating text badges — keeps the scene clean.
 */

export type MiniKind = 'video' | 'chat' | 'input' | 'timestamp' | 'quiz' | 'library';

export interface HeroMini {
  kind: MiniKind;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  rotate?: number;
  delay?: number;
}

// Small labeled feature badge floating around the hero shape
// (e.g. "AI Q&A", "Transcript ready") — product storytelling chips.
export interface HeroBadge {
  icon: string;
  label: string;
  color: string;
  top: number;
  left?: number;
  right?: number;
  rotate?: number;
  delay?: number;
}

export interface HeroConfig {
  gradient: readonly [string, string];
  icon: string;
  iconColor: string;
  wave?: boolean;
  minis: HeroMini[];
  badges?: HeroBadge[];
}

const MINI_DEFAULTS: Record<MiniKind, Required<Pick<HeroMini, 'top' | 'left' | 'right' | 'bottom' | 'rotate' | 'delay'>>> = {
  video: { top: 12, left: 2, right: undefined as never, bottom: undefined as never, rotate: -7, delay: 150 },
  chat: { top: undefined as never, left: undefined as never, right: 0, bottom: 8, rotate: 5, delay: 250 },
  input: { top: 10, left: 0, right: undefined as never, bottom: undefined as never, rotate: -7, delay: 150 },
  timestamp: { top: undefined as never, left: undefined as never, right: 2, bottom: 10, rotate: 5, delay: 250 },
  quiz: { top: 14, left: 4, right: undefined as never, bottom: undefined as never, rotate: -5, delay: 150 },
  library: { top: undefined as never, left: undefined as never, right: 0, bottom: 12, rotate: 5, delay: 250 },
};

export function OnboardingHero({ config, scale = 1 }: { config: HeroConfig; scale?: number }) {
  return (
    <View style={{ width: onboardingMetrics.stageW * scale, height: onboardingMetrics.stageH * scale }}>
      <View style={[styles.stage, { transform: [{ scale }] }]}>
        {config.minis.map((mini, i) => (
          <MiniCard key={`${mini.kind}-${i}`} mini={mini} />
        ))}
        <MainShape config={config} />
        {config.badges?.map((badge, i) => (
          <FeatureBadge key={`${badge.label}-${i}`} badge={badge} />
        ))}
      </View>
    </View>
  );
}

function MainShape({ config }: { config: HeroConfig }) {
  return (
    <View style={styles.shapeGlow}>
      <View style={styles.shapeUnderlay} />
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.shape}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
          style={styles.shapeHighlight}
        />
        {config.wave ? <WaveBars /> : null}
      </LinearGradient>
      <View style={[styles.iconRing]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.96)', '#EAF4EC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBadge}
        >
          <MaterialIcons name={config.icon as never} size={38} color={config.iconColor} />
        </LinearGradient>
      </View>
    </View>
  );
}

function WaveBars() {
  const bars = [10, 17, 24, 19, 12, 21, 13];
  return (
    <View style={styles.waveRow}>
      {bars.map((h, i) => (
        <WaveBar key={i} height={h} delay={i * 110} />
      ))}
    </View>
  );
}

function WaveBar({ height, delay }: { height: number; delay: number }) {
  const s = useSharedValue(0.55);

  useEffect(() => {
    s.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 620 }),
          withTiming(0.55, { duration: 620 })
        ),
        -1,
        true
      )
    );
    return () => {
      s.value = 0.55;
    };
  }, [delay, s]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: s.value }],
  }));

  return (
    <Animated.View style={[styles.waveBar, { height }, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.35)']}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function MiniCard({ mini }: { mini: HeroMini }) {  const d = MINI_DEFAULTS[mini.kind];
  const top = mini.top ?? d.top;
  const left = mini.left ?? d.left;
  const right = mini.right ?? d.right;
  const bottom = mini.bottom ?? d.bottom;
  const rotate = mini.rotate ?? d.rotate;
  const delay = mini.delay ?? d.delay;

  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 1700 }),
          withTiming(0, { duration: 1700 })
        ),
        -1,
        true
      )
    );
    return () => {
      y.value = 0;
    };
  }, [delay, y]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rotate}deg` }],
  }));

  return (
    <Animated.View
      entering={undefined}
      style={[styles.miniWrap, floatStyle, { top, left, right, bottom, position: 'absolute' }]}
    >
      <BlurView intensity={28} tint="dark" style={styles.miniBlur}>
        <MiniBody kind={mini.kind} />
      </BlurView>
    </Animated.View>
  );
}

function FeatureBadge({ badge }: { badge: HeroBadge }) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      badge.delay ?? 200,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 1800 }),
          withTiming(0, { duration: 1800 })
        ),
        -1,
        true
      )
    );
    return () => {
      y.value = 0;
    };
  }, [badge.delay, y]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${badge.rotate ?? 0}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.badgeWrap,
        floatStyle,
        {
          top: badge.top,
          left: badge.left,
          right: badge.right,
          position: 'absolute',
        },
      ]}
    >
      <View style={styles.badge}>
        <MaterialIcons name={badge.icon as never} size={13} color={badge.color} />
        <Text style={styles.badgeLabel}>{badge.label}</Text>
      </View>
    </Animated.View>
  );
}

function MiniBody({ kind }: { kind: MiniKind }) {
  switch (kind) {
    case 'video':
      return <VideoMini />;
    case 'chat':
      return <ChatMini />;
    case 'input':
      return <InputMini />;
    case 'timestamp':
      return <TimestampMini />;
    case 'quiz':
      return <QuizMini />;
    case 'library':
      return <LibraryMini />;
  }
}

function VideoMini() {
  return (
    <View style={[styles.card, styles.videoCard]}>
      <View style={styles.videoThumb}>
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.playCircle}>
          <MaterialIcons name="play-arrow" size={15} color={onboardingPalette.accentDeep} />
        </View>
      </View>
      <View style={styles.videoBody}>
        <View style={[styles.line, styles.lineW60]} />
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[onboardingPalette.primary, onboardingPalette.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </View>
      </View>
    </View>
  );
}

function ChatMini() {
  return (
    <View style={[styles.card, styles.chatCard]}>
      <View style={styles.chatAi}>
        <View style={styles.chatAiDot} />
        <Text style={styles.chatAiText}>Weights learn patterns…</Text>
      </View>
      <View style={styles.chatUser}>
        <Text style={styles.chatUserText}>explain again?</Text>
      </View>
    </View>
  );
}

function InputMini() {
  return (
    <View style={[styles.card, styles.inputCard]}>
      <MaterialIcons name="keyboard" size={14} color={onboardingPalette.muted} />
      <Text style={styles.inputText}>Ask anything…</Text>
      <View style={styles.inputMic}>
        <MaterialIcons name="mic" size={12} color={onboardingPalette.rose} />
      </View>
    </View>
  );
}

function TimestampMini() {
  return (
    <View style={[styles.card, styles.timestampCard]}>
      <View style={styles.timestampPlay}>
        <MaterialIcons name="play-arrow" size={13} color={onboardingPalette.primary} />
      </View>
      <View>
        <Text style={styles.timestampTime}>0:42</Text>
        <Text style={styles.timestampCap}>AI answered here</Text>
      </View>
    </View>
  );
}

function QuizMini() {
  return (
    <View style={[styles.card, styles.quizCard]}>
      <View style={styles.quizRow}>
        <View style={styles.quizQ}>
          <MaterialIcons name="quiz" size={12} color={onboardingPalette.amber} />
        </View>
        <Text style={styles.quizTitle}>Quiz ready</Text>
        <Text style={styles.quizMeta}>· 5 Qs</Text>
      </View>
      <LinearGradient
        colors={[onboardingPalette.amber, 'rgba(251,191,36,0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.quizTrack}
      />
    </View>
  );
}

function LibraryMini() {
  return (
    <View style={[styles.card, styles.libraryCard]}>
      <View style={styles.libraryThumbs}>
        {['rgba(142,240,163,0.4)', 'rgba(159,143,240,0.45)', 'rgba(63,201,167,0.4)'].map((c, i) => (
          <View key={i} style={[styles.libraryThumb, { backgroundColor: c }]} />
        ))}
      </View>
      <View>
        <Text style={styles.libraryTitle}>Lecture Library</Text>
        <Text style={styles.libraryMeta}>12 saved</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: onboardingMetrics.stageW,
    height: onboardingMetrics.stageH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeGlow: {
    width: 252,
    height: 252,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: onboardingPalette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 42,
    elevation: 16,
  },
  shape: {
    width: 240,
    height: 240,
    borderRadius: onboardingMetrics.radiusShape,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  shapeUnderlay: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: onboardingMetrics.radiusShape,
    backgroundColor: 'rgba(5,9,7,0.6)',
    transform: [{ translateY: 12 }],
  },
  shapeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: onboardingMetrics.radiusShape,
    borderTopRightRadius: onboardingMetrics.radiusShape,
  },
  iconRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  waveRow: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 6,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  miniWrap: {
    borderRadius: onboardingMetrics.radiusCard,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 9,
  },
  miniBlur: { borderRadius: onboardingMetrics.radiusCard },
  badgeWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: onboardingPalette.borderStrong,
  },
  badgeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    color: onboardingPalette.text,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: onboardingPalette.borderStrong,
    borderRadius: onboardingMetrics.radiusCard,
  },
  videoCard: { width: 134, height: 86 },
  videoThumb: {
    height: 50,
    borderTopLeftRadius: onboardingMetrics.radiusCard - 1,
    borderTopRightRadius: onboardingMetrics.radiusCard - 1,
    backgroundColor: 'rgba(8,12,10,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: onboardingPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBody: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  line: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)' },
  lineW60: { width: '62%' },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: { width: '64%', height: 4, borderRadius: 2 },
  chatCard: { width: 160, height: 62, padding: 8, gap: 5 },
  chatAi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: onboardingPalette.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderBottomLeftRadius: 3,
  },
  chatAiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: onboardingPalette.accentDeep },
  chatAiText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9.5,
    color: onboardingPalette.accentDeep,
  },
  chatUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderBottomRightRadius: 3,
  },
  chatUserText: { fontFamily: 'Inter_400Regular', fontSize: 9, color: onboardingPalette.text },
  inputCard: {
    width: 174,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  inputText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 10.5,
    color: onboardingPalette.text,
    opacity: 0.75,
  },
  inputMic: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(243,169,201,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestampCard: {
    width: 158,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 11,
  },
  timestampPlay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(142,240,163,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(142,240,163,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestampTime: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12.5,
    color: onboardingPalette.primary,
    letterSpacing: 0.2,
  },
  timestampCap: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: onboardingPalette.muted,
    marginTop: 1,
  },
  quizCard: { width: 142, height: 66, padding: 11, gap: 8 },
  quizRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quizQ: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: onboardingPalette.text,
  },
  quizMeta: { fontFamily: 'Inter_400Regular', fontSize: 9, color: onboardingPalette.muted },
  quizTrack: {
    height: 5,
    borderRadius: 3,
    width: '82%',
    opacity: 0.85,
  },
  libraryCard: {
    width: 168,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  libraryThumbs: { flexDirection: 'row', gap: 4 },
  libraryThumb: {
    width: 32,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  libraryTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: onboardingPalette.text,
  },
  libraryMeta: { fontFamily: 'Inter_400Regular', fontSize: 9, color: onboardingPalette.muted, marginTop: 1 },
});