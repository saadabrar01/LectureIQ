import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { typography } from "../theme/typography";
import { userProfile } from "../data/mock";
import { FadeUp } from "../components/FadeUp";
import { haptics } from "../utils/helpers";
import {
  authApi,
  documentsApi,
  getAvatarUrl,
  historyApi,
  lecturesApi,
  statsApi,
  type AuthUser,
  type HistoryItem,
  type LectureItem,
} from "../services/api";

// ---------------------------------------------------------------------------
// Locked reference palette — flat surfaces only (no gradients, no glow)
// ---------------------------------------------------------------------------
const C = {
  bg: "#0A0F0C",
  card: "#111A16",
  hairline: "rgba(255,255,255,0.07)",
  green: "#22C55E",
  greenText: "#4ADE80",
  amber: "#FFB84D",
  blue: "#38BDF8",
  teal: "#14B8A6",
  purple: "#A78BFA",
  purpleDark: "#241B4D",
  text: "#FFFFFF",
  muted: "#7C8B84",
};

const WEEK_DOTS = 7;

// `hovered` is a web-only field RN's types don't expose yet.
function getHovered(state: PressableStateCallbackType): boolean {
  return (state as { hovered?: boolean }).hovered ?? false;
}

export function HomeScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [lectureCount, setLectureCount] = useState<number>(0);
  const [docCount, setDocCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [minutesWatched, setMinutesWatched] = useState<number>(0);
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [recentQa, setRecentQa] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        const [u, l, d, s, h] = await Promise.allSettled([
          authApi.getMe(),
          lecturesApi.list(),
          documentsApi.list(),
          statsApi.get(),
          historyApi.list(1),
        ]);
        if (!active) return;
        if (u.status === "fulfilled") setUser(u.value);
        if (l.status === "fulfilled") {
          setLectures(l.value);
          setLectureCount(l.value.length);
        }
        if (d.status === "fulfilled") setDocCount(d.value.length);
        if (s.status === "fulfilled") {
          setStreak(s.value.streak);
          setQuestionsAsked(s.value.questions_asked);
          setMinutesWatched(s.value.minutes_watched);
        }
        if (h.status === "fulfilled") setRecentQa(h.value);
        setLoading(false);
      };
      load();
      return () => {
        active = false;
      };
    }, [])
  );

  const goLibrary = () => navigation.navigate("Library");
  const goChat = () => navigation.navigate("Chat", { lectureId: "1" });
  const goDocuments = () => navigation.navigate("Documents");
  const goAddLecture = () => navigation.navigate("AddLecture");

  const handlePickDocument = async () => {
    haptics.light();
    try {
      setDocError("");
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/octet-stream",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });

      const asset = res.canceled ? undefined : res.assets?.[0];
      if (!asset) return;

      setUploadingDoc(true);
      const uploaded = await documentsApi.upload({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        file: Platform.OS === "web" ? (asset as { file?: File }).file : undefined,
      });

      haptics.success();
      setDocCount((c) => c + 1);
      navigation.navigate("DocumentChat", {
        documentId: uploaded.document_id,
        documentName: asset.name || "document.pdf",
        fileType: asset.name?.endsWith(".docx") ? "docx" : "pdf",
      });
    } catch (err: any) {
      haptics.warning();
      setDocError(err?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const displayName = user?.name || userProfile.name;
  const firstInitial = displayName.trim().charAt(0).toUpperCase() || "B";
  const displayAvatarUrl = getAvatarUrl(user?.avatar_url);
  const displayAvatarText = user?.avatar || firstInitial;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeStreakDots = Math.min(Math.max(streak, 0), WEEK_DOTS);
  const streakPct = Math.min(Math.round((streak / 30) * 100), 100);

  // Latest Q&A activity (if any) becomes the Recent Q&A highlight.
  const latestQa = recentQa[0];
  const qaSource = latestQa
    ? latestQa.answer_source || "Your documents"
    : "Ask your first question";

  // Today's quiz is generated from the most recent lecture, if available.
  const quizLecture = lectures[0];
  const quizTitle = quizLecture?.title || "your latest lecture";
  const quizLectureId = quizLecture?.id || "1";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 22 },
      ]}
    >
      {/* ==================== WELCOME HEADER ==================== */}
      <FadeUp index={0}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: C.muted }]}>{greeting}</Text>
            <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
              {displayName}
            </Text>
          </View>

          {/* Avatar with green ring + flame streak badge */}
          <Pressable
            onPress={() => navigation.navigate("Profile")}
            style={({ pressed }) => [
              styles.avatarWrap,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <View style={[styles.avatarRing, { borderColor: C.green }]}>
              {displayAvatarUrl ? (
                <Image source={{ uri: displayAvatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFill}>
                  <Text style={[styles.avatarText, { color: C.text }]}>
                    {displayAvatarText}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.streakBadge, { backgroundColor: C.amber }]}>
              <MaterialIcons name="local-fire-department" size={13} color="#3B2A00" />
            </View>
          </Pressable>
        </View>
      </FadeUp>

      {/* ==================== ERROR ==================== */}
      {docError ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color="#F87171" />
          <Text style={styles.errorText}>{docError}</Text>
          <Pressable onPress={() => setDocError("")} hitSlop={6}>
            <MaterialIcons name="close" size={16} color="#F87171" />
          </Pressable>
        </View>
      ) : null}

      {/* ==================== LOADING ==================== */}
      {loading ? (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={C.green} />
          <Text style={[styles.loadingText, { color: C.muted }]}>
            Loading your dashboard…
          </Text>
        </View>
      ) : null}

      {/* ==================== STATS ROW ==================== */}
      <FadeUp index={1}>
        <View style={styles.statsGrid}>
          {/* Lectures indexed */}
          <View style={styles.statCard}>
            <MaterialIcons name="play-circle-outline" size={22} color={C.green} />
            <Text style={[styles.statValue, { color: C.text }]}>{lectureCount}</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Lectures indexed</Text>
            <Pressable onPress={goLibrary} style={({ pressed }) => [pressed && { opacity: 0.6 }]} hitSlop={6}>
              <Text style={[styles.statLink, { color: C.blue }]}>Get started →</Text>
            </Pressable>
          </View>

          {/* Day streak */}
          <View style={styles.statCard}>
            <MaterialIcons name="local-fire-department" size={22} color={C.amber} />
            <Text style={[styles.statValue, { color: C.text }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Day streak</Text>
            <View style={styles.dotsRow}>
              {Array.from({ length: WEEK_DOTS }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.streakDot,
                    { backgroundColor: i < activeStreakDots ? C.amber : C.amber + "33" },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Questions asked */}
          <View style={styles.statCard}>
            <MaterialIcons name="chat-bubble-outline" size={22} color={C.blue} />
            <Text style={[styles.statValue, { color: C.text }]}>{questionsAsked}</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Questions asked</Text>
            <Text style={[styles.statTrend, { color: C.greenText }]}>+{minutesWatched} min watched</Text>
          </View>

          {/* Docs uploaded */}
          <View style={styles.statCard}>
            <MaterialIcons name="description" size={22} color={C.purple} />
            <Text style={[styles.statValue, { color: C.text }]}>{docCount}</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Docs uploaded</Text>
          </View>
        </View>
      </FadeUp>

      {/* ==================== UPLOAD CONTENT ==================== */}
      <FadeUp index={2}>
        <View style={styles.uploadOuter}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Upload content</Text>
            <Text style={[styles.sectionSub, { color: C.muted }]}>
              Choose what you want to study
            </Text>
          </View>

          <View style={styles.uploadGrid}>
        {/* Notes and PDF — teal scheme */}
        <FadeUp index={3} style={styles.uploadSlot}>
          <Pressable
            onPress={handlePickDocument}
            disabled={uploadingDoc}
            style={(state) => {
              const hovered = getHovered(state);
              return [
                styles.uploadCard,
                { borderColor: hovered ? C.teal + "55" : C.hairline },
                state.pressed ? styles.cardPressed : null,
                hovered ? styles.uploadCardHover : null,
              ];
            }}
          >
            <View style={[styles.uploadCardLayer, { backgroundColor: C.teal + "0D" }]} />
            <View style={styles.uploadCardContent}>
              <View style={[styles.uploadIconBubble, { backgroundColor: C.teal + "1A", borderColor: C.teal + "40" }]}>
                {uploadingDoc ? (
                  <ActivityIndicator color={C.teal} size="small" />
                ) : (
                  <MaterialIcons name="description" size={26} color={C.teal} />
                )}
              </View>

              <View style={styles.uploadTextBlock}>
                <Text style={[styles.uploadTitle, { color: C.text }]}>Notes and PDF</Text>
                <Text style={[styles.uploadDesc, { color: C.muted }]}>
                  .pdf, .doc, .docx notes
                </Text>
                <View style={[styles.uploadCaptionBadge, { backgroundColor: C.teal + "14", borderColor: C.teal + "30" }]}>
                  <MaterialIcons name="insert-drive-file" size={13} color={C.teal} />
                  <Text style={[styles.uploadCaptionText, { color: C.teal }]}>PDF · DOC · TXT</Text>
                </View>
              </View>

              <Pressable
                onPress={handlePickDocument}
                style={({ pressed }) => [
                  styles.pillBtn,
                  { backgroundColor: C.teal },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <MaterialIcons name="cloud-upload" size={16} color="#042C28" />
                <Text style={[styles.pillText, { color: "#042C28" }]}>Upload notes</Text>
              </Pressable>
            </View>
          </Pressable>
        </FadeUp>

        {/* Video lecture — blue scheme */}
        <FadeUp index={3} delay={70} style={styles.uploadSlot}>
          <Pressable
            onPress={goAddLecture}
            style={(state) => {
              const hovered = getHovered(state);
              return [
                styles.uploadCard,
                { borderColor: hovered ? C.blue + "55" : C.hairline },
                state.pressed ? styles.cardPressed : null,
                hovered ? styles.uploadCardHover : null,
              ];
            }}
          >
            <View style={[styles.uploadCardLayer, { backgroundColor: C.blue + "0D" }]} />
            <View style={styles.uploadCardContent}>
              <View style={[styles.uploadIconBubble, { backgroundColor: C.blue + "1A", borderColor: C.blue + "40" }]}>
                <MaterialIcons name="play-circle-outline" size={26} color={C.blue} />
              </View>

              <View style={styles.uploadTextBlock}>
                <Text style={[styles.uploadTitle, { color: C.text }]}>Video lecture</Text>
                <Text style={[styles.uploadDesc, { color: C.muted }]}>
                  From YouTube or video files
                </Text>
                <View style={[styles.uploadCaptionBadge, { backgroundColor: C.blue + "14", borderColor: C.blue + "30" }]}>
                  <MaterialIcons name="smart-display" size={13} color={C.blue} />
                  <Text style={[styles.uploadCaptionText, { color: C.blue }]}>YouTube · MP4</Text>
                </View>
              </View>

              <Pressable
                onPress={goAddLecture}
                style={({ pressed }) => [
                  styles.pillBtn,
                  { backgroundColor: C.blue },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <MaterialIcons name="add-circle-outline" size={16} color="#04283A" />
                <Text style={[styles.pillText, { color: "#04283A" }]}>Add video</Text>
              </Pressable>
            </View>
          </Pressable>
        </FadeUp>
        </View>
      </View>
      </FadeUp>

      {/* ==================== QUICK ACCESS ==================== */}
      <FadeUp index={4}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Quick access</Text>
          <Text style={[styles.sectionSub, { color: C.muted }]}>
            Jump into your learning
          </Text>
        </View>
      </FadeUp>

      <View style={styles.quickGrid}>
        {[
          { key: "lectures", icon: "list", title: "Lectures", sub: `${lectureCount} indexed`, accent: C.teal, fill: "#042C28", onPress: goLibrary },
          { key: "chat", icon: "chat-bubble-outline", title: "Q&A chat", sub: `${questionsAsked} asked`, accent: C.blue, fill: "#04283A", onPress: goChat },
          { key: "kb", icon: "storage", title: "Knowledge base", sub: `${docCount} docs`, accent: C.purple, fill: "#241B4D", onPress: goDocuments },
        ].map((q, i) => (
          <FadeUp key={q.key} index={4} delay={i * 70} style={styles.quickSlot}>
            <Pressable
              onPress={q.onPress}
              style={(state) => {
                const hovered = getHovered(state);
                return [
                  styles.quickCard,
                  state.pressed ? styles.cardPressed : null,
                  hovered ? { borderColor: q.accent + "66" } : null,
                ];
              }}
            >
              <View style={[styles.quickIcon, { backgroundColor: q.accent }]}>
                <MaterialIcons name={q.icon as never} size={20} color={q.fill} />
              </View>
              <Text style={[styles.quickTitle, { color: C.text }]}>{q.title}</Text>
              <Text style={[styles.quickSub, { color: C.muted }]}>{q.sub}</Text>
            </Pressable>
          </FadeUp>
        ))}
      </View>

      {/* ==================== RECENT ACTIVITY ==================== */}
      <FadeUp index={4} delay={80}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Recent activity</Text>
          <Text style={[styles.sectionSub, { color: C.muted }]}>
            Pick up where you left off
          </Text>
        </View>
      </FadeUp>

      <View style={styles.recentGrid}>
        {/* Recent Q&A — blue tint */}
        <Pressable
          onPress={goChat}
          style={(state) => {
            const hovered = getHovered(state);
            return [
              styles.recentCard,
              styles.qaCard,
              state.pressed ? styles.cardPressed : null,
              hovered ? { transform: [{ translateY: -2 }] } : null,
            ];
          }}
        >
          <Text style={[styles.recentTitle, { color: C.text }]}>Recent Q&A</Text>
          <Text style={[styles.recentQuote, { color: "#B9C4BE" }]} numberOfLines={2}>
            {latestQa ? `"${latestQa.question}"` : "No questions yet — start a chat with any lecture or document."}
          </Text>
          <Text style={[styles.recentSource, { color: C.blue }]} numberOfLines={1}>
            {qaSource}
          </Text>
        </Pressable>

        {/* Today's quiz — green tint */}
        <Pressable
          onPress={() => navigation.navigate("QuizConfig", { lectureId: quizLectureId })}
          style={(state) => {
            const hovered = getHovered(state);
            return [
              styles.recentCard,
              styles.quizCard,
              state.pressed ? styles.cardPressed : null,
              hovered ? { transform: [{ translateY: -2 }] } : null,
            ];
          }}
        >
          <Text style={[styles.recentTitle, { color: C.text }]}>Today's quiz</Text>
          <Text style={[styles.quizDesc, { color: C.muted }]}>
            5 questions on {quizTitle}
          </Text>
          <Pressable
            onPress={() => navigation.navigate("QuizConfig", { lectureId: quizLectureId })}
            style={({ pressed }) => [
              styles.quizBtn,
              { backgroundColor: C.green },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.quizBtnText, { color: "#052811" }]}>Start quiz</Text>
          </Pressable>
        </Pressable>
      </View>

      {/* ==================== INSIGHT CARD ==================== */}
      <FadeUp index={4} delay={120}>
        <View style={styles.insightCard}>
          {/* Progress ring */}
          <View style={styles.ringTrack}>
            <View style={[styles.ringArc, { borderColor: C.purple }]} />
            <View style={styles.ringCenter}>
              <Text style={[styles.ringText, { color: C.purple }]}>
                {streakPct}%
              </Text>
            </View>
          </View>

          <View style={styles.insightBody}>
            <Text style={[styles.insightTitle, { color: C.text }]}>
              Keep the momentum going
            </Text>
            <Text style={[styles.insightText, { color: C.muted }]}>
              {streak} of 30 days to your next streak badge. Review one lecture today.
            </Text>
          </View>

          <Pressable
            onPress={goLibrary}
            style={({ pressed }) => [
              styles.reviewBtn,
              { backgroundColor: C.purple },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.reviewText, { color: C.purpleDark }]}>Review now</Text>
          </Pressable>
        </View>
      </FadeUp>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
    paddingBottom: 40,
  },

  // ----- Welcome header -----
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerLeft: { flex: 1, gap: 2 },
  greeting: { ...typography.caption, fontSize: 14 },
  name: { ...typography.h1, fontSize: 28, letterSpacing: -0.6, marginTop: 1 },
  avatarWrap: { position: "relative", width: 64, height: 64 },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFill: {
    flex: 1,
    width: "100%",
    borderRadius: 27,
    backgroundColor: "#1B2621",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 27 },
  avatarText: { ...typography.bodySemi, fontWeight: "800", fontSize: 22 },
  streakBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  // ----- Error -----
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(248,113,113,0.1)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.28)",
    marginBottom: 16,
  },
  errorText: { ...typography.caption, color: "#F87171", flex: 1 },

  // ----- Loading -----
  loadingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    marginBottom: 8,
  },
  loadingText: { ...typography.caption, fontSize: 13 },

  // ----- Stats row -----
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 30,
  },
  statCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    minWidth: 160,
    gap: 6,
    padding: 20,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  statValue: { ...typography.h1, fontSize: 32, fontWeight: "800", letterSpacing: -1, marginTop: 2 },
  statLabel: { ...typography.caption, fontSize: 12 },
  statLink: { ...typography.caption, fontSize: 12, fontWeight: "600", marginTop: 2 },
  statTrend: { ...typography.caption, fontSize: 12, fontWeight: "700", marginTop: 2 },
  dotsRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  streakDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },

  // ----- Sections -----
  sectionHead: { marginBottom: 20 },
  sectionTitle: { ...typography.h2, fontSize: 20, letterSpacing: -0.4 },
  sectionSub: { ...typography.body, fontSize: 14, marginTop: 2, opacity: 0.9 },

  // ----- Upload content -----
  uploadOuter: {
    backgroundColor: "#0D1310",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 36,
    paddingVertical: 32,
    marginBottom: 30,
  },
  uploadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    width: "100%",
    maxWidth: 880,
    alignSelf: "center",
    justifyContent: "center",
  },
  uploadSlot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 280,
    minWidth: 280,
  },
  uploadCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  uploadCardHover: {
    transform: [{ translateY: -3 }],
    borderColor: C.hairline,
  },
  // Distinct background layer — subtle accent tint peeking through behind the flat card surface.
  uploadCardLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  uploadCardContent: {
    flexGrow: 1,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  uploadTextBlock: {
    alignItems: "center",
    gap: 8,
  },
  uploadIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: { ...typography.h3, fontSize: 19, fontWeight: "700", letterSpacing: -0.3, textAlign: "center" },
  uploadDesc: { ...typography.body, fontSize: 13.5, opacity: 0.85, textAlign: "center" },
  uploadCaptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  uploadCaptionText: {
    ...typography.caption,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  pillBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  pillText: { ...typography.caption, fontSize: 13.5, fontWeight: "700", letterSpacing: 0.2 },

  // ----- Insight card -----
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  ringTrack: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringArc: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "rgba(167,139,250,0)",
    borderTopColor: C.purple,
    borderRightColor: C.purple,
    transform: [{ rotate: "45deg" }],
  },
  ringCenter: { alignItems: "center", justifyContent: "center" },
  ringText: { ...typography.caption, fontSize: 12, fontWeight: "800" },
  insightBody: { flex: 1 },
  insightTitle: { ...typography.bodySemi, fontSize: 16, fontWeight: "700" },
  insightText: { ...typography.body, fontSize: 14, marginTop: 4, lineHeight: 20 },
  reviewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewText: { ...typography.caption, fontSize: 13, fontWeight: "700" },

  // ----- Quick access -----
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 30,
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    justifyContent: "center",
  },
  quickSlot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200,
    minWidth: 200,
    maxWidth: 340,
  },
  quickCard: {
    gap: 4,
    padding: 18,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickTitle: { ...typography.bodySemi, fontSize: 13, fontWeight: "700" },
  quickSub: {
    ...typography.caption,
    fontSize: 11,
    opacity: 0.85,
    marginTop: "auto",
  },

  // ----- Recent activity -----
  recentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 30 },
  recentCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 240,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  qaCard: {
    backgroundColor: "rgba(56,189,248,0.08)",
    borderColor: "rgba(56,189,248,0.25)",
  },
  quizCard: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.25)",
  },
  recentTitle: { ...typography.bodySemi, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  recentQuote: {
    ...typography.body,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  recentSource: { ...typography.caption, fontSize: 12, fontWeight: "600", marginTop: 10 },
  quizDesc: { ...typography.body, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  quizBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  quizBtnText: { ...typography.caption, fontSize: 13, fontWeight: "700" },

  cardPressed: { transform: [{ scale: 0.99 }], opacity: 0.96 },
});
