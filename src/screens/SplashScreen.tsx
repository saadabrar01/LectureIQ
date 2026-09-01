import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { typography } from '../theme/typography';
import { onboardingPalette } from '../theme/onboarding';
import { loadToken } from '../services/api';

export function SplashScreen() {
  const navigation = useNavigation();
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 900 });
    opacity.value = withTiming(1, { duration: 900 });
    const timer = setTimeout(async () => {
      const token = await loadToken();
      navigation.navigate(token ? 'Main' : 'Onboarding');
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigation, scale, opacity]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <LinearGradient
      colors={[onboardingPalette.bgDeep, onboardingPalette.bgSoft, onboardingPalette.bgDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.ambient}>
        <LinearGradient
          colors={['rgba(142,240,163,0.13)', 'rgba(142,240,163,0)']}
          style={[styles.glow, styles.glowMint]}
        />
        <LinearGradient
          colors={['rgba(159,143,240,0.1)', 'rgba(159,143,240,0)']}
          style={[styles.glow, styles.glowLavender]}
        />
      </View>

      <Animated.View style={logoStyle}>
        <LinearGradient
          colors={[onboardingPalette.primary, onboardingPalette.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoTile}
        >
          <MaterialIcons name="auto-awesome" size={42} color={onboardingPalette.accentDeep} />
        </LinearGradient>
      </Animated.View>
      <Animated.Text
        entering={FadeInDown.delay(350).duration(700)}
        style={styles.title}
      >
        LectureIQ
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(600).duration(700)} style={styles.tagline}>
        Learn Smarter with AI
      </Animated.Text>
      <Animated.View entering={FadeIn.delay(850).duration(600)} style={styles.loader}>
        <View style={styles.loaderDot} />
        <View style={[styles.loaderDot, styles.dot2]} />
        <View style={[styles.loaderDot, styles.dot3]} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ambient: { ...StyleSheet.absoluteFill },
  glow: { position: 'absolute', borderRadius: 999 },
  glowMint: { top: -160, left: -120, width: 420, height: 380 },
  glowLavender: { bottom: -180, right: -140, width: 440, height: 400 },
  logoTile: {
    width: 98,
    height: 98,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: onboardingPalette.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 26,
    elevation: 12,
  },
  title: {
    ...typography.hero,
    color: onboardingPalette.text,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.subheading,
    color: onboardingPalette.muted,
  },
  loader: { flexDirection: 'row', gap: 6, marginTop: 12 },
  loaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: onboardingPalette.primary,
  },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.3 },
});