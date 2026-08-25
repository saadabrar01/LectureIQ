/**
 * DocumentChatScreen — a dedicated Q&A chat screen for a single indexed document.
 * Design mirrors ChatScreen (lectures) exactly: blurred header with document name,
 * bubble-style chat messages, real RAG answers via documentsApi.ask(), and a
 * bottom input pill with send button.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { ThinkingBubble } from '../components/TypingDots';
import { GlowBackground } from '../components/GlowBackground';
import { documentsApi, type AskRagResult, type ApiError } from '../services/api';
import { haptics } from '../utils/helpers';

const MINT = '#22C55E';
const MINT_BRIGHT = '#34D399';
const BUBBLE_USER = MINT;
const BUBBLE_AI = 'rgba(38,38,38,0.92)';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const HEADER_HEIGHT = 62;

const SUGGESTED_PROMPTS = [
  'Summarize this document',
  'What are the key points?',
  'List the main concepts',
  'What is the conclusion?',
];

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  sources?: AskRagResult['sources'];
  isIrrelevant?: boolean;
}

export function DocumentChatScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { documentId, documentName, fileType } = route.params as {
    documentId: number;
    documentName: string;
    fileType: string;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(
      () => listRef.current?.scrollToEnd({ animated: true }),
      100
    );
    return () => clearTimeout(t);
  }, [messages.length, thinking]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const send = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || thinking) return;

    haptics.light();
    if (!customText) setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);

    try {
      const result = await documentsApi.askDocument(documentId, text);
      const isIrrelevant =
        result.answer.toLowerCase().includes('irrelevant') ||
        result.answer.toLowerCase().includes('not contain enough');

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'ai',
        text: result.answer,
        sources: isIrrelevant ? [] : result.sources,
        isIrrelevant,
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      haptics.warning();
      const msg = (err as ApiError)?.message ?? 'Failed to get an answer';
      setError(msg);
      const errMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'ai',
        text: `⚠️ ${msg}`,
        isIrrelevant: false,
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setThinking(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    if (isUser) {
      return (
        <Animated.View entering={FadeInUp.duration(250)} style={styles.userRow}>
          <View style={[styles.bubbleBase, styles.userBubble, { backgroundColor: BUBBLE_USER }]}>
            <Text style={styles.userText}>{item.text}</Text>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.duration(250)} style={styles.aiRow}>
        {/* AI Avatar */}
        <LinearGradient
          colors={item.isIrrelevant ? ['#EF4444', '#DC2626'] : ['#35D47A', '#22C55E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiAvatar}
        >
          <MaterialIcons
            name={item.isIrrelevant ? 'warning-amber' : 'auto-awesome'}
            size={14}
            color={item.isIrrelevant ? '#FFFFFF' : '#06281A'}
          />
        </LinearGradient>

        <View style={styles.aiColumn}>
          <View
            style={[
              styles.bubbleBase,
              styles.aiBubble,
              item.isIrrelevant && styles.aiBubbleIrrelevant,
            ]}
          >
            <Text
              style={[
                styles.aiText,
                { color: item.isIrrelevant ? '#FCA5A5' : theme.textPrimary },
              ]}
            >
              {item.text}
            </Text>
          </View>

          {/* Source citations like lecture citations */}
          {!item.isIrrelevant && item.sources && item.sources.length > 0 ? (
            <View style={styles.citationRow}>
              {item.sources.map((s) => (
                <View key={s.document_id} style={styles.citation}>
                  <MaterialIcons name="description" size={12} color={MINT_BRIGHT} />
                  <Text style={styles.citationText} numberOfLines={1}>
                    {s.page_numbers.length > 0
                      ? `Page ${s.page_numbers.slice(0, 2).join(', ')}`
                      : s.file_name}
                    {' · '}{(s.best_similarity * 100).toFixed(0)}% match
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  const isEmpty = messages.length === 0 && !thinking;

  return (
    <GlowBackground>
      <View style={styles.container}>
        {/* Header — matches ChatScreen exactly */}
        <View
          style={[
            styles.headerWrap,
            {
              paddingTop: insets.top,
              height: insets.top + HEADER_HEIGHT,
              borderBottomColor: HAIRLINE,
            },
          ]}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={({ pressed }) => [
                styles.headerIconBtn,
                pressed && { backgroundColor: 'rgba(255,255,255,0.08)' },
              ]}
            >
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </Pressable>

            <View style={styles.headerTitles}>
              <Text numberOfLines={1} style={styles.headerTitle}>
                {documentName}
              </Text>
              <Text numberOfLines={1} style={styles.headerSubtitle}>
                {fileType?.toUpperCase()} · AI Document Q&A
              </Text>
            </View>

            {/* Document type badge */}
            <View style={styles.headerDocBadge}>
              <LinearGradient
                colors={fileType === 'pdf' ? ['#35D47A', '#22C55E'] : ['#8EA6E8', '#38CFA8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerDocIcon}
              >
                <MaterialIcons
                  name={fileType === 'pdf' ? 'picture-as-pdf' : 'description'}
                  size={18}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messages,
              {
                paddingTop: insets.top + HEADER_HEIGHT + 14,
                paddingBottom: insets.bottom + 120,
              },
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isEmpty ? (
                /* Welcome / empty state shown before first message */
                <View style={styles.emptyState}>
                  <LinearGradient
                    colors={fileType === 'pdf' ? ['#35D47A', '#22C55E'] : ['#8EA6E8', '#38CFA8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyIcon}
                  >
                    <MaterialIcons
                      name={fileType === 'pdf' ? 'picture-as-pdf' : 'description'}
                      size={30}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                  <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                    {documentName}
                  </Text>
                  <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                    Ask anything about this document. The AI will search through it and give you an accurate answer.
                  </Text>

                  {/* Suggested prompts */}
                  <View style={styles.suggestRow}>
                    {SUGGESTED_PROMPTS.map((p) => (
                      <Pressable
                        key={p}
                        onPress={() => send(p)}
                        disabled={thinking}
                        style={({ pressed }) => [
                          styles.suggestChip,
                          pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        <MaterialIcons name="tips-and-updates" size={13} color={MINT_BRIGHT} />
                        <Text style={styles.suggestText}>{p}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null
            }
            ListFooterComponent={thinking ? <ThinkingBubble /> : null}
          />

          {/* Bottom Input Pill — identical to ChatScreen */}
          <View
            style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}
          >
            <View style={styles.inputPill}>
              <TextInput
                ref={inputRef}
                placeholder={`Ask about "${documentName}"...`}
                placeholderTextColor={theme.textSecondary}
                selectionColor={MINT_BRIGHT}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send()}
                style={[styles.input, { color: theme.textPrimary }]}
                multiline
              />
              <Pressable
                onPress={() => send()}
                disabled={!input.trim() || thinking}
                style={[
                  styles.sendBtn,
                  input.trim() && !thinking && {
                    backgroundColor: MINT,
                    borderColor: 'transparent',
                  },
                ]}
              >
                <MaterialIcons
                  name="send"
                  size={18}
                  color={input.trim() && !thinking ? '#fff' : theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Header
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    height: HEADER_HEIGHT,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitles: { flex: 1, gap: 2 },
  headerTitle: {
    ...typography.bodySemi,
    color: '#fff',
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
  },
  headerDocBadge: {},
  headerDocIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messages: {
    paddingHorizontal: 20,
    gap: 10,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: MINT,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  suggestText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },

  // Chat Bubbles
  userRow: { alignItems: 'flex-end', paddingLeft: 48 },
  bubbleBase: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
  },
  userBubble: {
    maxWidth: '82%',
    borderBottomRightRadius: 6,
    shadowColor: MINT,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  userText: {
    ...typography.body,
    color: '#fff',
  },
  aiRow: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: '95%',
    paddingRight: 32,
    alignItems: 'flex-start',
  },
  aiColumn: { flex: 1 },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    backgroundColor: BUBBLE_AI,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  aiBubbleIrrelevant: {
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(50,20,20,0.92)',
  },
  aiText: {
    ...typography.body,
    lineHeight: 23,
  },

  // Source citations
  citationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  citation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.30)',
    backgroundColor: 'transparent',
    maxWidth: 240,
  },
  citationText: {
    ...typography.caption,
    color: MINT_BRIGHT,
    flex: 1,
  },

  // Input bar
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 30,
    backgroundColor: 'rgba(38,38,38,0.92)',
    borderWidth: 1,
    borderColor: HAIRLINE,
    paddingLeft: 18,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  input: {
    flex: 1,
    ...typography.body,
    maxHeight: 110,
    minHeight: 38,
    paddingTop: 9,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
