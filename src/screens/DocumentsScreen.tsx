import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
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
import Animated, { FadeInDown, FadeOutRight } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { FadeUp } from '../components/FadeUp';
import { Header } from '../components/Header';
import { haptics } from '../utils/helpers';
import { documentsApi, ApiError, IndexedDocument, AskRagResult } from '../services/api';

const MAX_MB = 20;
const MINT = '#22C55E';
const MINT_BRIGHT = '#34D399';
const CARD_BG = 'rgba(38,38,38,0.85)';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  pdf: { bg: 'rgba(142,160,232,0.16)', fg: '#8EA6E8', label: 'PDF' },
  docx: { bg: 'rgba(56,207,168,0.16)', fg: '#38CFA8', label: 'DOCX' },
};

export function DocumentsScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [docs, setDocs] = useState<IndexedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<AskRagResult | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setDocs(await documentsApi.list());
    } catch (err) {
      setError((err as ApiError)?.message ?? 'Could not load documents');
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const pickAndUpload = async () => {
    haptics.light();
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', DOCX_MIME],
        copyToCacheDirectory: true,
      });
      const asset = res.canceled ? undefined : res.assets?.[0];
      if (!asset) return;

      if ((asset.size ?? 0) > MAX_MB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${MAX_MB} MB.`);
        return;
      }

      setUploading(true);
      await documentsApi.upload({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        file: Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
      });
      haptics.success();
      await refresh();
    } catch (err) {
      haptics.warning();
      setError((err as ApiError)?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: IndexedDocument) => {
    haptics.light();
    setConfirmDeleteId(doc.id);
  };

  const confirmDelete = async (doc: IndexedDocument) => {
    haptics.warning();
    setDeletingId(doc.id);
    try {
      await documentsApi.remove(doc.id);
      setResult(null);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError((err as ApiError)?.message ?? 'Delete failed');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const cancelDelete = () => {
    haptics.light();
    setConfirmDeleteId(null);
  };

  const ask = async () => {
    const q = question.trim();
    if (!q || asking) return;
    haptics.light();
    setAsking(true);
    try {
      setResult(await documentsApi.ask(q));
    } catch (err) {
      haptics.warning();
      setError((err as ApiError)?.message ?? 'Could not answer');
    } finally {
      setAsking(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Header
        title="Documents"
        subtitle="Ask questions about your files"
        back
        onBack={() => navigation.goBack()}
      />

      {error ? (
        <Animated.View entering={FadeInDown.duration(250)} style={[styles.banner, { borderColor: '#EF444444' }]}>
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text style={styles.bannerText}>{error}</Text>
          <Pressable onPress={() => setError('')} hitSlop={6}>
            <MaterialIcons name="close" size={14} color="#EF4444" />
          </Pressable>
        </Animated.View>
      ) : null}

      {/* Upload CTA */}
      <FadeUp index={0}>
        <Pressable
          onPress={pickAndUpload}
          disabled={uploading}
          style={({ pressed }) => [
            styles.uploadCard,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
        >
          <LinearGradient
            colors={['#35D47A', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadIcon}
          >
            <MaterialIcons name="cloud-upload" size={24} color="#06281A" />
          </LinearGradient>
          <View style={styles.uploadBody}>
            <Text style={styles.uploadTitle}>
              {uploading ? 'Indexing document…' : 'Upload PDF or DOCX'}
            </Text>
            <Text style={styles.uploadDesc}>
              Text is extracted, chunked and embedded for AI answers.
            </Text>
          </View>
          {uploading ? (
            <ActivityIndicator color="#8EF0A3" />
          ) : (
            <MaterialIcons name="add-circle-outline" size={24} color="rgba(142,240,163,0.75)" />
          )}
        </Pressable>
      </FadeUp>

      {/* Your Documents */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Your Documents
        </Text>
        <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
          {docs.length}
        </Text>
      </View>

      {loadingDocs ? (
        <ActivityIndicator color="#8EF0A3" style={styles.loader} />
      ) : docs.length === 0 ? (
        <View style={styles.emptyCard}>
          <BlurView intensity={14} tint="dark" style={StyleSheet.absoluteFill} />
          <MaterialIcons name="folder-open" size={36} color="rgba(255,255,255,0.18)" />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            No documents yet
          </Text>
          <Text style={[styles.emptyDesc, { color: 'rgba(255,255,255,0.35)' }]}>
            Upload a PDF or DOCX above to get started.
          </Text>
        </View>
      ) : (
        <View style={styles.docList}>
          {docs.map((doc) => {
            const type = TYPE_COLORS[doc.file_type] ?? TYPE_COLORS.pdf;
            const isDeleting = deletingId === doc.id;
            const isConfirming = confirmDeleteId === doc.id;

            return (
              <Animated.View
                key={doc.id}
                entering={FadeInDown.duration(300)}
                exiting={FadeOutRight.duration(300)}
              >
                <View
                  style={[
                    styles.docCard,
                    isDeleting && { opacity: 0.5 },
                  ]}
                >
                  <BlurView intensity={16} tint="dark" style={StyleSheet.absoluteFill} />

                  {/* Document icon */}
                  <View style={[styles.docIcon, { backgroundColor: type.bg, borderColor: type.fg + '33' }]}>
                    <MaterialIcons
                      name={doc.file_type === 'pdf' ? 'picture-as-pdf' : 'description'}
                      size={22}
                      color={type.fg}
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.docBody}>
                    <Text style={[styles.docName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {doc.file_name}
                    </Text>
                    <View style={styles.docMetaRow}>
                      <Text style={[styles.docMeta, { color: theme.textSecondary }]}>
                        {formatBytes(doc.file_size)}
                      </Text>
                      <Text style={[styles.docDot, { color: 'rgba(255,255,255,0.2)' }]}>·</Text>
                      <Text style={[styles.docMeta, { color: theme.textSecondary }]}>
                        {doc.num_pages} page{doc.num_pages !== 1 ? 's' : ''}
                      </Text>
                      <Text style={[styles.docDot, { color: 'rgba(255,255,255,0.2)' }]}>·</Text>
                      <Text style={[styles.docMeta, { color: theme.textSecondary }]}>
                        {formatDate(doc.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Format badge */}
                  <View style={[styles.badge, { backgroundColor: type.bg, borderColor: type.fg + '33' }]}>
                    <Text style={[styles.badgeText, { color: type.fg }]}>{type.label}</Text>
                  </View>

                  {/* Delete button */}
                  {isConfirming ? (
                    <View style={styles.confirmRow}>
                      <Pressable
                        onPress={cancelDelete}
                        style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.7 }]}
                      >
                        <Text style={styles.confirmCancel}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(doc)}
                        style={({ pressed }) => [styles.confirmBtnDelete, pressed && { opacity: 0.7 }]}
                      >
                        <MaterialIcons name="delete" size={14} color="#fff" />
                        <Text style={styles.confirmDeleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleDelete(doc)}
                      disabled={isDeleting}
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        pressed && { transform: [{ scale: 0.9 }] },
                      ]}
                      hitSlop={8}
                    >
                      <MaterialIcons name="delete-outline" size={19} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Ask section */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Ask a Question
        </Text>
      </View>
      <FadeUp index={2}>
        <View style={[styles.askRow, { borderColor: 'rgba(255,255,255,0.09)' }]}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder={
              docs.length === 0
                ? 'Upload a document first…'
                : 'e.g. What is self-attention?'
            }
            placeholderTextColor="rgba(255,255,255,0.35)"
            editable={docs.length > 0}
            multiline
            style={[styles.askInput, { color: theme.textPrimary }]}
          />
          <Pressable
            onPress={ask}
            disabled={asking || !question.trim() || docs.length === 0}
            style={({ pressed }) => [
              styles.sendBtn,
              (asking || !question.trim() || docs.length === 0) && { opacity: 0.4 },
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
          >
            {asking ? (
              <ActivityIndicator color="#06281A" />
            ) : (
              <MaterialIcons name="send" size={20} color="#06281A" />
            )}
          </Pressable>
        </View>
      </FadeUp>

      {/* Answer */}
      {result ? (
        <FadeUp index={3}>
          <View style={styles.answerCard}>
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.answerHead}>
              <MaterialIcons name="auto-awesome" size={16} color={MINT_BRIGHT} />
              <Text style={styles.answerLabel}>AI Answer</Text>
              {result.answer_source !== 'llm' ? (
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceBadgeText}>{result.answer_source}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.answerText}>{result.answer}</Text>
            {result.sources.length > 0 ? (
              <View style={styles.sourcesWrap}>
                <Text style={styles.sourcesTitle}>Sources</Text>
                {result.sources.map((s) => (
                  <View key={s.document_id} style={styles.sourceChip}>
                    <MaterialIcons name="menu-book" size={12} color={MINT_BRIGHT} />
                    <Text style={styles.sourceChipText} numberOfLines={1}>
                      {s.file_name}
                      {s.page_numbers.length > 0
                        ? `  ·  p. ${s.page_numbers.join(', ')}`
                        : ''}
                      {`  ·  ${(s.best_similarity * 100).toFixed(0)}% match`}
                      {s.chunk_count > 1 ? `  ·  ${s.chunk_count} chunks` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </FadeUp>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 60,
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    marginBottom: 14,
  },
  bannerText: { ...typography.bodySmall, color: '#EF4444', flex: 1 },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(53,212,122,0.45)',
    backgroundColor: 'rgba(37,31,50,0.55)',
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBody: { flex: 1 },
  uploadTitle: { ...typography.bodySemi, color: '#FFFFFF' },
  uploadDesc: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
    lineHeight: 17,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { ...typography.h3 },
  sectionCount: { ...typography.caption },
  loader: { marginVertical: 20 },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    gap: 8,
  },
  emptyTitle: { ...typography.bodySemi, marginTop: 8 },
  emptyDesc: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },
  docList: { gap: 10 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  docIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docBody: { flex: 1 },
  docName: { ...typography.bodySemi },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  docMeta: { ...typography.caption },
  docDot: { ...typography.caption, fontSize: 10 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  confirmCancel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
  },
  confirmBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.85)',
  },
  confirmDeleteText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
  askRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 10,
    paddingLeft: 16,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: 'rgba(37,31,50,0.72)',
  },
  askInput: {
    ...typography.body,
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingTop: 12,
    paddingBottom: 8,
    textAlignVertical: 'top',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8EF0A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(37,31,50,0.72)',
    overflow: 'hidden',
  },
  answerHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerLabel: {
    ...typography.bodySemi,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sourceBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,184,77,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,77,0.35)',
  },
  sourceBadgeText: { ...typography.caption, color: '#FFB84D', fontSize: 10 },
  answerText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 23,
    marginTop: 10,
  },
  sourcesWrap: { marginTop: 14, gap: 6 },
  sourcesTitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(53,212,122,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(53,212,122,0.25)',
  },
  sourceChipText: { ...typography.caption, color: 'rgba(142,240,163,0.9)' },
});
