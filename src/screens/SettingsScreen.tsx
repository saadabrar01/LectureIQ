import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { GlowBackground } from '../components/GlowBackground';
import { GlassCard } from '../components/GlassCard';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { haptics } from '../utils/helpers';
import {
  authApi,
  getAvatarUrl,
  setToken,
  type AuthUser,
} from '../services/api';

// ---------------------------------------------------------------------------
// Palette — neon emerald accent family on a deep blue-black base
// ---------------------------------------------------------------------------
const NEON = '#10B981';
const NEON_SOFT = '#34D399';
const TEAL = '#2DD4BF';
const SURFACE_BG = 'rgba(11, 15, 25, 0.78)'; // #0B0F19 glass
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
  password: { icon: 'lock-outline', color: NEON, bg: 'rgba(16,185,129,0.14)' } as Accent,
  profile: { icon: 'person-outline', color: '#38BDF8', bg: 'rgba(56,189,248,0.14)' } as Accent,
  notify: { icon: 'notifications-outline', color: '#FBBF24', bg: 'rgba(251,191,36,0.14)' } as Accent,
  theme: { icon: 'dark-mode', color: '#A78BFA', bg: 'rgba(167,139,250,0.14)' } as Accent,
  sync: { icon: 'cloud-done', color: TEAL, bg: 'rgba(45,212,191,0.14)' } as Accent,
  privacy: { icon: 'privacy-tip', color: '#9F8FF0', bg: 'rgba(159,143,240,0.14)' } as Accent,
  terms: { icon: 'description', color: '#4F9CF9', bg: 'rgba(79,156,249,0.14)' } as Accent,
  support: { icon: 'help-outline', color: NEON_SOFT, bg: 'rgba(52,211,153,0.14)' } as Accent,
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function IconBubble({ accent }: { accent: Accent }) {
  return (
    <View style={[styles.iconBubble, { backgroundColor: accent.bg }]}>
      <MaterialIcons name={accent.icon as never} size={20} color={accent.color} />
    </View>
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
  return (
    <>
      <Pressable
        onPress={onPress ?? (() => haptics.light())}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        hitSlop={6}
      >
        <IconBubble accent={accent} />
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{title}</Text>
          {desc ? (
            <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>{desc}</Text>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
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
  onValueChange: (v: boolean) => void;
  last?: boolean;
}

function ToggleRow({ accent, title, desc, value, onValueChange, last }: ToggleRowProps) {
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
        <ToggleSwitch value={value} onValueChange={onValueChange} />
      </View>
      {!last ? <RowDivider /> : null}
    </>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { theme } = useAppTheme();
  return (
    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{children}</Text>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const navigation = useNavigation();

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

  const resetToLogin = async () => {
    await setToken(null);
    (navigation as any).reset({ index: 0, routes: [{ name: 'Login' }] });
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

  const avatarUri = user ? getAvatarUrl(user.avatar_url) : undefined;
  const initials = user?.avatar?.trim() ? user.avatar.trim().slice(0, 2) : 'LI';

  return (
    <GlowBackground>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ---------------------------------------------------------------- */}
          {/* Profile header */}
          {/* ---------------------------------------------------------------- */}
          <View style={[styles.profileCard, { borderColor: SURFACE_BORDER, backgroundColor: SURFACE_BG }]}>
            <LinearGradient
              colors={[NEON, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.profileAccent}
            />
            <View style={styles.profileRow}>
              <LinearGradient colors={[NEON, TEAL]} style={styles.avatarRing}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {user?.name || 'Your account'}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                  {user?.email || 'Sign in to sync your data'}
                </Text>
                <View style={styles.profileBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Active</Text>
                </View>
              </View>
              <Pressable
                onPress={() => haptics.light()}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.editBtn,
                  { borderColor: SURFACE_BORDER, backgroundColor: 'rgba(16,185,129,0.08)' },
                  pressed && { transform: [{ scale: 0.9 }] },
                ]}
              >
                <MaterialIcons name="edit" size={18} color={NEON} />
              </Pressable>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* Account */}
          {/* ---------------------------------------------------------------- */}
          <SectionLabel>Account</SectionLabel>
          <GlassCard style={styles.group}>
            <NavRow
              accent={ICONS.password}
              title="Change password"
              desc="Update your account password"
              onPress={() => {
                haptics.light();
                Alert.alert('Change password', 'Password reset is coming soon.');
              }}
            />
            <NavRow
              accent={ICONS.profile}
              title="Edit profile"
              desc="Name, username, email & photo"
              onPress={() => {
                haptics.light();
                navigation.navigate('Main', { screen: 'Profile' });
              }}
              last
            />
          </GlassCard>

          {/* ---------------------------------------------------------------- */}
          {/* Preferences */}
          {/* ---------------------------------------------------------------- */}
          <SectionLabel>Preferences</SectionLabel>
          <GlassCard style={styles.group}>
            <ToggleRow
              accent={ICONS.notify}
              title="Notifications"
              desc="Remind me to review lectures"
              value={notifications}
              onValueChange={(v) => setPref(PREF_NOTIF, v, setNotifications)}
            />
            <ToggleRow
              accent={ICONS.theme}
              title="Dark mode"
              desc={isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              value={isDark}
              onValueChange={toggleTheme}
            />
            <ToggleRow
              accent={ICONS.sync}
              title="Data sync"
              desc="Keep your data in sync across devices"
              value={dataSync}
              onValueChange={(v) => setPref(PREF_SYNC, v, setDataSync)}
              last
            />
          </GlassCard>

          {/* ---------------------------------------------------------------- */}
          {/* About & support */}
          {/* ---------------------------------------------------------------- */}
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

          {/* ---------------------------------------------------------------- */}
          {/* Actions */}
          {/* ---------------------------------------------------------------- */}
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
              styles.actionBtn,
              {
                borderColor: 'rgba(239,68,68,0.25)',
                backgroundColor: 'rgba(239,68,68,0.07)',
              },
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 },
            ]}
          >
            <MaterialIcons name="delete-outline" size={20} color="#F87171" />
            <Text style={[styles.deleteText, { color: '#F87171' }]}>Delete account</Text>
          </Pressable>

          <Text style={[styles.footer, { color: theme.textSecondary }]}>
            LectureIQ v1.0 — Learn Smarter with AI
          </Text>
        </ScrollView>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingBottom: 80,
    paddingTop: 6,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },

  // Profile header
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 6,
  },
  profileAccent: { height: 3 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarImg: { flex: 1, borderRadius: 32, width: undefined },
  avatarFallback: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 16, 12, 0.9)',
  },
  avatarInitials: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: NEON,
  },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, letterSpacing: -0.3 },
  profileEmail: { ...typography.caption, marginTop: 3, opacity: 0.9 },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NEON },
  badgeText: {
    ...typography.caption,
    color: NEON_SOFT,
    fontFamily: 'Inter_600SemiBold',
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grouped cards
  group: { marginHorizontal: 20, paddingVertical: 6 },
  sectionLabel: {
    ...typography.caption,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginHorizontal: 24,
    marginTop: 26,
    marginBottom: 10,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodySemi },
  rowDesc: { ...typography.caption, marginTop: 2, opacity: 0.85 },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    marginRight: 16,
  },

  // Actions
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  logoutText: { ...typography.buttonSmall, fontFamily: 'Poppins_600SemiBold' },
  deleteText: { ...typography.buttonSmall, fontFamily: 'Poppins_600SemiBold' },

  footer: { ...typography.caption, textAlign: 'center', marginTop: 28, opacity: 0.8 },
});