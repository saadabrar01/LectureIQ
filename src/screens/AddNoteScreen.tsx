import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { AppButton } from '../components/AppButton';
import { GlowBackground } from '../components/GlowBackground';
import { lectures, notes } from '../data/mock';
import { haptics } from '../utils/helpers';

const MINT = '#22C55E';
const MINT_BRIGHT = '#34D399';
const CARD_BG = 'rgba(38,38,38,0.85)';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const COLORS = ['#8EF0A3', '#9F8FF0', '#FBBF24', '#F9A8A8', '#7FC4F5', '#F5A9A9'];
const FORMATS = [
  { key: 'bold', icon: 'format-bold' },
  { key: 'italic', icon: 'format-italic' },
  { key: 'bullet', icon: 'format-list-bulleted' },
  { key: 'heading', icon: 'title' },
];

export function AddNoteScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { noteId } = route.params as { noteId?: string } | undefined ?? {};

  const existing = noteId ? notes.find((n) => n.id === noteId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [color, setColor] = useState(existing?.color ?? COLORS[0]);
  const [lectureId, setLectureId] = useState(existing?.lectureId ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [saved]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 2500);
    return () => clearTimeout(t);
  }, [error]);

  const save = () => {
    if (!title.trim()) {
      setError('Add a title before saving');
      return;
    }
    haptics.success();
    setSaved(true);
    setTimeout(() => navigation.goBack(), 600);
  };

  return (
    <GlowBackground>
      <View style={styles.container}>
        <Header
          title={existing ? 'Edit Note' : 'New Note'}
          subtitle={saved ? 'Saved successfully' : 'Auto-saves on device'}
          back
          right={
            saved ? (
              <View style={[styles.savedIcon, { backgroundColor: MINT }]}>
                <MaterialIcons name="check" size={16} color="#fff" />
              </View>
            ) : undefined
          }
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <Animated.View entering={FadeInDown.duration(250)} style={[styles.banner, { borderColor: '#EF4444' + '44' }]}>
              <MaterialIcons name="error-outline" size={16} color="#EF4444" />
              <Text style={styles.bannerText}>{error}</Text>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.duration(300).delay(60)}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    haptics.light();
                    setColor(c);
                  }}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotActive,
                    color === c && { shadowColor: c, shadowOpacity: 0.5, shadowRadius: 8 },
                  ]}
                >
                  {color === c ? (
                    <MaterialIcons name="check" size={13} color="#1A1A1A" />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(120)}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Note title"
              placeholderTextColor={theme.textSecondary}
              style={[styles.titleInput, { color: theme.textPrimary }]}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(180)}>
            <View style={[styles.editorCard, { borderLeftColor: color }]}>
              <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[styles.toolbar, { borderBottomColor: HAIRLINE }]}>
                {FORMATS.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => haptics.light()}
                    style={({ pressed }) => [
                      styles.toolBtn,
                      pressed && { backgroundColor: 'rgba(34,197,94,0.12)' },
                    ]}
                  >
                    <MaterialIcons name={f.icon as never} size={17} color={MINT_BRIGHT} />
                  </Pressable>
                ))}
                <View style={styles.toolSpacer} />
                <Pressable
                  onPress={() => haptics.light()}
                  style={({ pressed }) => [
                    styles.toolBtn,
                    pressed && { backgroundColor: 'rgba(143,160,232,0.12)' },
                  ]}
                >
                  <MaterialIcons name="attach-file" size={17} color="#8EA6E8" />
                </Pressable>
              </View>

              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Write your notes here..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.contentInput, { color: theme.textPrimary }]}
                multiline
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(240)}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Link to a lecture (optional)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              <Pressable
                onPress={() => {
                  haptics.light();
                  setLectureId('');
                }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: lectureId === '' ? MINT + '22' : CARD_BG,
                    borderColor: lectureId === '' ? MINT_RING : HAIRLINE,
                  },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <MaterialIcons
                  name="close"
                  size={15}
                  color={lectureId === '' ? MINT_BRIGHT : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: lectureId === '' ? MINT_BRIGHT : theme.textSecondary },
                  ]}
                >
                  None
                </Text>
              </Pressable>
              {lectures.map((l) => {
                const selected = lectureId === l.id;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => {
                      haptics.light();
                      setLectureId(l.id);
                    }}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: selected ? MINT + '22' : CARD_BG,
                        borderColor: selected ? MINT_RING : HAIRLINE,
                      },
                      pressed && { transform: [{ scale: 0.96 }] },
                    ]}
                  >
                    <MaterialIcons
                      name="smart-display"
                      size={15}
                      color={selected ? MINT_BRIGHT : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? MINT_BRIGHT : theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {l.title.length > 28 ? l.title.slice(0, 28) + '…' : l.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(300)}>
            <AppButton title="Save Note" variant="gradient" onPress={save} style={styles.save} />
          </Animated.View>
        </ScrollView>
      </View>
    </GlowBackground>
  );
}

const MINT_RING = 'rgba(34,197,94,0.55)';

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60, maxWidth: 900, width: '100%' },
  savedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 10,
    marginTop: 10,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: { borderWidth: 2, borderColor: '#1A1A1A' },
  titleInput: {
    ...typography.h2,
    marginBottom: 14,
    paddingVertical: 4,
  },
  editorCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: HAIRLINE,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolSpacer: { flex: 1 },
  contentInput: {
    ...typography.body,
    minHeight: 220,
    padding: 16,
    lineHeight: 24,
  },
  chipScroll: { gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { ...typography.bodySmall, maxWidth: 220 },
  save: { marginTop: 24 },
});
