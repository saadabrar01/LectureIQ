import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  PressableStateCallbackType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { typography } from "../theme/typography";
import { lectures, userProfile } from "../data/mock";
import { StatusBadge } from "../components/StatusBadge";
import { FadeUp, GlowChip } from "../components/FadeUp";
import { timeAgo, formatClock, haptics } from "../utils/helpers";
import { authApi, documentsApi, getAvatarUrl, type AuthUser } from "../services/api";
import type { Lecture } from "../data/mock";

// ---------------------------------------------------------------------------
// Palette — cohesive emerald → teal → lavender family (matches Profile screen)
// ---------------------------------------------------------------------------
const ACCENTS = {
  emerald: "#34D399",
  teal: "#2DD4BF",
  mint: "#8EF0A3",
  blue: "#38BDF8",
  lavender: "#9F8FF0",
  amber: "#FBBF24",
};

const STAT_CARDS = [
  {
    key: "lectures" as const,
    icon: "library-books" as const,
    title: "Lectures",
    desc: "Browse your indexed video lectures.",
    color: ACCENTS.emerald,
    grad: ["#34D399", "#0EA5A0"] as const,
  },
  {
    key: "questions" as const,
    icon: "question-answer" as const,
    title: "Q&A Chat",
    desc: "Ask AI questions about your content.",
    color: ACCENTS.teal,
    grad: ["#2DD4BF", "#38BDF8"] as const,
  },
  {
    key: "processing" as const,
    icon: "description" as const,
    title: "Knowledge Base",
    desc: "Interact with uploaded PDF/DOC notes.",
    color: ACCENTS.lavender,
    grad: ["#A78BFA", "#6D8BFA"] as const,
  },
];

// `hovered` is a web-only field RN's types don't expose yet.
function getHovered(state: PressableStateCallbackType): boolean {
  return (state as { hovered?: boolean }).hovered ?? false;
}

export function HomeScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState("");

  const loadUser = useCallback(async () => {
    try {
      const u = await authApi.getMe().catch(() => null);
      if (u) setUser(u);
    } catch {
      // fallback to mock profile
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const openLecture = (lecture: Lecture) => {
    haptics.light();
    (navigation as any).navigate("LectureDetail", { lectureId: lecture.id });
  };

  const handleStatCardPress = (key: "lectures" | "questions" | "processing") => {
    haptics.light();
    if (key === "questions") {
      const firstLectureId = lectures[0]?.id || "1";
      (navigation as any).navigate("Chat", { lectureId: firstLectureId });
    } else if (key === "lectures") {
      (navigation as any).navigate("Library");
    } else if (key === "processing") {
      (navigation as any).navigate("Documents");
    }
  };

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

      // Open DocumentChat for the uploaded document
      (navigation as any).navigate("DocumentChat", {
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

  const handleAddVideo = () => {
    haptics.light();
    (navigation as any).navigate("AddLecture");
  };

  const displayName = user?.name || userProfile.name;
  const displayAvatarUrl = getAvatarUrl(user?.avatar_url);
  const displayAvatarText = user?.avatar || userProfile.avatar;

  const renderHeader = () => (
    <>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: "rgba(255,255,255,0.55)" }]}>
            Welcome back 👋
          </Text>
          <Text style={[styles.name, { color: "#F7FAF8" }]}>
            {displayName}
          </Text>
        </View>
        <Pressable
          onPress={() => (navigation as any).navigate("Profile")}
          style={({ pressed }) => [
            styles.profileBtn,
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <View style={styles.avatarGlow} />
          <LinearGradient
            colors={["#34D399", "#2DD4BF", "#38BDF8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            {displayAvatarUrl ? (
              <Image source={{ uri: displayAvatarUrl }} style={styles.profileAvatarImg} />
            ) : (
              <View style={styles.avatarFill}>
                <Text style={styles.profileAvatarText}>{displayAvatarText}</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {/* Error Alert */}
      {docError ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color="#F87171" />
          <Text style={styles.errorText}>{docError}</Text>
          <Pressable onPress={() => setDocError("")} hitSlop={6}>
            <MaterialIcons name="close" size={16} color="#F87171" />
          </Pressable>
        </View>
      ) : null}

      {/* ================== UPLOAD CONTENT ================== */}
      <FadeUp index={0}>
        <View style={styles.dualUploadWrap}>
          <LinearGradient
            colors={["rgba(52,211,153,0.1)", "rgba(56,189,248,0.04)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dualUploadGlow}
          />
          <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.dualUploadHeader}>
            <View style={styles.uploadHeaderIcon}>
              <MaterialIcons name="cloud-upload" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.uploadHeaderText}>
              <Text style={[styles.dualUploadTitle, { color: "#F7FAF8" }]}>
                Upload Content
              </Text>
              <Text style={styles.dualUploadSub}>
                Choose what you want to study
              </Text>
            </View>
          </View>

          <View style={styles.dualUploadRow}>
            {/* Side 1: Document / Notes (.pdf, .doc) */}
            <Pressable
              onPress={handlePickDocument}
              disabled={uploadingDoc}
              style={(state) => {
                const hovered = getHovered(state);
                return [
                  styles.dualUploadCard,
                  styles.dualUploadCardDoc,
                  state.pressed ? styles.cardPressed : null,
                  hovered ? { transform: [{ translateY: -3 }], borderColor: "#34D39966" } : null,
                ];
              }}
            >
              <View style={[styles.dualIconGlow, { backgroundColor: "#34D39933" }]} />
              <LinearGradient
                colors={["#34D399", "#0EA5A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.dualIconBg, { borderColor: "#34D39966" }]}
              >
                {uploadingDoc ? (
                  <ActivityIndicator color="#06281A" size="small" />
                ) : (
                  <MaterialIcons name="description" size={22} color="#FFFFFF" />
                )}
              </LinearGradient>

              <Text style={styles.dualCardTitle}>Notes & PDF</Text>
              <Text style={styles.dualCardMeta}>.doc, .docx, .pdf files</Text>

              <LinearGradient
                colors={["#34D399", "#0EA5A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dualCardBadge}
              >
                <Text style={[styles.dualCardBadgeText, { color: "#06281A" }]}>
                  Upload Notes
                </Text>
                <MaterialIcons name="add" size={14} color="#06281A" />
              </LinearGradient>
            </Pressable>

            {/* Side 2: Video Lectures (YouTube) */}
            <Pressable
              onPress={handleAddVideo}
              style={(state) => {
                const hovered = getHovered(state);
                return [
                  styles.dualUploadCard,
                  styles.dualUploadCardVideo,
                  state.pressed ? styles.cardPressed : null,
                  hovered ? { transform: [{ translateY: -3 }], borderColor: "#38BDF866" } : null,
                ];
              }}
            >
              <View style={[styles.dualIconGlow, { backgroundColor: "#38BDF833" }]} />
              <LinearGradient
                colors={["#2DD4BF", "#38BDF8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.dualIconBg, { borderColor: "#38BDF866" }]}
              >
                <MaterialIcons name="smart-display" size={22} color="#FFFFFF" />
              </LinearGradient>

              <Text style={styles.dualCardTitle}>Video Lecture</Text>
              <Text style={styles.dualCardMeta}>YouTube video URLs</Text>

              <LinearGradient
                colors={["#2DD4BF", "#38BDF8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dualCardBadge}
              >
                <Text style={[styles.dualCardBadgeText, { color: "#06281A" }]}>
                  Add Video
                </Text>
                <MaterialIcons name="add" size={14} color="#06281A" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </FadeUp>

      {/* ================== QUICK ACTION CARDS ================== */}
      <View style={styles.statsWrap}>
        <LinearGradient
          colors={["rgba(52,211,153,0.1)", "rgba(159,143,240,0.08)", "rgba(0,0,0,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGlow}
        />

        <View style={styles.statsRow}>
          {STAT_CARDS.map((s, i) => (
            <View key={s.key} style={styles.statCell}>
              <FadeUp index={i + 1} delay={80}>
                <Pressable
                  onPress={() => handleStatCardPress(s.key)}
                  style={(state) => {
                    const hovered = getHovered(state);
                    return [
                      styles.statCard,
                      { borderColor: s.color + "2E" },
                      state.pressed ? styles.cardPressed : null,
                      hovered
                        ? { transform: [{ translateY: -4 }], borderColor: s.color + "66" }
                        : null,
                    ];
                  }}
                >
                  <BlurView intensity={14} tint="dark" style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={[s.color + "0D", "rgba(0,0,0,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.cardIconWrap]}>
                    <View style={[styles.cardIconGlow, { backgroundColor: s.color + "33" }]} />
                    <LinearGradient
                      colors={[...s.grad]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.cardIconBg, { borderColor: s.color + "55" }]}
                    >
                      <MaterialIcons name={s.icon} size={22} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  <Text style={styles.cardDesc}>{s.desc}</Text>
                  <View style={[styles.cardAction, { backgroundColor: s.color + "1A" }]}>
                    <MaterialIcons name="arrow-forward" size={16} color={s.color} />
                  </View>
                </Pressable>
              </FadeUp>
            </View>
          ))}
        </View>
      </View>

      {/* Section Header for Recent Lectures */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: "#F7FAF8" }]}>
          Your Lectures
        </Text>
        <Pressable
          onPress={() => (navigation as any).navigate("Library")}
          style={({ pressed }) => [
            styles.seeAllBtn,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <Text style={styles.seeAll}>See all</Text>
          <MaterialIcons name="arrow-forward" size={14} color={ACCENTS.emerald} />
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
          <FadeUp index={index + 4}>
            <Pressable
              onPress={() => openLecture(item)}
              style={(state) => {
                const hovered = getHovered(state);
                return [
                  styles.lectureCard,
                  state.pressed ? styles.cardPressed : null,
                  hovered ? { transform: [{ translateY: -3 }], borderColor: "#34D39955" } : null,
                ];
              }}
            >
              <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.thumbWrap}>
                <ImageBackground source={{ uri: item.thumbnail }} style={styles.thumb}>
                  <LinearGradient
                    colors={[
                      "rgba(11,15,14,0.0)",
                      "rgba(11,15,14,0.45)",
                      "rgba(11,15,14,0.92)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.thumbTopRow}>
                    {item.status === "processing" ? (
                      <GlowChip color="#FBBF24">
                        <View style={[styles.progressDot, { backgroundColor: "#FBBF24" }]} />
                        <Text style={[styles.progressText, { color: "#FBBF24" }]}>
                          {item.progress}%
                        </Text>
                      </GlowChip>
                    ) : item.status === "queued" ? (
                      <GlowChip color="#9F8FF0">
                        <Text style={[styles.progressText, { color: "#9F8FF0" }]}>
                          Queued
                        </Text>
                      </GlowChip>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                    <View style={styles.durationBadge}>
                      <MaterialIcons name="schedule" size={13} color="#FFFFFF" />
                      <Text style={styles.durationText}>
                        {formatClock(item.duration)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.thumbBottomRow}>
                    <View style={styles.playGlow}>
                      <View style={styles.playBtn}>
                        <MaterialIcons name="play-arrow" size={26} color="#06281A" />
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
                <View style={[styles.channelDot, { backgroundColor: ACCENTS.lavender }]} />
                <Text style={[styles.lectureDate, { color: "rgba(255,255,255,0.55)" }]}>
                  Added {timeAgo(item.addedAt)}
                </Text>
              </View>
            </Pressable>
          </FadeUp>
        )}
      />
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
    marginBottom: 20,
  },
  headerLeft: { gap: 2 },
  greeting: { ...typography.caption },
  name: { ...typography.h2, marginTop: 2, letterSpacing: -0.5 },
  profileBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(52,211,153,0.2)",
    shadowColor: "#34D399",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFill: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    backgroundColor: "#0E1712",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  profileAvatarText: {
    ...typography.bodySemi,
    color: "#8EF0A3",
    fontWeight: "800",
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(248,113,113,0.1)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.28)",
    marginBottom: 16,
  },
  errorText: {
    ...typography.caption,
    color: "#F87171",
    flex: 1,
  },

  // ----- Upload Content -----
  dualUploadWrap: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(14,23,18,0.6)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 6,
  },
  dualUploadGlow: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 300,
    height: 240,
  },
  dualUploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  uploadHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(34,197,94,0.14)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadHeaderText: { flex: 1 },
  dualUploadTitle: {
    ...typography.bodySemi,
    fontSize: 16,
    fontWeight: "700",
  },
  dualUploadSub: {
    ...typography.caption,
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 1,
  },
  dualUploadRow: {
    flexDirection: "row",
    gap: 14,
  },
  dualUploadCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    overflow: "hidden",
  },
  dualUploadCardDoc: {
    backgroundColor: "rgba(52,211,153,0.07)",
    borderColor: "rgba(52,211,153,0.3)",
  },
  dualUploadCardVideo: {
    backgroundColor: "rgba(56,189,248,0.07)",
    borderColor: "rgba(56,189,248,0.3)",
  },
  dualIconWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  dualIconGlow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  dualIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dualCardTitle: {
    ...typography.bodySemi,
    fontSize: 15,
    color: "#F7FAF8",
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  dualCardMeta: {
    ...typography.caption,
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 14,
    textAlign: "center",
  },
  dualCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dualCardBadgeText: {
    ...typography.caption,
    fontWeight: "700",
    fontSize: 12,
  },

  // ----- Quick Action Cards -----
  statsWrap: {
    marginBottom: 28,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(14,23,18,0.5)",
  },
  statsGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(14,23,18,0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 5,
    overflow: "hidden",
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardIconGlow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
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
    color: "#F7FAF8",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  cardDesc: {
    ...typography.caption,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 18,
    fontSize: 12,
  },
  cardAction: {
    marginTop: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  // ----- Section Header -----
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sectionTitle: { ...typography.h3, letterSpacing: -0.4 },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.28)",
  },
  seeAll: {
    ...typography.bodySmall,
    color: ACCENTS.emerald,
    fontWeight: "600",
  },

  // ----- Lecture Cards -----
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  lectureCard: {
    padding: 0,
    marginBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(14,23,18,0.6)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 5,
  },
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(11,15,14,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
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
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8EF0A3",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  playBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#8EF0A3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  thumbMeta: { flex: 1 },
  thumbChannel: {
    ...typography.caption,
    color: "rgba(255,255,255,0.78)",
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
});

