import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { GlowBackground } from '../components/GlowBackground';
import { GlassCard } from '../components/GlassCard';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { haptics } from '../utils/helpers';
import {
  authApi,
  setToken,
  type AuthUser,
} from '../services/api';

// ---------------------------------------------------------------------------
// Palette — neon emerald accent family on a deep blue-black base
// ---------------------------------------------------------------------------
const NEON = '#10B981';
const NEON_SOFT = '#34D399';
const TEAL = '#2DD4BF';
const SURFACE_BG = 'rgba(11, 15, 25, 0.86)'; // #0B0F19 glass
const SURFACE_BORDER = 'rgba(16, 185, 129, 0.18)';
const REF = 'rgba(255, 255, 255, 0.08)'; // hairlines inside cards

const PREF_NOTIF = 'lectureiq:prefs:notifications';
const PREF_SYNC = 'lectureiq:prefs:dataSync';

interface Accent {
  icon: string;
  color: string;
  bg: string;
}

const ICONS = {
  notify: { icon: 'notifications-none', color: '#FBBF24', bg: 'rgba(251,191,36,0.14)' } as Accent,
  theme: { icon: 'dark-mode', color: '#A78BFA', bg: 'rgba(167,139,250,0.14)' } as Accent,
  sync: { icon: 'cloud-done', color: TEAL, bg: 'rgba(45,212,191,0.14)' } as Accent,
  privacy: { icon: 'privacy-tip', color: '#9F8FF0', bg: 'rgba(159,143,240,0.14)' } as Accent,
  terms: { icon: 'description', color: '#4F9CF9', bg: 'rgba(79,156,249,0.14)' } as Accent,
  support: { icon: 'help-outline', color: NEON_SOFT, bg: 'rgba(52,211,153,0.14)' } as Accent,
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function IconBubble({ accent, size = 42 }: { accent: Accent; size?: number }) {
  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.iconBubble,
        { width: size, height: size, borderRadius: size / 2.6 },
        { backgroundColor: accent.bg, borderColor: accent.bg },
      ]}
    >
      <MaterialIcons name={accent.icon as never} size={size * 0.5} color={accent.color} />
    </LinearGradient>
  );
}

function RowDivider() {
  return <View style={[styles.divider, { backgroundColor: REF }]} />;
}

interface NavRowProps {
  accent: Accent;
  title: string;
  desc?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  last?: boolean;
}

function NavRow({ accent, title, desc, onPress, style, last }: NavRowProps) {
  const { theme } = useAppTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <Pressable
        onPress={onPress ?? (() => haptics.light())}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.row,
          (pressed || hovered) && styles.rowHover,
          pressed && styles.rowPressed,
          style,
        ]}
        hitSlop={6}
      >
        <IconBubble accent={accent} />
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{title}</Text>
          {desc ? (
            <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>{desc}</Text>
          ) : null}
        </View>
        <View style={[styles.chevronWrap, hovered && styles.chevronNudge]}>
          <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Pressable>
      {!last ? <RowDivider /> : null}
    </>
  );
}

interface ToggleRowProps {
  accent: Accent;
  title: string;
  desc?: string;
  value: boolean;
  activeColor?: string;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}

function ToggleRow({ accent, title, desc, value, activeColor, onValueChange, last }: ToggleRowProps) {
  const { theme } = useAppTheme();
  return (
    <>
      <View style={styles.row}>
        <IconBubble accent={accent} />
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{title}</Text>
          {desc ? (
            <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>{desc}</Text>
          ) : null}
        </View>
        <ToggleSwitch value={value} activeColor={activeColor} onValueChange={onValueChange} />
      </View>
      {!last ? <RowDivider /> : null}
    </>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.sectionLabelRow}>
      <LinearGradient colors={[NEON, TEAL]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sectionAccent} />
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{children}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [dataSync, setDataSync] = useState(true);

  useFocusEffect(
    useCallback(() => {
      authApi.getMe().then(setUser).catch(() => setUser(null));
    }, [])
  );

  useEffect(() => {
    (async () => {
      const [n, s] = await Promise.all([
        AsyncStorage.getItem(PREF_NOTIF),
        AsyncStorage.getItem(PREF_SYNC),
      ]);
      setNotifications(n === null ? true : n === '1');
      setDataSync(s === null ? true : s === '1');
    })();
  }, []);

  const setPref = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    AsyncStorage.setItem(key, value ? '1' : '0').catch(() => {});
  };

  const goBack = () => navigation.canGoBack() && navigation.goBack();

  const resetToLogin = async () => {
    await setToken(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleLogout = () => {
    haptics.medium();
    Alert.alert('Log out', 'Are you sure you want to log out of this account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: resetToLogin },
    ]);
  };

  const handleDeleteAccount = () => {
    haptics.warning();
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all your lectures, documents and notes. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            haptics.warning();
            resetToLogin();
          },
        },
      ]
    );
  };

  return (
    <GlowBackground>
      <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
        {/* ---------------------------------------------------------- */}
        {/* Fixed top header — back button + title */}
        {/* ---------------------------------------------------------- */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerInner}>
            <Pressable
              onPress={goBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [
                styles.backBtn,
                pressed && styles.backBtnPressed,
              ]}
            >
              <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
            </Pressable>

            <View style={styles.headerTitles}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.settingsWrapper, { flexDirection: isWide ? 'row' : 'column' }]}>
            {/* ---------------- Left column (main) ---------------- */}
            <View style={styles.leftCol}>
          {/* -------------------------------------------------------- */}
          {/* Preferences */}
          {/* -------------------------------------------------------- */}
          <SectionLabel>Preferences</SectionLabel>
          <GlassCard style={styles.group}>
            <ToggleRow
              accent={ICONS.notify}
              title="Notifications"
              desc="Remind me to review lectures"
              value={notifications}
              activeColor={NEON}
              onValueChange={(v) => setPref(PREF_NOTIF, v, setNotifications)}
            />
            <ToggleRow
              accent={ICONS.theme}
              title="Dark mode"
              desc={isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              value={isDark}
              activeColor="#A78BFA"
              onValueChange={toggleTheme}
            />
            <ToggleRow
              accent={ICONS.sync}
              title="Data sync"
              desc="Keep your data in sync across devices"
              value={dataSync}
              activeColor={TEAL}
              onValueChange={(v) => setPref(PREF_SYNC, v, setDataSync)}
              last
            />
          </GlassCard>

          {/* -------------------------------------------------------- */}
          {/* About & support */}
          {/* -------------------------------------------------------- */}
          <SectionLabel>About & support</SectionLabel>
          <GlassCard style={styles.group}>
            <NavRow
              accent={ICONS.privacy}
              title="Privacy policy"
              desc="How we handle your data"
              onPress={() => {
                haptics.light();
                Alert.alert('Privacy policy', 'Learn how LectureIQ protects your data.');
              }}
            />
            <NavRow
              accent={ICONS.terms}
              title="Terms of service"
              desc="The rules for using LectureIQ"
              onPress={() => {
                haptics.light();
                Alert.alert('Terms of service', 'Here are the terms governing your use.');
              }}
            />
            <NavRow
              accent={ICONS.support}
              title="Help & support"
              desc="FAQs, tutorials and contact"
              onPress={() => {
                haptics.light();
                Alert.alert('Help & support', 'We are here to help you learn smarter.');
              }}
              last
            />
          </GlassCard>

          {/* -------------------------------------------------------- */}
          {/* Actions */}
          {/* -------------------------------------------------------- */}
          <SectionLabel>Actions</SectionLabel>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                borderColor: 'rgba(16,185,129,0.4)',
                backgroundColor: 'rgba(16,185,129,0.08)',
              },
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 },
            ]}
          >
            <MaterialIcons name="logout" size={20} color={NEON} />
            <Text style={[styles.logoutText, { color: NEON }]}>Log out</Text>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.deleteLink,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}
          >
            <MaterialIcons name="delete-outline" size={15} color="#F87171" />
            <Text style={[styles.deleteLinkText, { color: '#F87171' }]}>Delete account</Text>
          </Pressable>

          <Text style={[styles.footer, { color: theme.textSecondary }]}>
            LectureIQ v1.0 — Learn Smarter with AI
          </Text>
            </View>

            {/* ---------------- Right column (summary) ---------------- */}
            <View
              style={[
                styles.rightCol,
                isWide && Platform.OS === 'web' && styles.rightColSticky,
              ]}
            >
              <View style={styles.summaryCard}>
                <View style={styles.summaryIconRow}>
                  <View style={styles.summaryIcon}>
                    <MaterialIcons name="bar-chart" size={18} color={NEON} />
                  </View>
                  <Text style={[styles.summaryHeading, { color: theme.textPrimary }]}>
                    Usage this month
                  </Text>
                </View>

                <View style={styles.summaryBlock}>
                  <View style={styles.progressLabelRow}>
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                      12 of 50 lectures processed
                    </Text>
                    <Text style={[styles.progressPct, { color: NEON }]}>24%</Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                    <View style={[styles.progressFill, { backgroundColor: NEON }]} />
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <View>
                    <Text style={[styles.summaryRowLabel, { color: theme.textSecondary }]}>
                      Current plan
                    </Text>
                    <Text style={[styles.planName, { color: theme.textPrimary }]}>
                      Free plan
                    </Text>
                  </View>
                  <View style={[styles.upgradeBtn, { backgroundColor: '#22C55E' }]}>
                    <Text style={[styles.upgradeText, { color: '#052811' }]}>Upgrade</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View>
                  <Text style={[styles.summaryRowLabel, { color: theme.textSecondary }]}>
                    Member since
                  </Text>
                  <Text style={[styles.summaryMeta, { color: theme.textPrimary }]}>
                    {user?.join_date || 'Jan 2026'}
                  </Text>
                </View>
              </View>

              <View style={styles.helpCard}>
                <View style={styles.helpIconRow}>
                  <View style={styles.helpIcon}>
                    <MaterialIcons name="headset-mic" size={18} color={TEAL} />
                  </View>
                  <Text style={[styles.helpTitle, { color: theme.textPrimary }]}>Need help?</Text>
                </View>
                <Text style={[styles.helpBody, { color: '#7C8B84' }]}>
                  Our team usually replies within a few hours.
                </Text>
                <Pressable
                  onPress={() => haptics.light()}
                  style={({ pressed }) => pressed && { opacity: 0.7 }}
                  hitSlop={6}
                >
                  <Text style={styles.helpLink}>Contact support →</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top header
  header: { paddingHorizontal: 24, paddingBottom: 14 },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(16,185,129,0.35)',
    backgroundColor: 'rgba(16,185,129,0.08)',
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  backBtnPressed: { transform: [{ scale: 0.92 }], opacity: 0.8 },
  headerTitles: { flex: 1 },
  headerTitle: { ...typography.h2, letterSpacing: -0.4 },
  headerSubtitle: { ...typography.caption, marginTop: 2, opacity: 0.85 },

  scroll: {
    paddingBottom: 40,
    paddingTop: 4,
    paddingHorizontal: 24,
    width: '100%',
    alignSelf: 'center',
  },

  // Layout — two-column grid on wide screens, single column on narrow
  settingsWrapper: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    gap: 32,
  },
  leftCol: {
    flexBasis: 720,
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
  },
  rightCol: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'flex-start',
  },
  // Web-only: pins the right column in view while the left column scrolls.
  // `position: sticky` is unsupported in RN's typings and on native, so it is
  // applied only on the web platform via a spread below.
  rightColSticky: {
    position: 'sticky',
    top: 24,
  } as never,

  // Profile header
  profileWrap: {
    marginHorizontal: 20,
    borderRadius: 28,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
    elevation: 8,
  },
  profileCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 6,
  },
  profileAccent: { height: 3 },
  profileInner: { backgroundColor: SURFACE_BG },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 7,
  },
  avatarImg: { flex: 1, borderRadius: 34, width: undefined },
  avatarFallback: {
    flex: 1,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 16, 12, 0.9)',
  },
  avatarInitials: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: NEON,
  },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, letterSpacing: -0.3 },
  profileEmail: { ...typography.caption, marginTop: 3, opacity: 0.9 },
  profileBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  planBadgeText: {
    ...typography.caption,
    color: '#7C8B84',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NEON },
  badgeText: {
    ...typography.caption,
    color: NEON_SOFT,
    fontFamily: 'Inter_600SemiBold',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    padding: 1.5,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  editBtnInner: {
    flex: 1,
    borderRadius: 11.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,25,0.35)',
  },

  // Grouped cards
  group: { marginHorizontal: 20, paddingVertical: 4 },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionAccent: {
    width: 3,
    height: 13,
    borderRadius: 2,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  sectionLabel: {
    ...typography.caption,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  rowPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  rowHover: {
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodySemi },
  rowDesc: { ...typography.caption, marginTop: 2, opacity: 0.85 },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronNudge: {
    transform: [{ translateX: 3 }],
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
    marginRight: 16,
  },

  // Actions
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  logoutText: { ...typography.buttonSmall, fontFamily: 'Poppins_600SemiBold' },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteLinkText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },

  // Right summary panel
  summaryCard: {
    backgroundColor: '#111A16',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    gap: 18,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  summaryHeading: { ...typography.bodySemi, fontSize: 16, fontWeight: '700' },
  summaryBlock: { gap: 8 },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: { ...typography.caption, fontSize: 13 },
  progressPct: { ...typography.caption, fontSize: 13, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '24%',
    borderRadius: 4,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRowLabel: { ...typography.caption, fontSize: 12, marginBottom: 4 },
  planName: { ...typography.bodySemi, fontSize: 15, fontWeight: '700' },
  upgradeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeText: { ...typography.caption, fontSize: 13, fontWeight: '700' },
  summaryMeta: { ...typography.bodySemi, fontSize: 15 },

  // Help card
  helpCard: {
    backgroundColor: '#111A16',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  helpIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helpIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,184,166,0.12)',
  },
  helpTitle: { ...typography.bodySemi, fontSize: 16, fontWeight: '700' },
  helpBody: { ...typography.caption, fontSize: 13, lineHeight: 18 },
  helpLink: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: '#14B8A6',
    alignSelf: 'flex-start',
  },

  footer: { ...typography.caption, textAlign: 'center', marginTop: 28, opacity: 0.8 },
});