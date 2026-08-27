import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { GlowBackground } from '../components/GlowBackground';
import { Header } from '../components/Header';
import { extractVideoId, haptics } from '../utils/helpers';
import { lecturesApi, type ApiError } from '../services/api';

type Mode = 'youtube' | 'upload';

const MINT = '#34D399';
const MINT_GRAD = ['#34D399', '#10B981'] as const;
const CYAN = '#38BDF8';
const CYAN_GRAD = ['#38BDF8', '#0EA5E9'] as const;

export function AddLectureScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [mode, setMode] = useState<Mode>('youtube');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType?: string | null;
    size?: number | null;
    file?: File;
  } | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const tabAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (next: Mode) => {
    haptics.light();
    setMode(next);
    Animated.spring(tabAnim, {
      toValue: next === 'youtube' ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  // ── YouTube submit ─────────────────────────────────────────────────────────
  const submitYouTube = () => {
    if (!extractVideoId(url)) {
      setUrlError('Please enter a valid YouTube video URL.');
      haptics.warning();
      return;
    }
    haptics.success();
    (navigation as any).navigate('Processing', { url });
  };

  const pasteFromClipboard = async () => {
    haptics.light();
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrl(text.trim());
      setUrlError('');
    }
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const pickFile = async () => {
    haptics.light();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
          'video/x-matroska', 'audio/mpeg', 'audio/mp4', 'audio/wav',
          'audio/ogg', 'audio/*', 'video/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name || 'lecture',
        mimeType: asset.mimeType,
        size: asset.size,
        file: (asset as any).file,
      });

      // Auto-fill title from filename
      const nameWithoutExt = (asset.name || '').replace(/\.[^.]+$/, '');
      if (!fileTitle && nameWithoutExt) {
        setFileTitle(nameWithoutExt);
      }
      setUploadError('');
    } catch (err) {
      setUploadError('Could not pick file. Please try again.');
    }
  };

  const submitUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a video or audio file first.');
      haptics.warning();
      return;
    }
    haptics.success();
    setUploading(true);
    setUploadError('');

    try {
      const lecture = await lecturesApi.uploadVideo(
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          mimeType: selectedFile.mimeType,
          file: selectedFile.file,
        },
        fileTitle.trim() || undefined
      );
      haptics.success();
      (navigation as any).replace('LectureDetail', { lectureId: lecture.id });
    } catch (err: any) {
      haptics.warning();
      setUploadError(
        (err as ApiError)?.message ||
          'Upload failed. Make sure your file is within size limits (up to 500MB).'
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '52%'],
  });

  return (
    <GlowBackground>
      <View style={styles.container}>
        <Header title="Add Lecture" subtitle="Import from YouTube or upload a local file" back />

        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.responsiveContainer}>
            {/* ── Tab Selector ─────────────────────────────────────────────── */}
            <View style={styles.tabBar}>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    backgroundColor: mode === 'youtube' ? MINT : CYAN,
                    left: indicatorLeft,
                  },
                ]}
              />
              <Pressable
                style={styles.tabBtn}
                onPress={() => switchMode('youtube')}
              >
                <MaterialCommunityIcons
                  name="youtube"
                  size={19}
                  color={mode === 'youtube' ? '#06281A' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: mode === 'youtube' ? '#06281A' : theme.textSecondary },
                  ]}
                >
                  YouTube
                </Text>
              </Pressable>
              <Pressable
                style={styles.tabBtn}
                onPress={() => switchMode('upload')}
              >
                <MaterialIcons
                  name="upload-file"
                  size={19}
                  color={mode === 'upload' ? '#041E2D' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: mode === 'upload' ? '#041E2D' : theme.textSecondary },
                  ]}
                >
                  Upload File
                </Text>
              </Pressable>
            </View>

            {/* ── YouTube Panel (Deep Forest Green Theme) ─────────────────── */}
            {mode === 'youtube' && (
              <View style={styles.panelGreen}>
                <LinearGradient
                  colors={['#0A2419', '#051610']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.iconCircleRed}>
                  <MaterialCommunityIcons name="youtube" size={42} color="#FF4E45" />
                </View>

                <Text style={[styles.panelTitle, { color: theme.textPrimary }]}>
                  Import YouTube Video
                </Text>
                <Text style={[styles.panelSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>
                  Paste any YouTube URL to auto-extract transcripts, generate timestamped chunks,
                  and index into pgvector for conversational AI Q&A.
                </Text>

                {/* URL Input */}
                <View
                  style={[
                    styles.inputRow,
                    {
                      borderColor: urlError ? '#EF4444' : 'rgba(52, 211, 153, 0.35)',
                      backgroundColor: '#071A12',
                    },
                  ]}
                >
                  <MaterialIcons name="link" size={22} color={MINT} />
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary }]}
                    placeholder="https://youtube.com/watch?v=..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={url}
                    onChangeText={(t) => {
                      setUrl(t);
                      setUrlError('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <Pressable
                    onPress={pasteFromClipboard}
                    style={styles.pasteBtn}
                    hitSlop={8}
                  >
                    <MaterialIcons name="content-paste" size={19} color={MINT} />
                  </Pressable>
                </View>

                {urlError ? (
                  <Text style={styles.errorText}>{urlError}</Text>
                ) : (
                  <Text style={[styles.hint, { color: 'rgba(255,255,255,0.5)' }]}>
                    Tip: Tap the paste icon to auto-fill from clipboard
                  </Text>
                )}

                <Pressable
                  onPress={submitYouTube}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={[...MINT_GRAD]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                  >
                    <MaterialIcons name="rocket-launch" size={20} color="#06281A" />
                    <Text style={styles.actionBtnText}>Start Processing</Text>
                  </LinearGradient>
                </Pressable>

                {/* Feature chips */}
                <View style={styles.features}>
                  {['Auto transcript extraction', 'Timestamped citations', 'AI vector indexing'].map(
                    (f) => (
                      <View key={f} style={styles.featureChipGreen}>
                        <MaterialIcons name="check-circle" size={13} color={MINT} />
                        <Text style={[styles.featureText, { color: MINT }]}>{f}</Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            )}

            {/* ── File Upload Panel (Deep Ocean Cyan Theme) ───────────────── */}
            {mode === 'upload' && (
              <View style={styles.panelCyan}>
                <LinearGradient
                  colors={['#092330', '#05141D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.iconCircleCyan}>
                  <MaterialIcons name="upload-file" size={42} color={CYAN} />
                </View>

                <Text style={[styles.panelTitle, { color: theme.textPrimary }]}>
                  Upload Local Video or Audio
                </Text>
                <Text style={[styles.panelSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>
                  Upload MP4, MOV, MKV, MP3, M4A, or WAV files (up to 500MB). Audio will be extracted
                  and transcribed with Whisper AI.
                </Text>

                {/* File picker drop area */}
                <Pressable
                  onPress={!uploading ? pickFile : undefined}
                  style={({ pressed }) => [
                    styles.dropZone,
                    {
                      borderColor: selectedFile ? CYAN : 'rgba(56, 189, 248, 0.35)',
                      backgroundColor: selectedFile ? 'rgba(56, 189, 248, 0.12)' : '#071822',
                    },
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  {selectedFile ? (
                    <View style={styles.fileInfo}>
                      <View style={styles.fileIconBox}>
                        <MaterialIcons name="movie" size={28} color={CYAN} />
                      </View>
                      <View style={styles.fileInfoText}>
                        <Text style={[styles.fileName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {selectedFile.name}
                        </Text>
                        {selectedFile.size ? (
                          <Text style={[styles.fileSize, { color: 'rgba(255,255,255,0.65)' }]}>
                            {formatFileSize(selectedFile.size)} · Ready to Transcribe
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          setSelectedFile(null);
                        }}
                        hitSlop={8}
                        style={styles.removeFileBtn}
                      >
                        <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.8)" />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.dropZoneInner}>
                      <MaterialIcons name="cloud-upload" size={38} color={CYAN} />
                      <Text style={[styles.dropZoneText, { color: theme.textPrimary }]}>
                        Tap to choose video / audio file
                      </Text>
                      <Text style={[styles.dropZoneHint, { color: 'rgba(255,255,255,0.55)' }]}>
                        MP4 · MOV · AVI · MKV · MP3 · M4A · WAV (Max 500 MB)
                      </Text>
                    </View>
                  )}
                </Pressable>

                {/* Title input */}
                <View
                  style={[
                    styles.inputRow,
                    {
                      borderColor: 'rgba(56, 189, 248, 0.35)',
                      backgroundColor: '#071822',
                      marginTop: 4,
                    },
                  ]}
                >
                  <MaterialIcons name="title" size={20} color={CYAN} />
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary }]}
                    placeholder="Lecture title (optional)"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={fileTitle}
                    onChangeText={setFileTitle}
                    maxLength={200}
                  />
                </View>

                {uploadError ? (
                  <Text style={styles.errorText}>{uploadError}</Text>
                ) : null}

                <Pressable
                  onPress={!uploading ? submitUpload : undefined}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    (!selectedFile || uploading) && styles.actionBtnDisabled,
                    pressed && selectedFile && !uploading && styles.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={uploading || !selectedFile ? ['#1F2937', '#1F2937'] : [...CYAN_GRAD]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                  >
                    {uploading ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                          Transcribing with Whisper AI…
                        </Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons
                          name="mic"
                          size={20}
                          color={!selectedFile ? '#9CA3AF' : '#041E2D'}
                        />
                        <Text
                          style={[
                            styles.actionBtnText,
                            { color: !selectedFile ? '#9CA3AF' : '#041E2D' },
                          ]}
                        >
                          Transcribe & Index Video
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                {uploading && (
                  <Text style={[styles.hint, { color: 'rgba(255,255,255,0.6)', textAlign: 'center' }]}>
                    Processing audio and indexing timestamps into pgvector…
                  </Text>
                )}

                {/* Feature chips */}
                <View style={styles.features}>
                  {[
                    'Whisper AI speech-to-text',
                    'Supports up to 500MB files',
                    'Timestamp chunking & RAG',
                  ].map((f) => (
                    <View key={f} style={styles.featureChipCyan}>
                      <MaterialIcons name="check-circle" size={13} color={CYAN} />
                      <Text style={[styles.featureText, { color: CYAN }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollWrapper: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 60,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 720,
    gap: 16,
  },

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 5,
    position: 'relative',
    backgroundColor: '#071810',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: 5,
    width: '46%',
    height: '82%',
    borderRadius: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    zIndex: 1,
  },
  tabText: { ...typography.bodySemi, fontSize: 14, fontWeight: '700' },

  // ── Panels ─────────────────────────────────────────────────────────────────
  panelGreen: {
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    padding: 28,
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  panelCyan: {
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    padding: 28,
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircleRed: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 78, 69, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 78, 69, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleCyan: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: { ...typography.h2, textAlign: 'center', fontSize: 22 },
  panelSubtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 580,
  },

  // ── Inputs ─────────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    fontSize: 15,
    paddingVertical: 2,
  },
  pasteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { ...typography.caption, width: '100%', textAlign: 'left' },
  errorText: {
    ...typography.bodySmall,
    color: '#EF4444',
    width: '100%',
    fontWeight: '600',
  },

  // ── Drop zone ──────────────────────────────────────────────────────────────
  dropZone: {
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
  },
  dropZoneInner: { alignItems: 'center', gap: 8 },
  dropZoneText: { ...typography.bodySemi, fontSize: 16, fontWeight: '700' },
  dropZoneHint: { ...typography.caption, textAlign: 'center', fontSize: 12 },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  fileIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfoText: { flex: 1 },
  fileName: { ...typography.bodySemi, fontSize: 14, fontWeight: '700' },
  fileSize: { ...typography.caption, marginTop: 3, fontSize: 12 },
  removeFileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Action button ──────────────────────────────────────────────────────────
  actionBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
  },
  actionBtnDisabled: { opacity: 0.65 },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionBtnText: {
    ...typography.bodySemi,
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },

  // ── Feature chips ──────────────────────────────────────────────────────────
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 6,
  },
  featureChipGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  featureChipCyan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  featureText: { ...typography.caption, fontSize: 11, fontWeight: '700' },
});