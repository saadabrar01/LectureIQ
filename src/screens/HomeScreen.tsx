import React from "react";
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { typography } from "../theme/typography";
import { lectures, userProfile } from "../data/mock";
import { StatusBadge } from "../components/StatusBadge";
import { GlassCard } from "../components/GlassCard";
import { FadeUp, GlowChip } from "../components/FadeUp";
import { timeAgo, formatClock, haptics } from "../utils/helpers";
import type { Lecture } from "../data/mock";

const STAT_CARDS = [
  {
    key: "lectures" as const,
    icon: "library-books" as const,
    title: "Lecture",
    desc: "Access your lectures and learning materials.",
    gradient: ["#35D47A", "#22C55E"],
  },
  {
    key: "questions" as const,
    icon: "question-answer" as const,
    title: "Question",
    desc: "Ask questions and get helpful answers.",
    gradient: ["#35D47A", "#38CFA8"],
  },
  {
    key: "processing" as const,
    icon: "auto-fix-high" as const,
    title: "Processing",
    desc: "Process and analyze your learning content.",
    gradient: ["#8EA6E8", "#38CFA8"],
  },
];

export function HomeScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const openLecture = (lecture: Lecture) => {
    haptics.light();
    navigation.navigate("LectureDetail", { lectureId: lecture.id });
  };

  const handleStatCardPress = (key: "lectures" | "questions" | "processing") => {
    haptics.light();
    if (key === "questions") {
      const firstLectureId = lectures[0]?.id || "1";
      (navigation as any).navigate("Chat", { lectureId: firstLectureId });
    } else if (key === "lectures") {
      (navigation as any).navigate("Search");
    } else if (key === "processing") {
      (navigation as any).navigate("AddLecture");
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            Welcome back
          </Text>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {userProfile.name}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate("Profile" as never)}
          style={({ pressed }) => [
            styles.profileBtn,
            {
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(23,23,23,0.5)",
            },
            pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
          ]}
        >
          <MaterialIcons
            name="person-outline"
            size={22}
            color={theme.textSecondary}
          />
        </Pressable>
      </View>

      {/* Floating stat cards with gradient blobs background */}
      <View style={styles.statsWrap}>
        {/* Gradient blobs behind cards */}
        <View style={styles.blobContainer}>
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
          <View style={[styles.blob, styles.blob3]} />
          <View style={[styles.blob, styles.blob4]} />
          <View style={[styles.blob, styles.blob5]} />
        </View>

        <View style={styles.statsRow}>
          {STAT_CARDS.map((s, i) => (
            <View key={s.key} style={styles.statCell}>
              <FadeUp index={i} delay={80}>
                <Pressable
                  onPress={() => handleStatCardPress(s.key)}
                  style={(state) => {
                    const hovered =
                      (state as { hovered?: boolean }).hovered ?? false;
                    return [
                      styles.statCard,
                      state.pressed && { transform: [{ scale: 0.96 }] },
                      hovered && { transform: [{ translateY: -4 }] },
                    ];
                  }}
                >
                  <BlurView
                    intensity={24}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.01)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Card icon circle */}
                  <View style={[styles.cardIconWrap]}>
                    <LinearGradient
                      colors={s.gradient as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardIconBg}
                    >
                      <MaterialIcons name={s.icon} size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  {/* Card title */}
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  {/* Card description */}
                  <Text style={styles.cardDesc}>{s.desc}</Text>
                  {/* Action arrow */}
                  <View style={styles.cardAction}>
                    <MaterialIcons
                      name="arrow-forward"
                      size={16}
                      color="rgba(142,240,163,0.75)"
                    />
                  </View>
                </Pressable>
              </FadeUp>
            </View>
          ))}
        </View>
      </View>

      {/* Ask-your-documents CTA */}
      <FadeUp index={3}>
        <Pressable
          onPress={() => {
            haptics.light();
            navigation.navigate("Documents");
          }}
          style={(state) => {
            const hovered =
              (state as { hovered?: boolean }).hovered ?? false;
            return [
              styles.docsCta,
              state.pressed && { transform: [{ scale: 0.97 }] },
              hovered && { borderColor: "rgba(53,212,122,0.45)" },
            ];
          }}
        >
          <LinearGradient
            colors={["#35D47A", "#38CFA8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.docsCtaIcon}
          >
            <MaterialIcons name="forum" size={20} color="#06281A" />
          </LinearGradient>
          <View style={styles.docsCtaBody}>
            <Text style={styles.docsCtaTitle}>Chat with your documents</Text>
            <Text style={styles.docsCtaDesc}>
              Upload PDF/DOCX and ask AI questions about them
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color="rgba(142,240,163,0.75)"
          />
        </Pressable>
      </FadeUp>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Your Lectures
        </Text>
        <Pressable onPress={() => navigation.navigate("Search")}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lectures}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 12 },
        ]}
        ListHeaderComponent={renderHeader()}
        renderItem={({ item, index }) => (
          <FadeUp index={index}>
            <GlassCard
              onPress={() => openLecture(item)}
              style={styles.lectureCard}
              blur={16}
            >
              <View style={styles.thumbWrap}>
                <ImageBackground
                  source={{ uri: item.thumbnail }}
                  style={styles.thumb}
                >
                  <LinearGradient
                    colors={[
                      "rgba(11,15,14,0.05)",
                      "rgba(11,15,14,0.6)",
                      "rgba(11,15,14,0.9)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.thumbTopRow}>
                    {item.status === "processing" ? (
                      <GlowChip color={theme.amber}>
                        <View
                          style={[
                            styles.progressDot,
                            { backgroundColor: theme.amber },
                          ]}
                        />
                        <Text
                          style={[styles.progressText, { color: theme.amber }]}
                        >
                          {item.progress}%
                        </Text>
                      </GlowChip>
                    ) : item.status === "queued" ? (
                      <GlowChip color={theme.lavender}>
                        <Text
                          style={[
                            styles.progressText,
                            { color: theme.lavender },
                          ]}
                        >
                          Queued
                        </Text>
                      </GlowChip>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                    <View
                      style={[
                        styles.durationBadge,
                        { backgroundColor: "rgba(11,15,14,0.65)" },
                      ]}
                    >
                      <MaterialIcons
                        name="schedule"
                        size={13}
                        color="#FFFFFF"
                      />
                      <Text style={styles.durationText}>
                        {formatClock(item.duration)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.thumbBottomRow}>
                    <View style={styles.playGlow}>
                      <View style={styles.playBtn}>
                        <MaterialIcons
                          name="play-arrow"
                          size={26}
                          color="#06281A"
                        />
                      </View>
                    </View>
                    <View style={styles.thumbMeta}>
                      <Text style={styles.thumbChannel} numberOfLines={1}>
                        {item.channel}
                      </Text>
                      <Text style={styles.thumbTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </View>
              <View style={styles.lectureMeta}>
                <View
                  style={[
                    styles.channelDot,
                    { backgroundColor: theme.lavender },
                  ]}
                />
                <Text
                  style={[styles.lectureDate, { color: theme.textSecondary }]}
                >
                  Added {timeAgo(item.addedAt)}
                </Text>
              </View>
            </GlassCard>
          </FadeUp>
        )}
      />

      <Pressable
        onPress={() => {
          haptics.medium();
          navigation.navigate("AddLecture");
        }}
        style={[
          styles.fab,
          {
            shadowColor: theme.primary,
            borderColor: theme.glassBorder,
            backgroundColor: theme.glassBg,
          },
        ]}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <MaterialIcons name="add" size={26} color={theme.primaryDeep} />
          <Text style={[styles.fabText, { color: theme.primaryDeep }]}>
            Add Video
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 28,
    paddingBottom: 120,
    maxWidth: 1152,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  greeting: { ...typography.caption },
  name: { ...typography.h2, marginTop: 2 },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statsWrap: {
    marginBottom: 28,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(33,27,45,0.6)",
  },
  blobContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blob1: {
    width: 190,
    height: 190,
    top: -55,
    left: -45,
    backgroundColor: "rgba(53,212,122,0.09)",
  },
  blob2: {
    width: 160,
    height: 160,
    top: -35,
    right: -35,
    backgroundColor: "rgba(56,207,168,0.07)",
  },
  blob3: {
    width: 140,
    height: 140,
    bottom: -45,
    left: "22%",
    backgroundColor: "rgba(142,166,232,0.06)",
  },
  blob4: {
    width: 120,
    height: 120,
    bottom: -30,
    right: "6%",
    backgroundColor: "rgba(34,197,94,0.05)",
  },
  blob5: {
    width: 150,
    height: 150,
    top: "28%",
    right: -40,
    backgroundColor: "rgba(139,92,246,0.06)",
  },
  statsRow: {
    flexDirection: "row",
    gap: 18,
    padding: 20,
    width: "100%",
    maxWidth: 860,
    alignSelf: "center",
  },
  statCell: { flex: 1 },
  statCard: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(37,31,50,0.72)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
    overflow: "hidden",
  },
  cardIconWrap: {
    marginBottom: 16,
  },
  cardIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    ...typography.bodySemi,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  cardDesc: {
    ...typography.caption,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 18,
    fontSize: 12,
  },
  cardAction: {
    marginTop: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(53,212,122,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  docsCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(37,31,50,0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  docsCtaIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  docsCtaBody: { flex: 1 },
  docsCtaTitle: { ...typography.bodySemi, color: "#FFFFFF" },
  docsCtaDesc: {
    ...typography.caption,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: { ...typography.h3 },
  seeAll: { ...typography.bodySmall },
  lectureCard: { padding: 0, marginBottom: 16 },
  thumbWrap: { position: "relative" },
  thumb: { width: "100%", height: 190 },
  thumbTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  progressDot: { width: 6, height: 6, borderRadius: 3 },
  progressText: { ...typography.caption, fontWeight: "700" },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  durationText: { color: "#FFFFFF", ...typography.caption },
  thumbBottomRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  playGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8EF0A3",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#8EF0A3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  thumbMeta: { flex: 1 },
  thumbChannel: {
    ...typography.caption,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  thumbTitle: { ...typography.bodySemi, color: "#FFFFFF", marginTop: 2 },
  lectureMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  channelDot: { width: 6, height: 6, borderRadius: 3 },
  lectureDate: { ...typography.caption },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 92,
    borderRadius: 32,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
  },
  fabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 32,
  },
  fabText: { ...typography.bodySemi },
});
