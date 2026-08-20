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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { ThinkingBubble } from '../components/TypingDots';
import { GlowBackground } from '../components/GlowBackground';
import { chatMessages, lectures, type ChatMessage } from '../data/mock';
import { formatClock, haptics } from '../utils/helpers';

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
          <View style={[styles.userBubble, { backgroundColor: theme.primary }]}>
            <Text style={[styles.messageText, { color: theme.primaryDeep }]}>
              {item.text}
            </Text>
          </View>
        </Animated.View>
      );
    }
    return (
      <Animated.View entering={FadeInDown.duration(250)} style={styles.aiRow}>
        <View style={[styles.aiAvatar, { backgroundColor: theme.secondary }]}>
          <MaterialIcons name="auto-awesome" size={16} color="#fff" />
        </View>
        <View style={styles.aiColumn}>
          <View style={[styles.aiBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.messageText, { color: theme.textPrimary }]}>
              {item.text}
            </Text>
          </View>
          {item.citations && item.citations.length > 0 ? (
            <View style={styles.citationRow}>
              {item.citations.map((c) => (
                <Pressable key={c.time} style={[styles.citation, { backgroundColor: theme.surfaceAlt }]}>
                  <MaterialIcons name="play-arrow" size={14} color={theme.primaryDark} />
                  <Text style={[styles.citationText, { color: theme.primaryDark }]}>
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
        <Header
          title={lecture.channel}
          subtitle={lecture.title}
          back
          right={
            <Pressable onPress={() => navigation.navigate('Summary', { lectureId })}>
              <MaterialIcons name="summarize" size={24} color={theme.primaryDark} />
            </Pressable>
          }
        />

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
          contentContainerStyle={[styles.messages, { paddingBottom: 16 }]}
          ListFooterComponent={thinking ? <ThinkingBubble /> : null}
        />

        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View style={[styles.inputWrap, { backgroundColor: theme.surfaceAlt }]}>
            <TextInput
              placeholder="Ask anything about this lecture..."
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.primaryDark}
              value={input}
              onChangeText={setInput}
              style={[styles.input, { color: theme.textPrimary }]}
              multiline
            />
            <Pressable
              onPress={() => navigation.navigate('Voice', { lectureId })}
              style={[styles.micBtn, { backgroundColor: theme.mic, transform: [{ scale: 1 }] }]}
            >
              <MaterialIcons name="mic" size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={send}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: input.trim() ? theme.primaryDark : theme.surfaceAlt,
                },
              ]}
            >
              <MaterialIcons name="send" size={18} color={input.trim() ? '#fff' : theme.textSecondary} />
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
  messages: { paddingHorizontal: 20, paddingTop: 8, gap: 10, maxWidth: 900, width: '100%' },
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  aiRow: { flexDirection: 'row', gap: 8, maxWidth: '95%' },
  aiColumn: { flex: 1 },
  aiBubble: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageText: { ...typography.body },
  citationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  citation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  citationText: { ...typography.caption },
  savedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 4 },
  savedText: { ...typography.caption },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  input: {
    flex: 1,
    ...typography.body,
    maxHeight: 110,
    minHeight: 38,
    paddingTop: 10,
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});