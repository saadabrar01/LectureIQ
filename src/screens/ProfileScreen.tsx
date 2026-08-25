import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
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
import { GlassCard } from '../components/GlassCard';
import { FadeUp } from '../components/FadeUp';
import { Header } from '../components/Header';
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

const STAT_META = [
  { label: 'Sources', value: 'videos', icon: 'video-library' as const, color: '#22C55E', grad: ['#35D47A', '#22C55E'] },
  { label: 'Questions', value: 'questions', icon: 'question-answer' as const, color: '#38CFA8', grad: ['#34D399', '#38CFA8'] },
  { label: 'Streak', value: 'streak', icon: 'local-fire-department' as const, color: '#FBBF24', grad: ['#FBBF24', '#F97316'] },
  { label: 'Minutes', value: 'minutes', icon: 'timer' as const, color: '#8EA6E8', grad: ['#8EA6E8', '#9F8FF0'] },
];

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

  const menuRow = (
    icon: string,
    color: string,
    title: string,
    desc: string,
    onPress: () => void
  ) => (
    <GlassCard onPress={onPress} style={styles.menuCard} blur={16}>
      <View style={[styles.menuIcon, { backgroundColor: color + '22', borderColor: color + '33' }]}>
        <MaterialIcons name={icon as never} size={20} color={color} />
      </View>
      <View style={styles.menuBody}>
        <Text style={[styles.menuTitle, { color: '#F5F7F6' }]}>{title}</Text>
        <Text style={[styles.menuDesc, { color: 'rgba(255,255,255,0.55)' }]}>{desc}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
    </GlassCard>
  );

  const displayName = user?.name || userProfile.name;
  const displayEmail = user?.email || userProfile.email;
  const displayAvatar = user?.avatar || userProfile.avatar;
  const displayAvatarUrl = getAvatarUrl(user?.avatar_url);
  const modalAvatarUrl = getAvatarUrl(editAvatarUrl);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#22C55E"
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
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Hero Banner Card */}
      <FadeUp index={0}>
        <View style={styles.banner}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(37,31,50,0.85)', 'rgba(38,38,38,0.92)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bannerInner}>
            <View style={styles.avatarOuter}>
              <LinearGradient
                colors={['#35D47A', '#22C55E']}
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
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{displayEmail}</Text>
              {user?.bio ? (
                <Text style={styles.profileBio} numberOfLines={2}>{user.bio}</Text>
              ) : null}
              <View style={styles.joinBadge}>
                <MaterialIcons name="verified-user" size={12} color="#34D399" />
                <Text style={styles.joinText}>
                  Joined {user?.join_date || userProfile.joinDate}  ·  PostgreSQL Synced
                </Text>
              </View>
            </View>

            {/* Pencil Edit Button */}
            <Pressable onPress={openEditModal} style={styles.editBtn} hitSlop={8}>
              <MaterialIcons name="edit" size={20} color="#06281A" />
            </Pressable>
          </View>
        </View>
      </FadeUp>

      {/* Stats Summary Grid (Realtime Backend Data) */}
      <View style={styles.statsGrid}>
        {STAT_META.map((s, i) => (
          <View key={s.label} style={styles.statCell}>
            <FadeUp index={i + 1}>
              <View style={styles.statCard}>
                <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.statIconWrap}>
                  <LinearGradient
                    colors={s.grad as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statIconBg}
                  >
                    <MaterialIcons name={s.icon} size={20} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                {loading ? (
                  <ActivityIndicator color={s.color} size="small" style={{ marginVertical: 4 }} />
                ) : (
                  <Text style={styles.statValue}>{statValues[s.value]}</Text>
                )}
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </FadeUp>
          </View>
        ))}
      </View>

      {/* Menu Actions */}
      <FadeUp index={3}>
        <View style={styles.menuGroup}>
          {menuRow(
            'library-books',
            '#22C55E',
            'Library & Knowledge Base',
            'Access all your documents and video lectures',
            () => (navigation as any).navigate('Library')
          )}
          {menuRow(
            'settings',
            '#8EA6E8',
            'Settings',
            'Appearance, language & notification preferences',
            () => (navigation as any).navigate('Settings')
          )}
          {menuRow(
            'help-outline',
            '#9F8FF0',
            'Help & Support',
            'FAQs, user guide and customer contact',
            () => haptics.light()
          )}
        </View>
      </FadeUp>

      {/* Logout Action */}
      <FadeUp index={4}>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </FadeUp>

      <Text style={styles.version}>
        LectureIQ v1.0.0 · Realtime Workspace Active
      </Text>

      {/* --- EDIT PROFILE MODAL (MATCHING USER IMAGE UI) --- */}
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
                <MaterialIcons name="manage-accounts" size={22} color="#34D399" />
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
                  colors={['#35D47A', '#22C55E']}
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
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginBottom: 16,
  },
  errorText: {
    ...typography.caption,
    color: '#EF4444',
    flex: 1,
  },

  // Hero Banner Card
  banner: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(37,31,50,0.72)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 20,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  avatarOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarRing: {
    flex: 1,
    borderRadius: 36,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    backgroundColor: '#8EF0A3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
  },
  avatarText: { ...typography.h2, color: '#06281A', fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, color: '#F5F7F6', fontSize: 20, fontWeight: '700' },
  profileEmail: { ...typography.bodySmall, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  profileBio: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 16 },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(53,212,122,0.12)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(53,212,122,0.25)',
  },
  joinText: { ...typography.caption, color: '#34D399', fontWeight: '600', fontSize: 11 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8EF0A3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#35D47A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Stats Summary Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  statCell: {
    flex: 1,
    minWidth: 140,
  },
  statCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(37,31,50,0.72)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  statIconWrap: {
    marginBottom: 12,
  },
  statIconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...typography.h3,
    color: '#F5F7F6',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },

  // Menu Groups
  menuGroup: { gap: 12, marginBottom: 20 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(37,31,50,0.72)',
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: { flex: 1 },
  menuTitle: { ...typography.bodySemi, fontSize: 15, fontWeight: '600' },
  menuDesc: { ...typography.caption, fontSize: 12, marginTop: 2 },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
  },
  logoutText: { ...typography.bodySemi, color: '#EF4444', fontWeight: '700' },

  version: {
    ...typography.caption,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 24,
    fontSize: 12,
  },

  // --- EDIT PROFILE MODAL STYLES ---
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(37,31,50,0.95)',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  photoContainer: {
    width: 140,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
    borderColor: 'rgba(255,255,255,0.15)',
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
    borderColor: 'rgba(255,255,255,0.12)',
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