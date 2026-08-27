import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { GlowBackground } from '../components/GlowBackground';
import { lectures as mockLectures, transcript } from '../data/mock';
import { haptics } from '../utils/helpers';
import { getNoteById, persistNote, removeNote } from '../utils/notesStorage';
import { lecturesApi } from '../services/api';

const MINT = '#34D399';
const MINT_BRIGHT = '#2DD4BF';
const MINT_GRAD = ['#34D399', '#0EA5A0'] as const;
const MINT_RING = 'rgba(52,211,153,0.55)';
const CARD_BG = '#121E18';
const HAIRLINE = 'rgba(255,255,255,0.09)';

const COLORS = [
  '#34D399', // Emerald
  '#9F8FF0', // Lavender
  '#FBBF24', // Amber
  '#F87171', // Coral
  '#38BDF8', // Sky
  '#FB7185', // Rose
  '#8EF0A3', // Mint
  '#C084FC', // Purple
];

const AI_TOOLS = [
  {
    id: 'summarize',
    title: 'Summarize Key Takeaways',
    desc: 'Condense notes into high-yield study bullets',
    icon: 'auto-awesome',
  },
  {
    id: 'quiz',
    title: 'Generate Quiz Questions',
    desc: 'Create 3 active-recall review questions',
    icon: 'psychology',
  },
  {
    id: 'action',
    title: 'Extract Action Items',
    desc: 'Turn notes into an actionable checklist',
    icon: 'checklist',
  },
  {
    id: 'polish',
    title: 'Polish & Structure',
    desc: 'Improve formatting, grammar, and readability',
    icon: 'draw',
  },
  {
    id: 'lecture_extract',
    title: 'Import from Lecture',
    desc: 'Auto-fill key concepts from linked lecture transcript',
    icon: 'video-library',
  },
];

export function AddNoteScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const inputRef = useRef<TextInput>(null);

  const routeParams = (route.params as {
    noteId?: string;
    lectureId?: string;
    initialTitle?: string;
    initialContent?: string;
  } | undefined) ?? {};

  const noteId = routeParams.noteId;

  // Editor State
  const [loading, setLoading] = useState(Boolean(noteId));
  const [title, setTitle] = useState(routeParams.initialTitle ?? '');
  const [content, setContent] = useState(routeParams.initialContent ?? '');
  const [color, setColor] = useState(COLORS[0]);
  const [lectureId, setLectureId] = useState(routeParams.lectureId ?? '');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [allLectures, setAllLectures] = useState<any[]>(mockLectures);

  // UI State
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load lectures for linking
  useEffect(() => {
    lecturesApi.list().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setAllLectures(res);
      }
    }).catch(() => {});
  }, []);

  // Load existing note if editing
  useEffect(() => {
    let mounted = true;
    if (noteId) {
      setLoading(true);
      getNoteById(noteId)
        .then((found) => {
          if (!mounted) return;
          if (found) {
            setTitle(found.title);
            setContent(found.content);
            setColor(found.color || COLORS[0]);
            setLectureId(found.lectureId || '');
            setUpdatedAt(found.updatedAt);
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [noteId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Statistics
  const stats = useMemo(() => {
    const trimmed = content.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = content.length;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readMinutes };
  }, [content]);

  // Text formatting insertion helper
  const applyFormat = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    haptics.light();
    const replacement = `${prefix}${defaultPlaceholder}${suffix}`;
    setContent((prev) => (prev ? `${prev}\n${replacement}` : replacement));
    inputRef.current?.focus();
  };

  const handleToolbarAction = (type: string) => {
    switch (type) {
      case 'bold':
        applyFormat('**', '**', 'bold text');
        break;
      case 'italic':
        applyFormat('*', '*', 'italic text');
        break;
      case 'h1':
        applyFormat('# ', '', 'Main Topic Header');
        break;
      case 'h2':
        applyFormat('## ', '', 'Sub-Concept Section');
        break;
      case 'bullet':
        applyFormat('- ', '', 'Key point bullet');
        break;
      case 'checklist':
        applyFormat('- [ ] ', '', 'Task to complete');
        break;
      case 'quote':
        applyFormat('> ', '', 'Important lecture takeaway');
        break;
      case 'code':
        applyFormat('```\n', '\n```', '// Formula or Code');
        break;
      case 'ai':
        haptics.medium();
        setShowAiModal(true);
        break;
      case 'copy':
        handleCopyContent();
        break;
      default:
        break;
    }
  };

  const handleCopyContent = async () => {
    if (!content && !title) {
      setError('Nothing to copy yet');
      return;
    }
    const fullText = `${title ? title + '\n\n' : ''}${content}`;
    await Clipboard.setStringAsync(fullText);
    haptics.success();
    setToastMessage('Note copied to clipboard!');
  };

  // AI Helper Generator
  const runAiTool = async (toolId: string) => {
    haptics.medium();
    setAiGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      let generated = '';
      const currentText = content.trim();

      if (toolId === 'summarize') {
        generated = `\n\n### ⚡ Key Takeaways\n- **Core Concept**: ${title || 'Main Topic'} covers fundamental principles and mechanics.\n- **Key Mechanism**: Information is captured, structured, and synthesized for high recall.\n- **Exam Summary**: Focus on definitions, workflows, and core equations.`;
      } else if (toolId === 'quiz') {
        generated = `\n\n### 🧠 Review Questions\n1. **Q1:** What is the primary purpose of ${title || 'this topic'}?\n2. **Q2:** How does the mechanism behave under edge cases?\n3. **Q3:** Compare and contrast this with related architectures.`;
      } else if (toolId === 'action') {
        generated = `\n\n### 🎯 Action Checklist\n- [ ] Review lecture slides on ${title || 'topic'}\n- [ ] Test sample implementation in scratchpad\n- [ ] Complete practice quiz`;
      } else if (toolId === 'polish') {
        if (currentText) {
          const polished = currentText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((l) => (l.startsWith('-') || l.startsWith('#') ? l : `• ${l}`))
            .join('\n');
          setContent(`## ${title || 'Study Summary'}\n\n${polished}\n\n> *Refined with LectureIQ AI*`);
          setShowAiModal(false);
          setToastMessage('Note refined & structured!');
          setAiGenerating(false);
          return;
        } else {
          generated = `## ${title || 'Study Note'}\n\n- Detailed analysis and core principles.\n- Practical applications and review points.`;
        }
      } else if (toolId === 'lecture_extract') {
        const transcriptLines = transcript.slice(0, 4).map((t) => `- ${t.text}`).join('\n');
        generated = `\n\n### 📺 Lecture Key Points\n${transcriptLines}\n\n> *Source: Lecture Transcript*`;
      }

      setContent((prev) => (prev ? `${prev}${generated}` : generated.trim()));
      setShowAiModal(false);
      setToastMessage('AI enhancements added!');
    } catch {
      setError('AI assistant unavailable. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Save Note
  const save = async () => {
    if (!title.trim()) {
      setError('Please enter a note title');
      haptics.warning();
      return;
    }

    setIsSaving(true);
    haptics.success();

    try {
      await persistNote({
        id: noteId,
        title: title.trim(),
        content,
        lectureId: lectureId || undefined,
        color,
      });

      setToastMessage(noteId ? 'Note updated!' : 'Note created!');
      setTimeout(() => {
        navigation.goBack();
      }, 400);
    } catch (err: any) {
      setError('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Note
  const handleDelete = async () => {
    if (!noteId) return;
    setIsDeleting(true);
    try {
      await removeNote(noteId);
      haptics.medium();
      setShowDeleteConfirm(false);
      setToastMessage('Note deleted');
      setTimeout(() => {
        navigation.goBack();
      }, 400);
    } catch {
      setError('Could not delete note.');
      setIsDeleting(false);
    }
  };

  // Render formatted preview blocks
  const renderPreviewContent = () => {
    if (!content.trim()) {
      return (
        <View style={styles.emptyPreview}>
          <MaterialIcons name="edit-note" size={42} color={theme.textSecondary} />
          <Text style={[styles.emptyPreviewText, { color: theme.textSecondary }]}>
            Your formatted markdown preview will appear here as you write.
          </Text>
        </View>
      );
    }

    const lines = content.split('\n');
    return (
      <View style={styles.previewContainer}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (trimmed.startsWith('# ')) {
            return (
              <Text key={idx} style={[styles.previewH1, { color: theme.textPrimary }]}>
                {trimmed.slice(2)}
              </Text>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <Text key={idx} style={[styles.previewH2, { color: theme.textPrimary }]}>
                {trimmed.slice(3)}
              </Text>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <Text key={idx} style={[styles.previewH3, { color: color }]}>
                {trimmed.slice(4)}
              </Text>
            );
          }
          if (trimmed === '---' || trimmed === '***') {
            return <View key={idx} style={styles.previewDivider} />;
          }
          if (trimmed.startsWith('> ')) {
            return (
              <View key={idx} style={[styles.previewQuote, { borderLeftColor: color }]}>
                <Text style={[styles.previewQuoteText, { color: theme.textPrimary }]}>
                  {trimmed.slice(2)}
                </Text>
              </View>
            );
          }
          if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
            const checked = trimmed.startsWith('- [x] ');
            const taskText = trimmed.slice(6);
            return (
              <View key={idx} style={styles.previewTaskRow}>
                <MaterialIcons
                  name={checked ? 'check-box' : 'check-box-outline-blank'}
                  size={18}
                  color={checked ? MINT : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.previewTaskText,
                    { color: theme.textPrimary },
                    checked && styles.previewTaskDone,
                  ]}
                >
                  {taskText}
                </Text>
              </View>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return (
              <View key={idx} style={styles.previewBulletRow}>
                <View style={[styles.previewBulletDot, { backgroundColor: color }]} />
                <Text style={[styles.previewBulletText, { color: theme.textPrimary }]}>
                  {trimmed.slice(2)}
                </Text>
              </View>
            );
          }
          if (!trimmed) {
            return <View key={idx} style={{ height: 10 }} />;
          }
          return (
            <Text key={idx} style={[styles.previewParagraph, { color: theme.textPrimary }]}>
              {line}
            </Text>
          );
        })}
      </View>
    );
  };

  const selectedLecture = allLectures.find((l) => l.id === lectureId);

  if (loading) {
    return (
      <GlowBackground>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={MINT} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading note...</Text>
        </View>
      </GlowBackground>
    );
  }

  return (
    <GlowBackground>
      <View style={styles.container}>
        {/* TOP HEADER */}
        <Header
          title={noteId ? 'Edit Note' : 'New Note'}
          subtitle={
            updatedAt
              ? `Last saved ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Auto-saved locally & synced'
          }
          back
          right={
            <View style={styles.headerRightActions}>
              <Pressable
                onPress={handleCopyContent}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  pressed && { transform: [{ scale: 0.9 }] },
                ]}
                hitSlop={8}
              >
                <MaterialIcons name="content-copy" size={19} color={theme.textPrimary} />
              </Pressable>

              {noteId ? (
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setShowDeleteConfirm(true);
                  }}
                  style={({ pressed }) => [
                    styles.headerIconBtn,
                    { backgroundColor: 'rgba(248,113,113,0.14)' },
                    pressed && { transform: [{ scale: 0.9 }] },
                  ]}
                  hitSlop={8}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#F87171" />
                </Pressable>
              ) : null}
            </View>
          }
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOAST / ERROR NOTIFICATIONS */}
          {toastMessage ? (
            <Animated.View
              entering={FadeInDown.duration(260)}
              exiting={FadeOut.duration(200)}
              style={styles.toast}
            >
              <MaterialIcons name="check-circle" size={17} color={MINT} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          ) : null}

          {error ? (
            <Animated.View
              entering={FadeInDown.duration(260)}
              exiting={FadeOut.duration(200)}
              style={styles.errorBanner}
            >
              <MaterialIcons name="error-outline" size={18} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => setError('')} hitSlop={8}>
                <MaterialIcons name="close" size={16} color="rgba(248,113,113,0.7)" />
              </Pressable>
            </Animated.View>
          ) : null}

          {/* COLOR THEME SELECTOR */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Note Color Accent</Text>
              <Text style={[styles.colorCodeText, { color }]}>{color.toUpperCase()}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorRow}
            >
              {COLORS.map((c) => {
                const active = color === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => {
                      haptics.light();
                      setColor(c);
                    }}
                    style={({ pressed }) => [
                      styles.colorDot,
                      { backgroundColor: c },
                      active && {
                        borderColor: '#FFFFFF',
                        transform: [{ scale: 1.15 }],
                        shadowColor: c,
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                      },
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}
                  >
                    {active ? <MaterialIcons name="check" size={15} color="#06281A" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* TITLE INPUT */}
          <View style={styles.section}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Give your note a title..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={[
                styles.titleInput,
                {
                  color: theme.textPrimary,
                  borderBottomColor: color + '66',
                },
              ]}
              maxLength={120}
            />
          </View>

          {/* EDITOR / PREVIEW CARD */}
          <View
            style={[
              styles.editorCard,
              {
                borderColor: color + '55',
                backgroundColor: CARD_BG,
              },
            ]}
          >
            {/* Dynamic Accent Stripe */}
            <View style={[styles.editorAccent, { backgroundColor: color }]} />

            {/* Card Header with Edit/Preview Tabs & Stats */}
            <View style={[styles.editorCardHeader, { borderBottomColor: HAIRLINE }]}>
              {/* Tabs */}
              <View style={styles.modeTabs}>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setMode('edit');
                  }}
                  style={[
                    styles.modeTab,
                    mode === 'edit' && [styles.modeTabActive, { backgroundColor: color + '28', borderColor: color + '66' }],
                  ]}
                >
                  <MaterialIcons
                    name="edit"
                    size={14}
                    color={mode === 'edit' ? color : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modeTabText,
                      { color: mode === 'edit' ? theme.textPrimary : theme.textSecondary },
                    ]}
                  >
                    Editor
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    haptics.light();
                    setMode('preview');
                  }}
                  style={[
                    styles.modeTab,
                    mode === 'preview' && [styles.modeTabActive, { backgroundColor: color + '28', borderColor: color + '66' }],
                  ]}
                >
                  <MaterialIcons
                    name="visibility"
                    size={14}
                    color={mode === 'preview' ? color : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modeTabText,
                      { color: mode === 'preview' ? theme.textPrimary : theme.textSecondary },
                    ]}
                  >
                    Live Preview
                  </Text>
                </Pressable>
              </View>

              {/* Quick Word Stats */}
              <View style={styles.statsBadge}>
                <Text style={[styles.statsText, { color: theme.textSecondary }]}>
                  {stats.words} words · {stats.readMinutes}m read
                </Text>
              </View>
            </View>

            {/* TOOLBAR (Only shown in Edit mode) */}
            {mode === 'edit' ? (
              <View style={[styles.toolbar, { borderBottomColor: HAIRLINE }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.toolbarScroll}
                >
                  {/* Bold */}
                  <Pressable
                    onPress={() => handleToolbarAction('bold')}
                    style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
                    hitSlop={4}
                  >
                    <MaterialIcons name="format-bold" size={18} color={color} />
                  </Pressable>

                  {/* Italic */}
                  <Pressable
                    onPress={() => handleToolbarAction('italic')}
                    style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
                    hitSlop={4}
                  >
                    <MaterialIcons name="format-italic" size={18} color={color} />
                  </Pressable>

                  {/* Headings */}
                  <Pressable
                    onPress={() => handleToolbarAction('h1')}
                    style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
                    hitSlop={4}
                  >
                    <Text style={[styles.toolTextBtn, { color }]}>H1</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleToolbarAction('h2')}
                    style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
                    hitSlop={4}
                  >
                    <Text style={[styles.toolTextBtn, { color }]}>H2</Text>
                  </Pressable>

                  {/* Bullets */}
                  <Pressable
                    onPress={() => handleToolbarAction('bullet')}
                    style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
                    hitSlop={4}
                  >
                    <MaterialIcons name="format-list-bulleted" size={18} color={color} />
                  </Pressable>

                  {/* Checklist */}
                  <Pressable
                    onPress={() => handleToolbarAction('checklist')}
                    style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
                    hitSlop={4}
                  >
                    <MaterialIcons name="check-box" size={18} color={color} />
                  </Pressable>

                  {/* Quote */}
                  <Pressable
                    onPress={() => handleToolbarAction('quote')}
                    style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
                    hitSlop={4}
                  >
                    <MaterialIcons name="format-quote" size={18} color={color} />
                  </Pressable>

                  {/* Code */}
                  <Pressable
                    onPress={() => handleToolbarAction('code')}
                    style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
                    hitSlop={4}
                  >
                    <MaterialIcons name="code" size={18} color={color} />
                  </Pressable>

                  <View style={styles.toolDivider} />

                  {/* AI Sparkle Action */}
                  <Pressable
                    onPress={() => handleToolbarAction('ai')}
                    style={({ pressed }) => [
                      styles.aiToolBtn,
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}
                  >
                    <LinearGradient
                      colors={[MINT, MINT_BRIGHT]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.aiToolGrad}
                    >
                      <MaterialIcons name="auto-awesome" size={14} color="#06281A" />
                      <Text style={styles.aiToolBtnText}>AI Assistant</Text>
                    </LinearGradient>
                  </Pressable>
                </ScrollView>
              </View>
            ) : null}

            {/* EDITOR OR PREVIEW CONTENT */}
            {mode === 'edit' ? (
              <TextInput
                ref={inputRef}
                value={content}
                onChangeText={setContent}
                placeholder="Write your study notes, insights, formulas, or takeaways here..."
                placeholderTextColor="rgba(255,255,255,0.38)"
                style={[styles.contentInput, { color: theme.textPrimary }]}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
                {renderPreviewContent()}
              </ScrollView>
            )}
          </View>

          {/* LINK TO LECTURE */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Link to a Lecture (Optional)
              </Text>
              {selectedLecture ? (
                <Text style={[styles.lectureChannelBadge, { color: MINT }]}>
                  {selectedLecture.channel}
                </Text>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {/* None Option */}
              <Pressable
                onPress={() => {
                  haptics.light();
                  setLectureId('');
                }}
                style={({ pressed }) => [
                  styles.chip,
                  lectureId === '' && styles.chipSelected,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <MaterialIcons
                  name="remove-circle-outline"
                  size={15}
                  color={lectureId === '' ? MINT : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: lectureId === '' ? MINT : theme.textSecondary },
                  ]}
                >
                  None (General Note)
                </Text>
              </Pressable>

              {/* Lecture list */}
              {allLectures.map((l) => {
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
                      selected && styles.chipSelected,
                      pressed && { transform: [{ scale: 0.96 }] },
                    ]}
                  >
                    <MaterialIcons
                      name="smart-display"
                      size={15}
                      color={selected ? MINT : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? MINT : theme.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {l.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* PRIMARY SAVE ACTION */}
          <Pressable
            onPress={save}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.saveWrap,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
          >
            <LinearGradient
              colors={[...MINT_GRAD]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGrad}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#06281A" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#06281A" />
                  <Text style={styles.saveText}>
                    {noteId ? 'Update Note' : 'Save Note'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>

        {/* AI STUDY ASSISTANT MODAL */}
        <Modal
          visible={showAiModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAiModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAiModal(false)} />
            <View style={[styles.aiModalCard, { backgroundColor: '#0D1612', borderColor: MINT_RING }]}>
              <View style={styles.aiModalHeader}>
                <View style={styles.aiModalTitleRow}>
                  <LinearGradient
                    colors={[MINT, MINT_BRIGHT]}
                    style={styles.aiModalIcon}
                  >
                    <MaterialIcons name="auto-awesome" size={18} color="#06281A" />
                  </LinearGradient>
                  <View>
                    <Text style={[styles.aiModalTitle, { color: theme.textPrimary }]}>
                      LectureIQ AI Assistant
                    </Text>
                    <Text style={[styles.aiModalSubtitle, { color: theme.textSecondary }]}>
                      Generate, summarize & refine your study notes
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setShowAiModal(false)} hitSlop={8}>
                  <MaterialIcons name="close" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              {aiGenerating ? (
                <View style={styles.aiLoadingWrap}>
                  <ActivityIndicator size="large" color={MINT} />
                  <Text style={[styles.aiLoadingText, { color: theme.textPrimary }]}>
                    AI is synthesizing your notes...
                  </Text>
                </View>
              ) : (
                <View style={styles.aiToolsList}>
                  {AI_TOOLS.map((tool) => (
                    <Pressable
                      key={tool.id}
                      onPress={() => runAiTool(tool.id)}
                      style={({ pressed }) => [
                        styles.aiToolCard,
                        pressed && { transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <View style={[styles.toolIconWrap, { backgroundColor: MINT + '22' }]}>
                        <MaterialIcons name={tool.icon as any} size={20} color={MINT} />
                      </View>
                      <View style={styles.toolContent}>
                        <Text style={[styles.toolTitle, { color: theme.textPrimary }]}>
                          {tool.title}
                        </Text>
                        <Text style={[styles.toolDesc, { color: theme.textSecondary }]}>
                          {tool.desc}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* DELETE CONFIRMATION MODAL */}
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDeleteConfirm(false)} />
            <View style={[styles.deleteModalCard, { backgroundColor: '#131114', borderColor: 'rgba(248,113,113,0.4)' }]}>
              <View style={styles.deleteIconWrap}>
                <MaterialIcons name="delete-forever" size={28} color="#F87171" />
              </View>
              <Text style={[styles.deleteModalTitle, { color: theme.textPrimary }]}>Delete this note?</Text>
              <Text style={[styles.deleteModalDesc, { color: theme.textSecondary }]}>
                This action cannot be undone. Your note will be permanently removed.
              </Text>
              <View style={styles.deleteActionsRow}>
                <Pressable
                  onPress={() => setShowDeleteConfirm(false)}
                  style={[styles.modalCancelBtn, { borderColor: HAIRLINE }]}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textPrimary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={isDeleting}
                  style={styles.modalDeleteBtn}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { ...typography.bodySmall },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    maxWidth: 920,
    width: '100%',
    alignSelf: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(52,211,153,0.18)',
    borderWidth: 1,
    borderColor: MINT_RING,
    marginBottom: 16,
  },
  toastText: {
    ...typography.bodySmall,
    color: MINT,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(248,113,113,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    marginBottom: 16,
  },
  errorText: {
    ...typography.bodySmall,
    color: '#F87171',
    flex: 1,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  colorCodeText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  titleInput: {
    ...typography.h2,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    letterSpacing: -0.3,
  },
  editorCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  editorAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 2,
  },
  editorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeTabActive: {
    borderWidth: 1,
  },
  modeTabText: {
    ...typography.caption,
    fontWeight: '600',
  },
  statsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statsText: {
    ...typography.caption,
    fontSize: 11,
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  toolBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ scale: 0.94 }],
  },
  toolTextBtn: {
    fontSize: 13,
    fontWeight: '800',
  },
  toolDivider: {
    width: 1,
    height: 20,
    backgroundColor: HAIRLINE,
    marginHorizontal: 4,
  },
  aiToolBtn: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  aiToolGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiToolBtnText: {
    ...typography.caption,
    color: '#06281A',
    fontWeight: '700',
  },
  contentInput: {
    ...typography.body,
    minHeight: 260,
    padding: 18,
    lineHeight: 24,
    fontSize: 15,
  },
  previewScroll: {
    minHeight: 260,
    maxHeight: 450,
    padding: 18,
  },
  previewContainer: {
    gap: 8,
    paddingBottom: 20,
  },
  previewH1: {
    ...typography.h2,
    letterSpacing: -0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  previewH2: {
    ...typography.h3,
    letterSpacing: -0.3,
    marginTop: 6,
    marginBottom: 2,
  },
  previewH3: {
    ...typography.subheading,
    fontWeight: '700',
    marginTop: 4,
  },
  previewDivider: {
    height: 1,
    backgroundColor: HAIRLINE,
    marginVertical: 10,
  },
  previewQuote: {
    borderLeftWidth: 3.5,
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
  previewQuoteText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    lineHeight: 20,
    opacity: 0.9,
  },
  previewTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  previewTaskText: {
    ...typography.body,
    flex: 1,
  },
  previewTaskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  previewBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 3,
  },
  previewBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  previewBulletText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
  },
  previewParagraph: {
    ...typography.body,
    lineHeight: 23,
  },
  emptyPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyPreviewText: {
    ...typography.bodySmall,
    textAlign: 'center',
    maxWidth: 280,
  },
  lectureChannelBadge: {
    ...typography.caption,
    fontWeight: '600',
  },
  chipScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: 'rgba(255,255,255,0.04)',
    maxWidth: 240,
  },
  chipSelected: {
    borderColor: MINT,
    backgroundColor: 'rgba(52,211,153,0.12)',
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  saveWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  saveGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  saveText: {
    ...typography.bodySemi,
    color: '#06281A',
    fontWeight: '700',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aiModalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiModalIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  aiModalSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  aiLoadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 14,
  },
  aiLoadingText: {
    ...typography.body,
    fontWeight: '600',
  },
  aiToolsList: {
    gap: 10,
  },
  aiToolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  toolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    ...typography.bodySemi,
    fontSize: 14,
  },
  toolDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  deleteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(248,113,113,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteModalTitle: {
    ...typography.h3,
    marginBottom: 6,
    textAlign: 'center',
  },
  deleteModalDesc: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  deleteActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalCancelText: {
    ...typography.bodySemi,
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    ...typography.bodySemi,
    color: '#FFFFFF',
  },
});
