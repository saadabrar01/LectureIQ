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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { ThinkingBubble } from '../components/TypingDots';
import { GlowBackground } from '../components/GlowBackground';
import { chatMessages, lectures, type ChatMessage } from '../data/mock';
import { formatClock, haptics } from '../utils/helpers';

const MINT = '#22C55E';
const MINT_BRIGHT = '#34D399';
const BUBBLE_USER = MINT;
const BUBBLE_AI = 'rgba(38,38,38,0.92)';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const HEADER_HEIGHT = 58;

export function ChatScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { lectureId } = route.params as { lectureId: string };

  const lecture = lectures.find((l) => l.id === lectureId) ?? lectures[0];
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const t = setTimeout(
      () => listRef.current?.scrollToEnd({ animated: true }),
      100
    );
    return () => clearTimeout(t);
  }, [messages.length, thinking]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    haptics.light();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'ai',
        text: `Good question! Based on this lecture, here is what I found. The key idea connects directly to the material around the middle of the video where this topic was explained in detail.`,
        timestamp: new Date(),
        citations: [{ time: 171 }, { time: 210 }],
      };
      setMessages((m) => [...m, reply]);
      setThinking(false);
    }, 1800);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    if (isUser) {
      return (
        <Animated.View entering={FadeInUp.duration(250)} style={styles.userRow}>
          <View
            style={[
              styles.bubbleBase,
              styles.userBubble,
              { backgroundColor: BUBBLE_USER },
            ]}
          >
            <Text style={styles.userText}>{item.text}</Text>
          </View>
        </Animated.View>
      );
    }
    return (
      <Animated.View entering={FadeInDown.duration(250)} style={styles.aiRow}>
        <View style={styles.aiAvatar}>
          <MaterialIcons name="auto-awesome" size={15} color={MINT_BRIGHT} />
        </View>
        <View style={styles.aiColumn}>
          <View style={[styles.bubbleBase, styles.aiBubble]}>
            <Text style={[styles.aiText, { color: theme.textPrimary }]}>
              {item.text}
            </Text>
          </View>
          {item.citations && item.citations.length > 0 ? (
            <View style={styles.citationRow}>
              {item.citations.map((c) => (
                <Pressable
                  key={c.time}
                  onPress={() => haptics.light()}
                  style={({ pressed }) => [
                    styles.citation,
                    pressed && { backgroundColor: 'rgba(52,211,153,0.12)' },
                  ]}
                >
                  <MaterialIcons name="play-arrow" size={14} color={MINT_BRIGHT} />
                  <Text style={styles.citationText}>
                    From {formatClock(c.time)} in video
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {item.saved ? (
            <View style={styles.savedTag}>
              <MaterialIcons name="bookmark" size={12} color={theme.warning} />
              <Text style={[styles.savedText, { color: theme.warning }]}>Saved</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  return (
    <GlowBackground>
      <View style={styles.container}>
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
                {lecture.title}
              </Text>
              <Text numberOfLines={1} style={styles.headerSubtitle}>
                {lecture.channel}
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('QuizConfig', { lectureId })}
              hitSlop={10}
              style={({ pressed }) => [
                styles.headerIconBtn,
                styles.headerQuizBtn,
                pressed && { backgroundColor: 'rgba(34,197,94,0.22)' },
              ]}
            >
              <MaterialIcons name="quiz" size={20} color={MINT_BRIGHT} />
            </Pressable>
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
                paddingBottom: insets.bottom + 110,
              },
            ]}
            ListFooterComponent={thinking ? <ThinkingBubble /> : null}
          />

          <View
            style={[styles.inputBar, { paddingBottom: insets.bottom + 12, pointerEvents: 'box-none' }]}
          >
            <View style={styles.inputPill}>
              <TextInput
                placeholder="Ask anything about this lecture..."
                placeholderTextColor={theme.textSecondary}
                selectionColor={MINT_BRIGHT}
                value={input}
                onChangeText={setInput}
                style={[styles.input, { color: theme.textPrimary }]}
                multiline
              />
              <Pressable
                onPress={() => navigation.navigate('Voice', { lectureId })}
                style={({ pressed }) => [
                  styles.micBtn,
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}
              >
                <MaterialIcons name="mic" size={19} color="#fff" />
              </Pressable>
              <Pressable
                onPress={send}
                disabled={!input.trim()}
                style={[
                  styles.sendBtn,
                  input.trim() && {
                    backgroundColor: MINT,
                    borderColor: 'transparent',
                  },
                ]}
              >
                <MaterialIcons
                  name="send"
                  size={18}
                  color={input.trim() ? '#fff' : theme.textSecondary}
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
  headerQuizBtn: {
    borderColor: 'rgba(34,197,94,0.35)',
    backgroundColor: 'rgba(34,197,94,0.14)',
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
  messages: {
    paddingHorizontal: 20,
    gap: 10,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
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
  aiRow: { flexDirection: 'row', gap: 8, maxWidth: '95%', paddingRight: 32 },
  aiColumn: { flex: 1 },
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
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  aiText: {
    ...typography.body,
    lineHeight: 23,
  },
  citationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  citation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.30)',
    backgroundColor: 'transparent',
  },
  citationText: {
    ...typography.caption,
    color: MINT_BRIGHT,
  },
  savedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 4 },
  savedText: { ...typography.caption },
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
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MINT,
    shadowColor: MINT,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
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
