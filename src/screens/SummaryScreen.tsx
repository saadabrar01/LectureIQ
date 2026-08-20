import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { GlowBackground } from '../components/GlowBackground';
import { lectures } from '../data/mock';

const SUMMARY = [
  'Transformers replaced RNNs by removing the sequential bottleneck with self-attention.',
  'Self-attention computes query, key, and value vectors per token to weigh relevance.',
  'Scaling by sqrt(d_k) keeps softmax scores stable at large dimensions.',
  'Multi-head attention runs in parallel, each head capturing a different relationship.',
  'Residual connections and layer normalization enable very deep transformer stacks.',
  'Positional encodings inject order information into an otherwise order-agnostic mechanism.',
  'The decoder uses masked self-attention to preserve the auto-regressive property.',
];

export function SummaryScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { lectureId } = route.params as { lectureId: string };
  const [generating, setGenerating] = useState(true);

  const lecture = lectures.find((l) => l.id === lectureId) ?? lectures[0];

  useEffect(() => {
    const t = setTimeout(() => setGenerating(false), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <GlowBackground>
      <View style={styles.container}>
      <Header title="Lecture Summary" subtitle={lecture.title} back />

      <ScrollView contentContainerStyle={styles.scroll}>
        {generating ? (
          <View style={styles.generating}>
            <MaterialIcons name="auto-awesome" size={44} color={theme.secondary} />
            <Text style={[styles.generatingText, { color: theme.textSecondary }]}>
              Summarizing this lecture...
            </Text>
          </View>
        ) : (
          <>
            <AppCard style={[styles.overview, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <View style={styles.overviewRow}>
                <View style={styles.overviewStat}>
                  <Text style={[styles.overviewValue, { color: theme.primaryDark }]}>6 min</Text>
                  <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>watch time</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewStat}>
                  <Text style={[styles.overviewValue, { color: theme.primaryDark }]}>7</Text>
                  <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>key points</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewStat}>
                  <Text style={[styles.overviewValue, { color: theme.primaryDark }]}>AI</Text>
                  <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>generated</Text>
                </View>
              </View>
            </AppCard>

            <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Key Points</Text>
            {SUMMARY.map((point, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 100).duration(350)}>
                <View style={[styles.pointRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.pointIcon, { backgroundColor: theme.primary }]}>
                    <MaterialIcons name="check" size={14} color={theme.primaryDeep} />
                  </View>
                  <Text style={[styles.pointText, { color: theme.textPrimary }]}>{point}</Text>
                </View>
              </Animated.View>
            ))}

            <AppButton
              title="Generate Quiz"
              variant="gradient"
              onPress={() => navigation.navigate('Quiz', { lectureId })}
              icon={<MaterialIcons name="quiz" size={20} color="#1A1A1A" />}
              style={styles.quizBtn}
            />
          </>
        )}
      </ScrollView>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60, maxWidth: 900, width: '100%' },
  generating: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 16 },
  generatingText: { ...typography.body },
  overview: { padding: 18, marginBottom: 20 },
  overviewRow: { flexDirection: 'row', alignItems: 'center' },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewValue: { ...typography.h3 },
  overviewLabel: { ...typography.caption, marginTop: 2 },
  overviewDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionLabel: { ...typography.h3, marginBottom: 12 },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  pointIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pointText: { ...typography.body, flex: 1 },
  quizBtn: { marginTop: 16 },
});