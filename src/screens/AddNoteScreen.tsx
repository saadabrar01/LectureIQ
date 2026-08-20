import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { GlowBackground } from '../components/GlowBackground';
import { lectures, notes } from '../data/mock';
import { haptics } from '../utils/helpers';

const COLORS = ['#8EF0A3', '#9F8FF0', '#FBBF24', '#F9A8A8', '#7FC4F5', '#F5A9A9'];
const FORMATS = [
  { key: 'bold', icon: 'format-bold' },
  { key: 'italic', icon: 'format-italic' },
  { key: 'bullet', icon: 'format-list-bulleted' },
  { key: 'heading', icon: 'title' },
];

export function AddNoteScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { noteId } = route.params as { noteId?: string } | undefined ?? {};

  const existing = noteId ? notes.find((n) => n.id === noteId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [color, setColor] = useState(existing?.color ?? COLORS[0]);
  const [lectureId, setLectureId] = useState(existing?.lectureId ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [saved]);

  const save = () => {
    haptics.success();
    setSaved(true);
    setTimeout(() => navigation.goBack(), 600);
  };

  const attachFile = () => {
    Alert.alert(
      'Attach a file',
      'Choose how you want to add content to this note',
      [
        { text: 'Upload PDF', onPress: () => haptics.light() },
        { text: 'Upload image (OCR)', onPress: () => haptics.light() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
            <View style={[styles.savedIcon, { backgroundColor: theme.primary }]}>
              <MaterialIcons name="check" size={18} color={theme.primaryDeep} />
            </View>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
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
              ]}
            >
              {color === c ? (
                <MaterialIcons name="check" size={14} color="#1A1A1A" />
              ) : null}
            </Pressable>
          ))}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Note title"
          placeholderTextColor={theme.textSecondary}
          style={[styles.titleInput, { color: theme.textPrimary }]}
        />

        <AppCard style={[styles.editorCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
          <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
            {FORMATS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => haptics.light()}
                style={[styles.toolBtn, { backgroundColor: theme.surfaceAlt }]}
              >
                <MaterialIcons name={f.icon as never} size={18} color={theme.primaryDark} />
              </Pressable>
            ))}
            <View style={styles.toolSpacer} />
            <Pressable onPress={attachFile} style={[styles.toolBtn, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialIcons name="attach-file" size={18} color={theme.secondary} />
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
        </AppCard>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Link to a lecture (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lectureRow}>
          <Pressable
            onPress={() => {
              haptics.light();
              setLectureId('');
            }}
            style={[
              styles.lectureChip,
              {
                backgroundColor: lectureId === '' ? theme.primary : theme.surfaceAlt,
                borderColor: lectureId === '' ? theme.primaryDark : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.lectureChipText,
                { color: lectureId === '' ? theme.primaryDeep : theme.textSecondary },
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
                style={[
                  styles.lectureChip,
                  {
                    backgroundColor: selected ? theme.primary : theme.surfaceAlt,
                    borderColor: selected ? theme.primaryDark : theme.border,
                  },
                ]}
              >
                <MaterialIcons
                  name="smart-display"
                  size={16}
                  color={selected ? theme.primaryDeep : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.lectureChipText,
                    { color: selected ? theme.primaryDeep : theme.textSecondary },
                  ]}
                >
                  {l.title.length > 26 ? l.title.slice(0, 26) + '…' : l.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <AppButton title="Save Note" variant="gradient" onPress={save} style={styles.save} />
      </ScrollView>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60, maxWidth: 900, width: '100%' },
  savedIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotActive: { borderWidth: 2, borderColor: '#1A1A1A' },
  titleInput: {
    ...typography.h2,
    marginBottom: 14,
    paddingVertical: 4,
  },
  editorCard: { padding: 0, overflow: 'hidden' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderBottomWidth: 1,
  },
  toolBtn: {
    width: 36,
    height: 36,
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
  label: { ...typography.caption, marginTop: 18, marginBottom: 10 },
  lectureRow: { flexDirection: 'row' },
  lectureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  lectureChipText: { ...typography.bodySmall, maxWidth: 220 },
  save: { marginTop: 28 },
});