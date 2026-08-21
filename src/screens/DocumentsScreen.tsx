import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { GlassCard } from '../components/GlassCard';
import { FadeUp } from '../components/FadeUp';
import { Header } from '../components/Header';
import { haptics } from '../utils/helpers';
import { documentsApi, ApiError, IndexedDocument, AskRagResult } from '../services/api';

const MAX_MB = 20;
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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

  const refresh = useCallback(async () => {
    try {
      setDocs(await documentsApi.list());
    } catch (err) {
      alertError(err, 'Could not load documents');
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const alertError = (err: unknown, fallback: string) => {
    const apiErr = err as ApiError;
    Alert.alert(fallback, apiErr?.message ?? 'Something went wrong.');
  };

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
        Alert.alert('File too large', `Maximum size is ${MAX_MB} MB.`);
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
      await refresh();
      Alert.alert(
        'Document indexed',
        `${asset.name}\n${uploaded.pages} page(s) - ${uploaded.chunks_stored} chunk(s) stored. You can now ask questions about it.`,
      );
    } catch (err) {
      haptics.warning();
      alertError(err, 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (doc: IndexedDocument) => {
    haptics.light();
    Alert.alert('Delete document', `Remove "${doc.file_name}" and its chunks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentsApi.remove(doc.id);
            setResult(null);
            await refresh();
          } catch (err) {
            alertError(err, 'Delete failed');
          }
        },
      },
    ]);
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
      alertError(err, 'Could not answer');
    } finally {
      setAsking(false);
    }
  };

  const renderDocRow = (doc: IndexedDocument) => (
    <GlassCard key={doc.id} style={styles.docCard} blur={14}>
      <View
        style={[
          styles.docIcon,
          { backgroundColor: doc.file_type === 'pdf' ? '#8EA6E826' : '#38CFA826' },
        ]}
      >
        <MaterialIcons
          name={doc.file_type === 'pdf' ? 'picture-as-pdf' : 'description'}
          size={20}
          color={doc.file_type === 'pdf' ? '#8EA6E8' : '#38CFA8'}
        />
      </View>
      <View style={styles.docBody}>
        <Text style={[styles.docName, { color: theme.textPrimary }]} numberOfLines={1}>
          {doc.file_name}
        </Text>
        <Text style={[styles.docMeta, { color: theme.textSecondary }]}>
          {doc.num_pages} page(s) - {doc.num_chunks} chunk(s)
        </Text>
      </View>
      <Pressable
        onPress={() => removeDoc(doc)}
        style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
        hitSlop={8}
      >
        <MaterialIcons name="delete-outline" size={20} color={theme.error} />
      </Pressable>
    </GlassCard>
  );

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

      {/* Indexed documents */}
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
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No documents yet. Upload a PDF or DOCX above to get started.
        </Text>
      ) : (
        <View style={styles.docList}>{docs.map(renderDocRow)}</View>
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
            <BlurOverlay />
            <View style={styles.answerHead}>
              <MaterialIcons name="auto-awesome" size={16} color="#8EF0A3" />
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
                    <MaterialIcons name="menu-book" size={12} color="#8EF0A3" />
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

// Subtle glass sheen shared by the answer card.
function BlurOverlay() {
  return (
    <>
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </>
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
  emptyText: { ...typography.bodySmall, lineHeight: 20 },
  docList: { gap: 10 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docBody: { flex: 1 },
  docName: { ...typography.bodySemi },
  docMeta: { ...typography.caption, marginTop: 2 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,107,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
