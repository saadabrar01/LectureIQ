import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { AppButton } from '../components/AppButton';
import { GlowBackground } from '../components/GlowBackground';
import { lectures } from '../data/mock';
import { haptics } from '../utils/helpers';
import type { RootStackParamList } from '../navigation/types';

const MINT = '#22C55E';
const MINT_SOFT = 'rgba(34,197,94,0.12)';
const MINT_RING = 'rgba(34,197,94,0.55)';
const CARD_BG = 'rgba(38,38,38,0.85)';
const HAIRLINE = 'rgba(255,255,255,0.08)';

type Count = 5 | 10 | 15;
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Scope = 'Whole lecture' | 'First half' | 'Second half';

const COUNTS: Count[] = [5, 10, 15];
const DIFFICULTIES: { value: Difficulty; icon: keyof typeof MaterialIcons.glyphMap; tint: string }[] = [
  { value: 'Easy', icon: 'sentiment-satisfied-alt', tint: '#35D47A' },
  { value: 'Medium', icon: 'psychology', tint: '#8EA6E8' },
  { value: 'Hard', icon: 'local-fire-department', tint: '#FF8A5B' },
];
const SCOPES: { value: Scope; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { value: 'Whole lecture', icon: 'all-inclusive' },
  { value: 'First half', icon: 'timelapse' },
  { value: 'Second half', icon: 'history' },
];

export function QuizConfigScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { lectureId } = route.params as { lectureId: string };

  const lecture = lectures.find((l) => l.id === lectureId) ?? lectures[0];
  const [count, setCount] = useState<Count>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [scope, setScope] = useState<Scope>('Whole lecture');

  const generate = () => {
    haptics.success();
    navigation.replace('Quiz', { lectureId, count });
  };

  return (
    <GlowBackground>
      <View style={styles.container}>
        <Header title="Generate Quiz" subtitle={lecture.title} back />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(350).delay(60)}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Number of Questions
            </Text>
            <View style={styles.rowWrap}>
              {COUNTS.map((c) => (
                <OptionCard
                  key={c}
                  selected={count === c}
                  onPress={() => {
                    haptics.light();
                    setCount(c);
                  }}
                >
                  <Text
                    style={[
                      styles.countValue,
                      { color: count === c ? MINT : theme.textPrimary },
                    ]}
                  >
                    {c}
                  </Text>
                  <Text
                    style={[
                      styles.optionSub,
                      { color: count === c ? MINT : theme.textSecondary },
                    ]}
                  >
                    questions
                  </Text>
                </OptionCard>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(350).delay(140)}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Difficulty Level
            </Text>
            <View style={styles.rowWrap}>
              {DIFFICULTIES.map((d) => (
                <OptionCard
                  key={d.value}
                  selected={difficulty === d.value}
                  onPress={() => {
                    haptics.light();
                    setDifficulty(d.value);
                  }}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: `${d.tint}22`,
                        borderColor: `${d.tint}44`,
                      },
                    ]}
                  >
                    <MaterialIcons name={d.icon} size={20} color={d.tint} />
                  </View>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: difficulty === d.value ? MINT : theme.textPrimary },
                    ]}
                  >
                    {d.value}
                  </Text>
                </OptionCard>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(350).delay(220)}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Video Segments
            </Text>
            <View style={styles.rowWrap}>
              {SCOPES.map((s) => (
                <OptionCard
                  key={s.value}
                  selected={scope === s.value}
                  onPress={() => {
                    haptics.light();
                    setScope(s.value);
                  }}
                >
                  <MaterialIcons
                    name={s.icon}
                    size={22}
                    color={scope === s.value ? MINT : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: scope === s.value ? MINT : theme.textPrimary },
                    ]}
                  >
                    {s.value}
                  </Text>
                </OptionCard>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(350).delay(300)}>
            <View style={[styles.summary, { borderColor: HAIRLINE }]}>
              <View style={[styles.summaryIcon, { backgroundColor: MINT_SOFT }]}>
                <MaterialIcons name="quiz" size={20} color={MINT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>
                  {count} {difficulty.toLowerCase()} questions
                </Text>
                <Text style={[styles.summarySub, { color: theme.textSecondary }]}>
                  {scope} · {lecture.title}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
          pointerEvents="box-none"
        >
          <AppButton
            title="Generate Quiz"
            variant="gradient"
            onPress={generate}
            style={styles.cta}
          />
        </View>
      </View>
    </GlowBackground>
  );
}

function OptionCard({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? MINT_SOFT : pressed ? 'rgba(255,255,255,0.05)' : CARD_BG,
          borderColor: selected ? MINT_RING : HAIRLINE,
        },
      ]}
    >
      {children}
      {selected ? (
        <View style={styles.checkBadge}>
          <MaterialIcons name="check" size={13} color="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 14, maxWidth: 900, width: '100%' },
  sectionLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 6,
  },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countValue: { ...typography.h1, fontSize: 30 },
  optionSub: { ...typography.caption },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionTitle: { ...typography.bodySemi },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 26,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(37,31,50,0.72)',
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { ...typography.bodySemi },
  summarySub: { ...typography.bodySmall, marginTop: 2 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  cta: { alignSelf: 'stretch' },
});
