import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { GlassCard } from '../components/GlassCard';
import { FadeUp } from '../components/FadeUp';
import { Header } from '../components/Header';
import { userProfile } from '../data/mock';
import { haptics } from '../utils/helpers';

const STAT_META = [
  { label: 'Videos', value: 'videos', icon: 'video-library' as const, color: '#35D47A' },
  { label: 'Questions', value: 'questions', icon: 'question-answer' as const, color: '#38CFA8' },
  { label: 'Streak', value: 'streak', icon: 'local-fire-department' as const, color: '#8EA6E8' },
  { label: 'Minutes', value: 'minutes', icon: 'timer' as const, color: '#22C55E' },
];

export function ProfileScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const statValues: Record<string, string> = {
    videos: String(userProfile.videosProcessed),
    questions: String(userProfile.questionsAsked),
    streak: `${userProfile.streak}d`,
    minutes: String(userProfile.minutesWatched),
  };

  const logout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of LectureIQ?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            haptics.medium();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const menuRow = (
    icon: string,
    color: string,
    title: string,
    desc: string,
    onPress: () => void
  ) => (
    <GlassCard onPress={onPress} style={styles.menuCard} blur={14}>
      <View style={[styles.menuIcon, { backgroundColor: color + '26' }]}>
        <MaterialIcons name={icon as never} size={20} color={color} />
      </View>
      <View style={styles.menuBody}>
        <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.menuDesc, { color: theme.textSecondary }]}>{desc}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
    </GlassCard>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Profile"
        subtitle="Your account"
        back
        onBack={() => navigation.navigate('Home' as never)}
      />

      <FadeUp index={0}>
        <View
          style={[
            styles.banner,
            {
              shadowColor: theme.lavender,
              borderColor: theme.glassBorder,
            },
          ]}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bannerInner}>
            <View style={styles.avatarOuter}>
              <LinearGradient
                colors={['#FFFFFF', '#F2F5F2']}
                style={styles.avatarRing}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{userProfile.avatar}</Text>
                </View>
              </LinearGradient>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
              <View style={styles.joinBadge}>
                <MaterialIcons name="calendar-today" size={12} color="#FFFFFF" />
                <Text style={styles.joinText}>Joined {userProfile.joinDate}</Text>
              </View>
            </View>
            <Pressable onPress={() => haptics.light()} style={styles.editBtn}>
              <MaterialIcons name="edit" size={18} color="#1A1A1A" />
            </Pressable>
          </View>
        </View>
      </FadeUp>

      <View style={styles.statsGrid}>
        {STAT_META.map((s, i) => (
          <View key={s.label} style={styles.statCell}>
            <FadeUp index={i + 1}>
              <View style={styles.statCard}>
                <BlurView
                  intensity={24}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.statIcon, { backgroundColor: s.color + '1F' }]}>
                  <MaterialIcons name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={styles.statValue}>{statValues[s.value]}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </FadeUp>
          </View>
        ))}
      </View>

      <FadeUp index={3}>
        <View style={styles.menuGroup}>
          {menuRow('settings', theme.primaryDark, 'Settings', 'Appearance, language & notifications', () =>
            navigation.navigate('Settings')
          )}
          {menuRow('library-books', theme.primary, 'Library', 'Your documents and lectures', () =>
            navigation.navigate('Library')
          )}
          {menuRow('help-outline', theme.secondary, 'Help & Support', 'FAQ, tutorials and contact', () => haptics.light())}
        </View>
      </FadeUp>

      <FadeUp index={4}>
        <Pressable onPress={logout} style={[styles.logoutBtn, { backgroundColor: theme.coral + '1F' }]}>
          <MaterialIcons name="logout" size={20} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Log out</Text>
        </Pressable>
      </FadeUp>

      <Text style={[styles.version, { color: theme.textSecondary }]}>
        LectureIQ v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    // profile surface: centered max-w-6xl column clear of the dock
    paddingHorizontal: 28,
    paddingBottom: 110,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  banner: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    backgroundColor: 'rgba(11,15,14,0.35)',
  },
  avatarOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  avatarRing: { flex: 1, borderRadius: 34, padding: 2 },
  avatarCircle: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: '#8EF0A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: '#06281A' },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, color: '#FFFFFF' },
  profileEmail: { ...typography.bodySmall, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  joinText: { ...typography.caption, color: '#FFFFFF' },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
    marginBottom: 6,
  },
  statCell: {
    flex: 1,
    minWidth: 148,
  },
  statCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(37,31,50,0.72)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    ...typography.h3,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
  },
  menuGroup: { marginTop: 14, gap: 12 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: { flex: 1 },
  menuTitle: { ...typography.bodySemi },
  menuDesc: { ...typography.caption, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.25)',
  },
  logoutText: { ...typography.bodySemi },
  version: { ...typography.caption, textAlign: 'center', marginTop: 20 },
});