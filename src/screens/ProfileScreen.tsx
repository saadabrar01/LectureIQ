import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  PressableStateCallbackType,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { FadeUp } from '../components/FadeUp';
import { Header } from '../components/Header';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { userProfile } from '../data/mock';
import { haptics } from '../utils/helpers';
import {
  authApi,
  documentsApi,
  getAvatarUrl,
  lecturesApi,
  statsApi,
  type ApiError,
  type AuthUser,
} from '../services/api';

// ---------------------------------------------------------------------------
// Palette — cohesive emerald → teal → lavender accent family
// ---------------------------------------------------------------------------
const ACCENTS = {
  emerald: '#34D399',
  teal: '#2DD4BF',
  mint: '#8EF0A3',
  blue: '#4F9CF9',
  lavender: '#9F8FF0',
  amber: '#FBBF24',
};

const ACCENT_GRADS: Record<string, readonly [string, string]> = {
  emerald: ['#34D399', '#0EA5A0'],
  teal: ['#2DD4BF', '#38BDF8'],
  amber: ['#FBBF24', '#FB923C'],
  lavender: ['#A78BFA', '#6D8BFA'],
};

// Each stat gets one accent from the cohesive family with a soft glow.
const STAT_META = [
  {
    label: 'Sources',
    value: 'videos',
    icon: 'video-library' as const,
    accent: 'emerald',
    color: ACCENTS.emerald,
    grad: ['#34D399', '#0EA5A0'] as const,
  },
  {
    label: 'Questions',
    value: 'questions',
    icon: 'question-answer' as const,
    accent: 'teal',
    color: ACCENTS.teal,
    grad: ['#2DD4BF', '#38BDF8'] as const,
  },
  {
    label: 'Streak',
    value: 'streak',
    icon: 'local-fire-department' as const,
    accent: 'amber',
    color: ACCENTS.amber,
    grad: ['#FBBF24', '#FB923C'] as const,
  },
  {
    label: 'Minutes',
    value: 'minutes',
    icon: 'timer' as const,
    accent: 'lavender',
    color: ACCENTS.lavender,
    grad: ['#A78BFA', '#6D8BFA'] as const,
  },
];

const MENU_ITEMS = [
  {
    icon: 'library-books' as never,
    accent: 'emerald',
    color: ACCENTS.emerald,
    grad: ['#34D399', '#0EA5A0'] as const,
    title: 'Library & Knowledge Base',
    desc: 'Access all your documents and video lectures',
    onPress: (navigation: any) => navigation.navigate('Library'),
  },
  {
    icon: 'settings' as never,
    accent: 'lavender',
    color: ACCENTS.lavender,
    grad: ['#A78BFA', '#6D8BFA'] as const,
    title: 'Settings',
    desc: 'Appearance, language & notification preferences',
    onPress: (navigation: any) => navigation.navigate('Settings'),
  },
  {
    icon: 'help-outline' as never,
    accent: 'teal',
    color: ACCENTS.teal,
    grad: ['#2DD4BF', '#38BDF8'] as const,
    title: 'Help & Support',
    desc: 'FAQs, user guide and customer contact',
    onPress: () => haptics.light(),
  },
];

// `hovered` is a web-only field RN's types don't expose yet — mirror the
// pattern already used in GlassCard.tsx.
function getHovered(state: PressableStateCallbackType): boolean {
  return (state as { hovered?: boolean }).hovered ?? false;
}

export function ProfileScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // User state
  const [user, setUser] = useState<AuthUser | null>(null);

  // Realtime stats state
  const [stats, setStats] = useState({
    videos: 0,
    questions: 0,
    streak: userProfile.streak,
    minutes: 0,
  });

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadRealtimeData = useCallback(async () => {
    try {
      const [dbUser, backendStats, docsList, lecturesList] = await Promise.all([
        authApi.getMe().catch(() => null),
        statsApi.get().catch(() => null),
        documentsApi.list().catch(() => []),
        lecturesApi.list().catch(() => []),
      ]);

      if (dbUser) {
        setUser(dbUser);
      }

      const totalDocs = docsList.length;
      const totalLectures = lecturesList.length;
      const totalSources = totalDocs + totalLectures;

      const docMinutes = totalDocs * 3;
      const lectureMinutes = lecturesList.reduce(
        (acc, l) => acc + Math.round((l.duration_sec ?? l.duration ?? 0) / 60),
        0
      );
      const computedMinutes = lectureMinutes + docMinutes;

      setStats({
        videos: backendStats?.videos_processed ?? totalSources,
        questions: backendStats?.questions_asked ?? 0,
        streak: backendStats?.streak ?? dbUser?.streak ?? userProfile.streak,
        minutes: (backendStats?.minutes_watched && backendStats.minutes_watched > 0)
          ? backendStats.minutes_watched
          : computedMinutes,
      });
    } catch (err) {
      setError((err as ApiError)?.message ?? 'Could not sync profile data');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRealtimeData().finally(() => setLoading(false));
    }, [loadRealtimeData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRealtimeData();
    setRefreshing(false);
  }, [loadRealtimeData]);

  const openEditModal = () => {
    haptics.light();
    setEditName(user?.name || userProfile.name);
    setEditUsername(user?.username || 'saad.ahmed');
    setEditEmail(user?.email || userProfile.email);
    setEditBio(user?.bio || 'Passionate learner using AI to master complex topics.');
    setEditAvatarUrl(user?.avatar_url || '');
    setEditModalVisible(true);
  };

  const handlePickPhoto = async () => {
    haptics.light();
    try {
      setUploadingImage(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      const asset = res.canceled ? undefined : res.assets?.[0];
      if (asset?.uri) {
        const uploadRes = await authApi.uploadAvatar({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          file: Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
        });
        setEditAvatarUrl(uploadRes.avatar_url);
      }
    } catch (err) {
      Alert.alert('Upload Error', 'Could not upload photo. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Validation Error', 'Name and Email are required.');
      return;
    }
    haptics.light();
    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile({
        name: editName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim(),
        bio: editBio.trim(),
        avatar_url: editAvatarUrl.trim(),
      });
      setUser(updated);
      haptics.success();
      setEditModalVisible(false);
      await loadRealtimeData();
    } catch (err) {
      haptics.warning();
      Alert.alert('Save Failed', (err as ApiError)?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const statValues: Record<string, string> = {
    videos: String(stats.videos),
    questions: String(stats.questions),
    streak: `${stats.streak}d`,
    minutes: String(stats.minutes),
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
            (navigation as any).navigate('Login');
          },
        },
      ]
    );
  };

  const displayName = user?.name || userProfile.name;
  const displayEmail = user?.email || userProfile.email;
  const displayAvatar = user?.avatar || userProfile.avatar;
  const displayAvatarUrl = getAvatarUrl(user?.avatar_url);
  const modalAvatarUrl = getAvatarUrl(editAvatarUrl);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={ACCENTS.emerald}
        />
      }
    >
      <Header
        title="Profile"
        subtitle="Realtime account & learning stats"
        back
        onBack={() => navigation.navigate('Home' as never)}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color="#F87171" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ==================== HERO PROFILE CARD ==================== */}
      <FadeUp index={0}>
        <View style={styles.banner}>
          {/* ambient glow behind the card */}
          <LinearGradient
            colors={['rgba(52,211,153,0.14)', 'rgba(52,211,153,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGlow}
          />
          <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.bannerInner}>
            {/* Avatar with soft gradient ring + glow */}
            <Pressable onPress={openEditModal} style={styles.avatarOuter} hitSlop={6}>
              <View style={styles.avatarGlow} />
              <LinearGradient
                colors={['#34D399', '#2DD4BF', '#38BDF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarCircle}>
                  {displayAvatarUrl ? (
                    <Image source={{ uri: displayAvatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{displayAvatar}</Text>
                  )}
                </View>
              </LinearGradient>
              <View style={styles.cameraPip}>
                <MaterialIcons name="photo-camera" size={12} color="#0B0B10" />
              </View>
            </Pressable>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{displayEmail}</Text>
              {user?.bio ? (
                <Text style={styles.profileBio} numberOfLines={2}>{user.bio}</Text>
              ) : null}

              {/* Joined/Sync pill — tinted translucent bg matching border */}
              <View style={styles.joinBadge}>
                <View style={styles.joinBadgeDot} />
                <MaterialIcons name="verified-user" size={12} color={ACCENTS.emerald} />
                <Text style={styles.joinText}>
                  Joined {user?.join_date || userProfile.joinDate}  ·  Postgres Synced
                </Text>
              </View>
            </View>

            {/* Pencil Edit Button */}
            <Pressable
              onPress={openEditModal}
              style={({ pressed }) => [
                styles.editBtn,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
              hitSlop={8}
            >
              <MaterialIcons name="edit" size={18} color="#06281A" />
            </Pressable>
          </View>
        </View>
      </FadeUp>

      {/* ==================== STATS GRID ==================== */}
      <View style={styles.statsGrid}>
        {STAT_META.map((s, i) => (
          <View key={s.label} style={styles.statCell}>
            <FadeUp index={i + 1}>
              <View>
                <Pressable
                  style={(state) => {
                    const hovered = getHovered(state);
                    return [
                      styles.statCard,
                      { borderColor: s.color + '2E' },
                      state.pressed ? styles.cardPressed : null,
                      hovered ? { transform: [{ translateY: -3 }], borderColor: s.color + '66' } : null,
                    ];
                  }}
                >
                  <BlurView intensity={14} tint="dark" style={StyleSheet.absoluteFill} />
                  {/* soft ambient tint behind icon */}
                  <LinearGradient
                    colors={[s.color + '0D', 'rgba(0,0,0,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.statIconWrap}>
                    {/* glowing tinted circle */}
                    <View style={[styles.statIconGlow, { backgroundColor: s.color + '33' }]} />
                    <LinearGradient
                      colors={[...s.grad]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.statIconBg, { borderColor: s.color + '55' }]}
                    >
                      <MaterialIcons name={s.icon} size={18} color="#FFFFFF" />
                    </LinearGradient>
                  </View>

                  {loading ? (
                    <ActivityIndicator color={s.color} size="small" style={{ marginVertical: 4 }} />
                  ) : (
                    <AnimatedNumber value={statValues[s.value]} style={[styles.statValue, { color: theme.textPrimary }]} />
                  )}
                  <Text style={styles.statLabel}>{s.label}</Text>
                </Pressable>
              </View>
            </FadeUp>
          </View>
        ))}
      </View>

      {/* ==================== MENU ACTIONS ==================== */}
      <FadeUp index={3}>
        <View style={styles.menuGroup}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => item.onPress(navigation)}
              style={(state) => {
                const hovered = getHovered(state);
                return [
                  styles.menuCard,
                  { borderColor: item.color + '2E' },
                  state.pressed ? styles.cardPressed : null,
                  hovered
                    ? {
                        transform: [{ translateY: -2 }, { scale: 1.012 }],
                        borderColor: item.color + '55',
                        backgroundColor: item.color + '0D',
                      }
                    : null,
                ];
              }}
            >
              <BlurView intensity={14} tint="dark" style={StyleSheet.absoluteFill} />
              {/* icon container — consistent rounded-square with tinted bg */}
              <LinearGradient
                colors={[item.grad[0] + '22', item.grad[1] + '18']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.menuIcon, { borderColor: item.color + '40' }]}
              >
                <MaterialIcons name={item.icon} size={20} color={item.color} />
              </LinearGradient>

              <View style={styles.menuBody}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>

              <View style={[styles.chevronPill, { backgroundColor: item.color + '1A' }]}>
                <MaterialIcons name="chevron-right" size={18} color={item.color} />
              </View>
            </Pressable>
          ))}
        </View>
      </FadeUp>

      {/* ==================== LOG OUT ==================== */}
      <FadeUp index={4}>
        <Pressable
          onPress={logout}
          style={(state) => {
            const hovered = getHovered(state);
            return [
              styles.logoutBtn,
              hovered ? { borderColor: '#F8717188', backgroundColor: '#F8717122' } : null,
              state.pressed ? { transform: [{ scale: 0.98 }], opacity: 0.85 } : null,
            ];
          }}
        >
          <View style={styles.logoutIconWrap}>
            <MaterialIcons name="logout" size={20} color="#F87171" />
          </View>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </FadeUp>

      <Text style={styles.version}>LectureIQ v1.0.0 · Realtime Workspace Active</Text>

      {/* ==================== EDIT PROFILE MODAL ==================== */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <LinearGradient
                  colors={['#34D399', '#2DD4BF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalHeaderIcon}
                >
                  <MaterialIcons name="manage-accounts" size={18} color="#06281A" />
                </LinearGradient>
                <Text style={styles.modalTitle}>Edit Profile Settings</Text>
              </View>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.formColumnsRow}>
                {/* LEFT COLUMN: Account Management & Photo Upload */}
                <View style={styles.accountCol}>
                  <Text style={styles.formSectionHeading}>Account Management</Text>

                  <View style={styles.photoContainer}>
                    {modalAvatarUrl ? (
                      <Image source={{ uri: modalAvatarUrl }} style={styles.photoPreview} />
                    ) : (
                      <View style={styles.photoFallback}>
                        <MaterialIcons name="person" size={56} color="rgba(255,255,255,0.4)" />
                      </View>
                    )}
                  </View>

                  <Pressable
                    onPress={handlePickPhoto}
                    disabled={uploadingImage}
                    style={({ pressed }) => [
                      styles.uploadPhotoBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#F5F7F6" />
                    ) : (
                      <>
                        <MaterialIcons name="add-a-photo" size={16} color="#F5F7F6" />
                        <Text style={styles.uploadPhotoText}>Upload Photo</Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {/* RIGHT COLUMN: Profile Information */}
                <View style={styles.profileCol}>
                  <Text style={styles.formSectionHeading}>Profile Information</Text>

                  {/* Username & Full Name Row */}
                  <View style={styles.fieldGroupRow}>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>Username</Text>
                      <TextInput
                        value={editUsername}
                        onChangeText={setEditUsername}
                        placeholder="gene.rodrig"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        style={styles.formInput}
                      />
                    </View>

                    <View style={styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>Full Name</Text>
                      <TextInput
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Gene Rodriguez"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        style={styles.formInput}
                      />
                    </View>
                  </View>

                  {/* Email Field */}
                  <View style={styles.fieldFull}>
                    <Text style={styles.fieldLabel}>Email (required)</Text>
                    <TextInput
                      value={editEmail}
                      onChangeText={setEditEmail}
                      placeholder="gene.rodrig@gmail.com"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.formInput}
                    />
                  </View>

                  {/* Biographical Info Field */}
                  <View style={styles.fieldFull}>
                    <Text style={styles.fieldLabel}>Biographical Info</Text>
                    <TextInput
                      value={editBio}
                      onChangeText={setEditBio}
                      placeholder="Write a short bio about yourself..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      multiline
                      numberOfLines={4}
                      style={[styles.formInput, styles.formInputArea]}
                    />
                  </View>
                </View>
              </View>

              {/* Save Action Button */}
              <Pressable
                onPress={handleSaveProfile}
                disabled={savingProfile}
                style={({ pressed }) => [
                  styles.saveProfileBtn,
                  savingProfile && { opacity: 0.6 },
                  pressed && { transform: [{ scale: 0.985 }] },
                ]}
              >
                <LinearGradient
                  colors={['#34D399', '#0EA5A0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveProfileGrad}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#06281A" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={18} color="#06281A" />
                      <Text style={styles.saveProfileText}>Save Profile Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 110,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.28)',
    marginBottom: 16,
  },
  errorText: {
    ...typography.caption,
    color: '#F87171',
    flex: 1,
  },

  // ---------- Hero Banner ----------
  banner: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 24,
  },
  bannerGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  avatarOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(52,211,153,0.22)',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 8,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#0E1712',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarText: {
    ...typography.h2,
    color: '#8EF0A3',
    fontSize: 26,
    fontWeight: '800',
  },
  cameraPip: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8EF0A3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B0B10',
  },
  profileInfo: { flex: 1 },
  profileName: {
    ...typography.h3,
    color: '#F7FAF8',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 3,
  },
  profileBio: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.68)',
    marginTop: 6,
    lineHeight: 17,
  },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    alignSelf: 'flex-start',
  },
  joinBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  joinText: {
    ...typography.caption,
    color: '#34D399',
    fontWeight: '600',
    fontSize: 11,
  },
  editBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8EF0A3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },

  // ---------- Stats Grid ----------
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCell: {
    flex: 1,
    minWidth: 140,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  statCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(14,23,18,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 5,
    overflow: 'hidden',
  },
  statIconWrap: {
    marginBottom: 14,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...typography.h3,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },

  // ---------- Menu ----------
  menuGroup: { gap: 14, marginBottom: 24 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(14,23,18,0.55)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: { flex: 1 },
  menuTitle: {
    ...typography.bodySemi,
    color: '#F7FAF8',
    fontSize: 15,
    fontWeight: '600',
  },
  menuDesc: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  chevronPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------- Logout ----------
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.28)',
  },
  logoutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(248,113,113,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    ...typography.bodySemi,
    color: '#F87171',
    fontWeight: '700',
  },
  version: {
    ...typography.caption,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 24,
    fontSize: 12,
  },

  // ---------- Edit Modal ----------
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 780,
    maxHeight: '90%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(14,23,18,0.95)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 26,
    elevation: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: '#F5F7F6',
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modalScroll: {
    flexGrow: 0,
  },
  formColumnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 20,
  },
  formSectionHeading: {
    ...typography.bodySemi,
    color: '#F5F7F6',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },

  // Account Column (Photo upload)
  accountCol: {
    flex: 1,
    minWidth: 220,
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  photoContainer: {
    width: 140,
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    width: '100%',
    justifyContent: 'center',
  },
  uploadPhotoText: {
    ...typography.bodySemi,
    color: '#F5F7F6',
    fontSize: 13,
  },

  // Profile Column (Form fields)
  profileCol: {
    flex: 2,
    minWidth: 280,
    gap: 14,
  },
  fieldGroupRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldFull: {},
  fieldLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    ...typography.body,
    color: '#F5F7F6',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  formInputArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },

  // Save Profile Button
  saveProfileBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
  },
  saveProfileGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  saveProfileText: {
    ...typography.bodySemi,
    color: '#06281A',
    fontWeight: '800',
    fontSize: 15,
  },
});
