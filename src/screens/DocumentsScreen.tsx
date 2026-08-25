import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeInDown, FadeOutRight, Layout } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { FadeUp } from '../components/FadeUp';
import { Header } from '../components/Header';
import { haptics } from '../utils/helpers';
import { documentsApi, ApiError, IndexedDocument, AskRagResult } from '../services/api';

const MAX_MB = 20;
const CARD_BG = 'rgba(37,31,50,0.72)';
const HAIRLINE = 'rgba(255,255,255,0.09)';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
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

const TYPE_GRADIENTS: Record<string, [string, string]> = {
  pdf: ['#35D47A', '#22C55E'],
  docx: ['#8EA6E8', '#38CFA8'],
  doc: ['#8EA6E8', '#38CFA8'],
};

const SUGGESTED_PROMPTS = [
  'Summarize this document',
  'What are the key takeaways?',
  'Explain the main concepts',
];

export function DocumentsScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const inputRef = useRef<TextInput>(null);
  const { width } = useWindowDimensions();

  // Responsive column calculation: 3 cards per row on wide screens
  const numColumns = width > 768 ? 3 : width > 500 ? 2 : 1;
  const cardWidth = numColumns === 3 ? '31.8%' : numColumns === 2 ? '48.5%' : '100%';

  const [docs, setDocs] = useState<IndexedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<IndexedDocument | null>(null);
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
      const list = await documentsApi.list();
      setDocs(list);
      setSelectedDoc((prev) => (prev ? list.find((d) => d.id === prev.id) || null : null));
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
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const toggleSelectDoc = (doc: IndexedDocument) => {
    haptics.light();
    if (selectedDoc?.id === doc.id) {
      setSelectedDoc(null);
    } else {
      setSelectedDoc(doc);
    }
  };

  const askDocumentAction = (doc: IndexedDocument) => {
    haptics.light();
    setSelectedDoc(doc);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const pickAndUpload = async () => {
    haptics.light();
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/octet-stream',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });
      const asset = res.canceled ? undefined : res.assets?.[0];
      if (!asset) return;

      if ((asset.size ?? 0) > MAX_MB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${MAX_MB} MB.`);
        return;
      }

      setUploading(true);
      const uploaded = await documentsApi.upload({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        file: Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
      });
      haptics.success();

      const newList = await documentsApi.list();
      setDocs(newList);
      const match = newList.find((d) => d.id === uploaded.document_id);
      if (match) {
        setSelectedDoc(match);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
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
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
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

  const ask = async (customQ?: string) => {
    const q = (customQ ?? question).trim();
    if (!q || asking) return;
    if (customQ) setQuestion(customQ);
    haptics.light();
    setAsking(true);
    try {
      const res = await documentsApi.ask(q, selectedDoc?.id);
      setResult(res);
    } catch (err) {
      haptics.warning();
      setError((err as ApiError)?.message ?? 'Could not answer');
    } finally {
      setAsking(false);
    }
  };

  const totalPages = docs.reduce((acc, d) => acc + (d.num_pages || 0), 0);
  const totalChunks = docs.reduce((acc, d) => acc + (d.num_chunks || 0), 0);
  const isIrrelevant =
    result?.answer?.toLowerCase().includes('irrelevant') ||
    result?.answer?.toLowerCase().includes('not contain enough');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Header
        title="Knowledge Base"
        subtitle="Upload & interact with your PDF or Word documents"
        back
        onBack={() => navigation.goBack()}
      />

      {/* Error Alert */}
      {error ? (
        <Animated.View entering={FadeInDown.duration(250)} style={[styles.banner, { borderColor: '#EF444444' }]}>
          <MaterialIcons name="error-outline" size={18} color="#EF4444" />
          <Text style={styles.bannerText}>{error}</Text>
          <Pressable onPress={() => setError('')} hitSlop={6}>
            <MaterialIcons name="close" size={16} color="#EF4444" />
          </Pressable>
        </Animated.View>
      ) : null}

      {/* Stats Summary Bar */}
      <FadeUp index={0}>
        <View style={styles.statsBar}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.statBox}>
            <MaterialIcons name="folder-zip" size={20} color="#34D399" />
            <View>
              <Text style={styles.statVal}>{docs.length}</Text>
              <Text style={styles.statLbl}>Documents</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <MaterialIcons name="auto-stories" size={20} color="#8EA6E8" />
            <View>
              <Text style={styles.statVal}>{totalPages}</Text>
              <Text style={styles.statLbl}>Pages</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <MaterialIcons name="grid-view" size={20} color="#FFB84D" />
            <View>
              <Text style={styles.statVal}>{totalChunks}</Text>
              <Text style={styles.statLbl}>Chunks</Text>
            </View>
          </View>
        </View>
      </FadeUp>

      {/* Upload Card */}
      <FadeUp index={1}>
        <Pressable
          onPress={pickAndUpload}
          disabled={uploading}
          style={({ pressed }) => [
            styles.uploadCard,
            uploading && styles.uploadingCard,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['#35D47A', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadIconBg}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <MaterialIcons name="cloud-upload" size={24} color="#FFFFFF" />
            )}
          </LinearGradient>
          <View style={styles.uploadBody}>
            <Text style={styles.uploadTitle}>
              {uploading ? 'Extracting & Indexing Document…' : 'Upload PDF or Word Document'}
            </Text>
            <Text style={styles.uploadDesc}>
              {uploading
                ? 'Parsing text, generating vector embeddings & indexing pages.'
                : 'Select PDF or DOCX up to 20MB for targeted Q&A'}
            </Text>
          </View>
          <View style={styles.uploadActionCircle}>
            <MaterialIcons name="arrow-forward" size={16} color="rgba(142,240,163,0.85)" />
          </View>
        </Pressable>
      </FadeUp>

      {/* Documents Section Header */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionHeaderTitle}>
          <MaterialIcons name="library-books" size={20} color={theme.textPrimary} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Your Uploaded Documents
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{docs.length}</Text>
          </View>
        </View>
        {selectedDoc ? (
          <Pressable onPress={() => setSelectedDoc(null)} style={styles.clearSelectBtn}>
            <MaterialIcons name="filter-alt-off" size={14} color="#34D399" />
            <Text style={styles.clearSelectText}>Reset Filter</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 3-Column Document Cards Grid */}
      {loadingDocs ? (
        <ActivityIndicator color="#8EF0A3" style={styles.loader} />
      ) : docs.length === 0 ? (
        <View style={styles.emptyCard}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <MaterialIcons name="note-add" size={44} color="rgba(255,255,255,0.22)" />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            No documents indexed yet
          </Text>
          <Text style={[styles.emptyDesc, { color: 'rgba(255,255,255,0.4)' }]}>
            Upload a PDF or DOCX above to see document cards here!
          </Text>
        </View>
      ) : (
        <View style={styles.docGrid}>
          {docs.map((doc) => {
            const grad = TYPE_GRADIENTS[doc.file_type] ?? TYPE_GRADIENTS.pdf;
            const isSelected = selectedDoc?.id === doc.id;
            const isDeleting = deletingId === doc.id;
            const isConfirming = confirmDeleteId === doc.id;

            return (
              <Animated.View
                key={doc.id}
                entering={FadeInDown.duration(280)}
                exiting={FadeOutRight.duration(250)}
                layout={Layout.springify()}
                style={{ width: cardWidth as any, minWidth: 220 }}
              >
                {/* Centered Image Style Processing Card */}
                <Pressable
                  onPress={() => askDocumentAction(doc)}
                  style={({ pressed }) => [
                    styles.centeredCard,
                    isSelected && styles.centeredCardSelected,
                    isDeleting && { opacity: 0.5 },
                    pressed && { transform: [{ scale: 0.985 }] },
                  ]}
                >
                  <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={
                      isSelected
                        ? ['rgba(53,212,122,0.12)', 'rgba(53,212,122,0.02)']
                        : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Delete Option Top Right */}
                  {isConfirming ? (
                    <View style={styles.topDeleteRow}>
                      <Pressable
                        onPress={() => confirmDelete(doc)}
                        style={styles.confirmBtnDelete}
                      >
                        <Text style={styles.confirmDeleteText}>Confirm</Text>
                      </Pressable>
                      <Pressable onPress={cancelDelete} style={styles.confirmBtnCancel}>
                        <Text style={styles.confirmCancelText}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(doc);
                      }}
                      disabled={isDeleting}
                      style={styles.deleteTopBtn}
                      hitSlop={8}
                    >
                      <MaterialIcons name="delete-outline" size={16} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                  )}

                  {/* Centered Circular Icon Circle */}
                  <View style={styles.centeredIconWrap}>
                    <LinearGradient
                      colors={isSelected ? ['#35D47A', '#22C55E'] : grad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.centeredIconBg}
                    >
                      <MaterialIcons
                        name={doc.file_type === 'pdf' ? 'picture-as-pdf' : 'description'}
                        size={24}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                  </View>

                  {/* Centered Document Name */}
                  <Text
                    style={[
                      styles.centeredTitle,
                      { color: isSelected ? '#34D399' : '#FFFFFF' },
                    ]}
                    numberOfLines={2}
                  >
                    {doc.file_name}
                  </Text>

                  {/* Centered Description / Meta (Size, Pages, Date) */}
                  <Text style={styles.centeredSubtitle}>
                    {formatBytes(doc.file_size)}  ·  {doc.num_pages} page{doc.num_pages !== 1 ? 's' : ''}  ·  {formatDate(doc.created_at)}
                  </Text>

                  {/* Targeted Active Badge if Selected */}
                  {isSelected ? (
                    <View style={styles.centeredActiveBadge}>
                      <MaterialIcons name="check-circle" size={12} color="#35D47A" />
                      <Text style={styles.centeredActiveText}>Selected for Q&A</Text>
                    </View>
                  ) : null}

                  {/* Centered Circular Arrow Action Button */}
                  <View
                    style={[
                      styles.centeredActionCircle,
                      isSelected && styles.centeredActionCircleSelected,
                    ]}
                  >
                    <MaterialIcons
                      name={isSelected ? 'chat-bubble' : 'arrow-forward'}
                      size={16}
                      color={isSelected ? '#06281A' : '#34D399'}
                    />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Ask Question Section Header */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionHeaderTitle}>
          <MaterialIcons name="psychology" size={22} color="#34D399" />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Ask Question (RAG System)
          </Text>
        </View>
      </View>

      {/* Target Scope Indicator Card */}
      <FadeUp index={2}>
        <View
          style={[
            styles.scopeCard,
            selectedDoc ? styles.scopeCardTargeted : styles.scopeCardAll,
          ]}
        >
          <MaterialIcons
            name={selectedDoc ? 'center-focus-strong' : 'travel-explore'}
            size={18}
            color={selectedDoc ? '#35D47A' : '#8EA6E8'}
          />
          <Text style={styles.scopeText}>
            {selectedDoc ? (
              <>
                Asking from: <Text style={styles.scopeBold}>{selectedDoc.file_name}</Text>
              </>
            ) : (
              <>Searching across: <Text style={styles.scopeBold}>All {docs.length} Uploaded Documents</Text></>
            )}
          </Text>
          {selectedDoc ? (
            <Pressable
              onPress={() => setSelectedDoc(null)}
              style={styles.scopeClearBtn}
              hitSlop={6}
            >
              <Text style={styles.scopeClearText}>Clear Target</Text>
              <MaterialIcons name="close" size={14} color="#35D47A" />
            </Pressable>
          ) : null}
        </View>

        {/* Suggested Prompts */}
        {docs.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promptsRow}
          >
            {SUGGESTED_PROMPTS.map((p) => (
              <Pressable
                key={p}
                onPress={() => ask(p)}
                disabled={asking}
                style={({ pressed }) => [
                  styles.promptChip,
                  pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
                ]}
              >
                <MaterialIcons name="tips-and-updates" size={13} color="#34D399" />
                <Text style={styles.promptChipText}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* Question Input Box */}
        <View style={[styles.askRow, { borderColor: 'rgba(255,255,255,0.12)' }]}>
          <TextInput
            ref={inputRef}
            value={question}
            onChangeText={setQuestion}
            placeholder={
              docs.length === 0
                ? 'Upload a document above first…'
                : selectedDoc
                ? `Type your question about "${selectedDoc.file_name}"…`
                : 'Type your question across all documents…'
            }
            placeholderTextColor="rgba(255,255,255,0.38)"
            editable={docs.length > 0}
            multiline
            style={[styles.askInput, { color: theme.textPrimary }]}
          />
          <Pressable
            onPress={() => ask()}
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

      {/* RAG Answer Output */}
      {result ? (
        <FadeUp index={3}>
          <View
            style={[
              styles.answerCard,
              isIrrelevant && styles.answerCardIrrelevant,
            ]}
          >
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={
                isIrrelevant
                  ? ['rgba(239,68,68,0.1)', 'rgba(255,255,255,0.01)']
                  : ['rgba(53,212,122,0.08)', 'rgba(255,255,255,0.01)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.answerHead}>
              <LinearGradient
                colors={isIrrelevant ? ['#EF4444', '#DC2626'] : ['#35D47A', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.answerIconWrap}
              >
                <MaterialIcons
                  name={isIrrelevant ? 'warning-amber' : 'auto-awesome'}
                  size={14}
                  color={isIrrelevant ? '#FFFFFF' : '#06281A'}
                />
              </LinearGradient>

              <Text style={styles.answerLabel}>
                {isIrrelevant ? 'Irrelevant Question Warning' : 'AI RAG Response'}
              </Text>

              <View
                style={[
                  styles.sourceBadge,
                  isIrrelevant && styles.sourceBadgeIrrelevant,
                ]}
              >
                <Text
                  style={[
                    styles.sourceBadgeText,
                    isIrrelevant && { color: '#EF4444' },
                  ]}
                >
                  {isIrrelevant ? 'Irrelevant Query' : result.answer_source}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.answerText,
                isIrrelevant && styles.answerTextIrrelevant,
              ]}
            >
              {result.answer}
            </Text>

            {/* Retrieved Context Sources */}
            {!isIrrelevant && result.sources.length > 0 ? (
              <View style={styles.sourcesWrap}>
                <Text style={styles.sourcesTitle}>Retrieved Document Sources</Text>
                {result.sources.map((s) => (
                  <View key={s.document_id} style={styles.sourceChip}>
                    <MaterialIcons name="description" size={14} color="#34D399" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sourceChipTitle} numberOfLines={1}>
                        {s.file_name}
                      </Text>
                      <Text style={styles.sourceChipMeta}>
                        {s.page_numbers.length > 0
                          ? `Page ${s.page_numbers.join(', ')}  ·  `
                          : ''}
                        {(s.best_similarity * 100).toFixed(0)}% match
                        {s.chunk_count > 1 ? `  ·  ${s.chunk_count} chunks` : ''}
                      </Text>
                    </View>
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
    paddingHorizontal: 20,
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

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: CARD_BG,
    marginBottom: 18,
    overflow: 'hidden',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statVal: {
    ...typography.bodySemi,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  statLbl: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Upload CTA
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: CARD_BG,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  uploadingCard: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(53,212,122,0.1)',
  },
  uploadIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
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
  uploadActionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(53,212,122,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Headers
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { ...typography.h3, fontSize: 18 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  countBadgeText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  clearSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(53,212,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(53,212,122,0.25)',
  },
  clearSelectText: {
    ...typography.caption,
    color: '#34D399',
    fontWeight: '600',
    fontSize: 11,
  },

  loader: { marginVertical: 20 },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    gap: 8,
    marginBottom: 20,
  },
  emptyTitle: { ...typography.bodySemi, marginTop: 8 },
  emptyDesc: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },

  // --- 3-COLUMN GRID DISPLAY ---
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  centeredCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(37,31,50,0.72)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
    position: 'relative',
    minHeight: 210,
    justifyContent: 'space-between',
  },
  centeredCardSelected: {
    borderColor: '#35D47A',
    backgroundColor: 'rgba(38,38,38,0.95)',
    shadowColor: '#35D47A',
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  topDeleteRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  confirmBtnDelete: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.85)',
  },
  confirmDeleteText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  confirmBtnCancel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  confirmCancelText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  deleteTopBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centeredIconWrap: {
    marginTop: 4,
    marginBottom: 10,
  },
  centeredIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredTitle: {
    ...typography.bodySemi,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  centeredSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 17,
    fontSize: 11,
    marginBottom: 12,
  },
  centeredActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(53,212,122,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(53,212,122,0.3)',
    marginBottom: 10,
  },
  centeredActiveText: {
    ...typography.caption,
    color: '#35D47A',
    fontSize: 10,
    fontWeight: '700',
  },
  centeredActionCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(53,212,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(53,212,122,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredActionCircleSelected: {
    backgroundColor: '#35D47A',
    borderColor: '#35D47A',
  },

  // Target Scope Indicator Card
  scopeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  scopeCardAll: {
    backgroundColor: 'rgba(142,166,232,0.08)',
    borderColor: 'rgba(142,166,232,0.25)',
  },
  scopeCardTargeted: {
    backgroundColor: 'rgba(53,212,122,0.12)',
    borderColor: 'rgba(53,212,122,0.35)',
  },
  scopeText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
    fontSize: 12,
  },
  scopeBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scopeClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(53,212,122,0.2)',
  },
  scopeClearText: {
    ...typography.caption,
    color: '#35D47A',
    fontSize: 10,
    fontWeight: '700',
  },

  // Prompts Chips
  promptsRow: {
    gap: 8,
    paddingBottom: 10,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  promptChipText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
  },

  // Ask Input
  askRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 10,
    paddingLeft: 16,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: 'rgba(37,31,50,0.72)',
    marginBottom: 16,
  },
  askInput: {
    ...typography.body,
    flex: 1,
    minHeight: 46,
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

  // Answer Card
  answerCard: {
    marginTop: 10,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(53,212,122,0.25)',
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    shadowColor: '#35D47A',
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  answerCardIrrelevant: {
    borderColor: 'rgba(239,68,68,0.4)',
    shadowColor: '#EF4444',
  },
  answerHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answerIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLabel: {
    ...typography.bodySemi,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    fontWeight: '700',
  },
  sourceBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,184,77,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,77,0.35)',
  },
  sourceBadgeIrrelevant: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.35)',
  },
  sourceBadgeText: { ...typography.caption, color: '#FFB84D', fontSize: 10, fontWeight: '700' },
  answerText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 24,
    marginTop: 12,
  },
  answerTextIrrelevant: {
    color: '#FCA5A5',
    fontWeight: '500',
  },
  sourcesWrap: { marginTop: 16, gap: 8 },
  sourcesTitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(53,212,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(53,212,122,0.2)',
  },
  sourceChipTitle: { ...typography.bodySemi, color: '#FFFFFF', fontSize: 13 },
  sourceChipMeta: { ...typography.caption, color: 'rgba(142,240,163,0.85)', marginTop: 2, fontSize: 11 },
});
