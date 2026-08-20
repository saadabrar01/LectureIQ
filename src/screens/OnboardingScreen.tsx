import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { typography } from '../theme/typography';
import { onboardingPalette, onboardingMetrics } from '../theme/onboarding';
import { OnboardingHero, type HeroConfig } from '../components/onboarding/OnboardingHero';
import { ProgressDots } from '../components/onboarding/ProgressDots';
import { PrimaryCta } from '../components/onboarding/PrimaryCta';
import { StepPills } from '../components/onboarding/StepPills';
import { haptics } from '../utils/helpers';
import type { RootStackParamList } from '../navigation/types';

/**
 * OnboardingScreen
 * ----------------
 * Three swipeable slides sharing one glass surface and the same
 * visual language as Login/Signup (charcoal + mint/teal, ambient
 * glows, tokens from theme/onboarding).
 *
 * Layout:
 *   top bar  → brand · step pills (desktop/tablet) · Skip
 *   content  → wide screens: two-column (large hero left, text right)
 *              small screens: stacked (hero → text)
 *   footer   → progress dots (left) + primary CTA (right)
 */

interface Slide {
  title: string;
  desc: string;
  hero: HeroConfig;
}

const SLIDES: Slide[] = [
  {
    title: 'Turn any lecture into a smart chat',
    desc: 'Paste a YouTube link — LectureIQ reads the whole video and lets you chat with everything in it.',
    hero: {
      gradient: ['#8EF0A3', '#22C55E'],
      icon: 'smart-display',
      iconColor: onboardingPalette.accentDeep,
      minis: [
        { kind: 'video' },
        { kind: 'chat' },
      ],
      badges: [
        { icon: 'auto-awesome', label: 'AI Q&A', color: onboardingPalette.primary, top: 120, left: 6, rotate: -4 },
        { icon: 'description', label: 'Transcript', color: onboardingPalette.lavender, top: 148, right: 4, rotate: 4, delay: 220 },
      ],
    },
  },
  {
    title: 'Ask by typing or just speak',
    desc: 'Type or tap the mic and talk naturally. Answers come back with exact timestamps in the video.',
    hero: {
      gradient: ['#8EF0A3', '#3FC9A7'],
      icon: 'mic',
      iconColor: '#0B3D33',
      wave: true,
      minis: [
        { kind: 'input' },
        { kind: 'timestamp' },
      ],
      badges: [
        { icon: 'mic', label: 'Tap to talk', color: onboardingPalette.rose, top: 120, left: 6, rotate: -4 },
        { icon: 'access-time', label: '0:42 · answered', color: onboardingPalette.primary, top: 150, right: 4, rotate: 4, delay: 220 },
      ],
    },
  },
  {
    title: 'Add notes, build your library',
    desc: 'Save highlights, link notes to lectures, and generate quizzes to lock in what you learn.',
    hero: {
      gradient: ['#8EF0A3', '#9F8FF0'],
      icon: 'sticky-note-2',
      iconColor: '#26224A',
      minis: [
        { kind: 'quiz' },
        { kind: 'library' },
      ],
      badges: [
        { icon: 'sticky-note-2', label: 'Linked notes', color: onboardingPalette.amber, top: 120, left: 6, rotate: -4 },
        { icon: 'quiz', label: 'Quiz generated', color: onboardingPalette.lavender, top: 150, right: 4, rotate: 4, delay: 220 },
      ],
    },
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Onboarding'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = width < 380;
  const wide = width >= 760;
  const showPills = width >= 520;
  const initial = route.params?.initialSlide ?? 0;
  const [page, setPage] = useState(initial);
  const listRef = useRef<FlatList>(null);

  const last = page === SLIDES.length - 1;

  // Card sized from the viewport: wide screens get a large two-column
  // surface, small screens a focused stacked card. Hero scales to fit.
  const cardMaxW = wide ? 1000 : 640;
  const cardW = Math.min(width - 40, cardMaxW);
  const slideW = cardW - 48;
  const cardMaxH = Math.min(height - 48, wide ? 840 : 720);
  const heroScale = Math.max(
    0.55,
    Math.min(
      wide ? 1.5 : 1.02,
      wide
        ? (slideW * 0.52) / onboardingMetrics.stageW
        : (slideW - 20) / onboardingMetrics.stageW,
      (cardMaxH - (wide ? 250 : 320)) / onboardingMetrics.stageH
    )
  );

  useEffect(() => {
    const target = route.params?.initialSlide;
    if (target !== undefined && target !== page) {
      setPage(target);
      listRef.current?.scrollToIndex({ index: target, animated: true });
    }
  }, [route.params?.initialSlide]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems.find((v) => v.isViewable)?.index;
      if (idx !== undefined && idx !== null && idx !== route.params?.initialSlide) {
        setPage(idx);
        navigation.setParams({ initialSlide: idx });
      }
    }
  ).current;

  const goToNext = () => {
    haptics.light();
    if (last) {
      navigation.navigate('Login');
    } else {
      listRef.current?.scrollToIndex({ index: page + 1, animated: true });
    }
  };

  const jumpTo = (index: number) => {
    haptics.light();
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  const skipToLogin = () => {
    haptics.medium();
    navigation.navigate('Login');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width: slideW }, wide && styles.slideWide]}>
      {/* Hero visual — keyed by page so it re-animates on each slide */}
      <View style={wide ? styles.heroZoneWide : styles.heroZoneStacked}>
        <Animated.View key={`hero-${page}`} entering={FadeIn.duration(430)}>
          <OnboardingHero config={item.hero} scale={heroScale} />
        </Animated.View>
      </View>

      {/* Headline + description */}
      <View style={wide ? styles.textZoneWide : styles.textZoneStacked}>
        <Animated.View key={`text-${page}`} entering={FadeInDown.duration(460)}>
          <Text style={[styles.title, compact && styles.titleCompact, wide && styles.titleWide]}>
            {item.title}
          </Text>
          <Text style={[styles.desc, compact && styles.descCompact, wide && styles.descWide]}>
            {item.desc}
          </Text>
        </Animated.View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={[onboardingPalette.bgDeep, onboardingPalette.bgSoft, onboardingPalette.bgDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.background}
    >
      {/* Soft ambient radial glows (mint / teal / lavender) */}
      <View style={styles.ambient}>
        <LinearGradient
          colors={['rgba(142,240,163,0.13)', 'rgba(142,240,163,0)']}
          style={[styles.ambientGlow, styles.ambientMint]}
        />
        <LinearGradient
          colors={['rgba(34,197,94,0.1)', 'rgba(34,197,94,0)']}
          style={[styles.ambientGlow, styles.ambientTeal]}
        />
        <LinearGradient
          colors={['rgba(159,143,240,0.09)', 'rgba(159,143,240,0)']}
          style={[styles.ambientGlow, styles.ambientLavender]}
        />
      </View>

      {/* Centered container: keeps the surface focused with a max width */}
      <View
        style={[
          styles.centerWrap,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 14 },
        ]}
      >
        <Animated.View
          entering={FadeInDown.duration(480)}
          style={[styles.card, { maxWidth: cardMaxW, maxHeight: cardMaxH }]}
        >
          {/* Top bar: brand (left) · step pills (center) · Skip (right) */}
          <View style={styles.topBar}>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[onboardingPalette.primary, onboardingPalette.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoTile}
              >
                <MaterialIcons name="auto-awesome" size={16} color={onboardingPalette.accentDeep} />
              </LinearGradient>
              <Text style={styles.logoName}>LectureIQ</Text>
            </View>

            {showPills ? (
              <View style={styles.pillsWrap}>
                <StepPills steps={['Chat', 'Voice', 'Notes']} active={page} onPress={jumpTo} />
              </View>
            ) : null}

            <View style={styles.skipWrap}>
              <Pressable
                onPress={skipToLogin}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.skip,
                  pressed && { backgroundColor: 'rgba(255,255,255,0.07)', opacity: 0.75 },
                ]}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            </View>
          </View>

          {/* Swipeable slides */}
          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initial}
            getItemLayout={(_, index) => ({
              length: slideW,
              offset: slideW * index,
              index,
            })}
            viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
            onViewableItemsChanged={onViewableItemsChanged}
            renderItem={renderSlide}
          />

          {/* Footer: progress dots (left) + primary CTA (right) */}
          <View style={styles.footer}>
            <ProgressDots count={SLIDES.length} active={page} />
            <PrimaryCta
              label={last ? 'Get Started' : 'Next'}
              icon={last ? 'sparkle' : 'arrow'}
              onPress={goToNext}
            />
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  ambient: { ...StyleSheet.absoluteFill },
  ambientGlow: { position: 'absolute', borderRadius: 999 },
  ambientMint: { top: -160, left: -130, width: 440, height: 400 },
  ambientTeal: { top: '32%', right: -150, width: 380, height: 360 },
  ambientLavender: { bottom: -190, left: '28%', width: 460, height: 420 },
  // Centers the card both horizontally and vertically
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  // The glass surface that holds all onboarding content
  card: {
    width: '100%',
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: onboardingPalette.borderStrong,
    backgroundColor: onboardingPalette.cardStrong,
    paddingHorizontal: 24,
    paddingTop: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoTile: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: onboardingPalette.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
    color: onboardingPalette.text,
  },
  pillsWrap: { flex: 1, alignItems: 'center' },
  skipWrap: { flex: 1, alignItems: 'flex-end' },
  skip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: onboardingPalette.muted,
  },
  slide: { flex: 1 },
  slideWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 52,
  },
  heroZoneStacked: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  heroZoneWide: { flex: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  textZoneStacked: {
    alignItems: 'center',
    minHeight: 156,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  textZoneWide: {
    width: 400,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: onboardingPalette.text,
    textAlign: 'center',
    maxWidth: 380,
  },
  titleCompact: { fontSize: 25, lineHeight: 29 },
  titleWide: {
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'left',
    maxWidth: 380,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: onboardingPalette.muted,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 380,
  },
  descCompact: { fontSize: 14, lineHeight: 22, maxWidth: 360 },
  descWide: { textAlign: 'left', maxWidth: 380, lineHeight: 25 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingTop: 8,
  },
});
