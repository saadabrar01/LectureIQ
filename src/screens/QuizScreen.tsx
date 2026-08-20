import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { AppButton } from '../components/AppButton';
import { GlowBackground } from '../components/GlowBackground';
import { quizQuestions, lectures } from '../data/mock';
import { formatClock, haptics } from '../utils/helpers';

export function QuizScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { lectureId } = route.params as { lectureId: string };

  const questions = useMemo(
    () =>
      [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const lecture = lectures.find((l) => l.id === lectureId) ?? lectures[0];

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const q = questions[index];
  const currentAnswered = selected !== null;
  const correct = currentAnswered && selected === q.correctIndex;
  const score = useMemo(
    () => answers.reduce((acc, a, i) => acc + (a === questions[i].correctIndex ? 1 : 0), 0),
    [answers, questions]
  );

  const pick = (i: number) => {
    if (currentAnswered) return;
    haptics.light();
    setSelected(i);
  };

  const next = () => {
    haptics.light();
    if (!currentAnswered) return;
    const nextAnswers = [...answers];
    nextAnswers[index] = selected as number;
    setAnswers(nextAnswers);
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      setFinished(true);
      haptics.success();
    }
  };

  const progress = ((index + (currentAnswered ? 1 : 0)) / questions.length) * 100;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <GlowBackground>
      <View style={styles.container}>
        <Header title="Quiz Results" back />
        <View style={styles.finalWrap}>
          <View style={[styles.scoreCircle, { backgroundColor: theme.primary }]}>
            <Text style={[styles.scoreValue, { color: theme.primaryDeep }]}>{pct}%</Text>
          </View>
          <Text style={[styles.scoreTitle, { color: theme.textPrimary }]}>
            You scored {score}/{questions.length}
          </Text>
          <Text style={[styles.scoreSub, { color: theme.textSecondary }]}>
            {pct >= 80
              ? 'Excellent! You really understood this lecture.'
              : pct >= 50
                ? 'Good job! Review the points you missed below.'
                : 'Keep practicing — rewatch the sections you missed.'}
          </Text>

          <ScrollView style={styles.review} contentContainerStyle={styles.reviewContent}>
            {questions.map((qq, i) => {
              const ok = answers[i] === qq.correctIndex;
              return (
                <View
                  key={qq.id}
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: ok ? theme.primary : theme.error,
                    },
                  ]}
                >
                  <View style={styles.reviewTop}>
                    <MaterialIcons
                      name={ok ? 'check-circle' : 'cancel'}
                      size={20}
                      color={ok ? theme.primaryDark : theme.error}
                    />
                    <Text style={[styles.reviewQ, { color: theme.textPrimary }]}>
                      {qq.question}
                    </Text>
                  </View>
                  {!ok && (
                    <Text style={[styles.reviewExp, { color: theme.textSecondary }]}>
                      {qq.explanation} (from {formatClock(qq.sourceTime)})
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <AppButton
            title="Back to Summary"
            variant="gradient"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
        </View>
      </View>
      </GlowBackground>
    );
  }

  return (
    <GlowBackground>
    <View style={styles.container}>
      <Header
        title="Quiz"
        subtitle={lecture.title}
        back
        right={
          <Text style={[styles.counter, { color: theme.textSecondary }]}>
            {index + 1}/{questions.length}
          </Text>
        }
      />

      <View style={styles.progressTrackWrap}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.surfaceAlt },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary, width: `${progress}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.quizContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={[styles.question, { color: theme.textPrimary }]}>{q.question}</Text>

          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = currentAnswered && i === q.correctIndex;
              const isWrong = currentAnswered && isSelected && !isCorrect;
              return (
                <View
                  key={i}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isCorrect
                        ? 'rgba(142,240,163,0.2)'
                        : isWrong
                          ? 'rgba(255,107,107,0.15)'
                          : theme.surface,
                      borderColor: isCorrect
                        ? theme.primaryDark
                        : isWrong
                          ? theme.error
                          : isSelected
                            ? theme.primaryDark
                            : theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionLetter,
                      {
                        backgroundColor: isCorrect
                          ? theme.primary
                          : isWrong
                            ? theme.error
                            : theme.surfaceAlt,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLetterText,
                        {
                          color: isCorrect
                            ? theme.primaryDeep
                            : isWrong
                              ? '#fff'
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: theme.textPrimary }]} onPress={() => pick(i)}>
                    {opt}
                  </Text>
                  {isCorrect ? (
                    <MaterialIcons name="check-circle" size={20} color={theme.primaryDark} />
                  ) : isWrong ? (
                    <MaterialIcons name="cancel" size={20} color={theme.error} />
                  ) : null}
                </View>
              );
            })}
          </View>

          {currentAnswered && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={[styles.explanation, { backgroundColor: theme.surfaceAlt }]}>
                <MaterialIcons
                  name={correct ? 'lightbulb' : 'info-outline'}
                  size={18}
                  color={correct ? theme.warning : theme.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.expTitle, { color: theme.textPrimary }]}>
                    {correct ? 'Correct!' : 'Not quite'}
                  </Text>
                  <Text style={[styles.expText, { color: theme.textSecondary }]}>
                    {q.explanation}
                  </Text>
                </View>
              </View>
              <AppButton
                title={index < questions.length - 1 ? 'Next Question' : 'See Results'}
                variant="gradient"
                onPress={next}
                style={styles.nextBtn}
              />
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  counter: { ...typography.bodySemi },
  progressTrackWrap: { paddingHorizontal: 20, marginBottom: 10 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  quizContent: { padding: 20, paddingBottom: 60, maxWidth: 900, width: '100%' },
  question: { ...typography.h2, lineHeight: 34, marginBottom: 20 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionLetter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { ...typography.subheading },
  optionText: { ...typography.body, flex: 1 },
  explanation: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  expTitle: { ...typography.bodySemi },
  expText: { ...typography.bodySmall, marginTop: 2 },
  nextBtn: { marginTop: 14 },
  finalWrap: { flex: 1, alignItems: 'center', padding: 24 },
  scoreCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  scoreValue: { ...typography.hero },
  scoreTitle: { ...typography.h2, marginTop: 18 },
  scoreSub: { ...typography.body, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  review: { alignSelf: 'stretch', flexGrow: 0 },
  reviewContent: { gap: 10, paddingBottom: 10 },
  reviewCard: { padding: 14, borderRadius: 14, borderWidth: 1.5 },
  reviewTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  reviewQ: { ...typography.bodySemi, flex: 1 },
  reviewExp: { ...typography.bodySmall, marginTop: 8, marginLeft: 30 },
  backBtn: { alignSelf: 'stretch', marginTop: 16 },
});