import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  Pressable,
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
import { GlassCard } from "../components/GlassCard";
import { FadeUp, GlowChip } from "../components/FadeUp";
import { timeAgo, formatClock, haptics } from "../utils/helpers";
import { authApi, documentsApi, getAvatarUrl, type AuthUser } from "../services/api";
import type { Lecture } from "../data/mock";

const STAT_CARDS = [
  {
    key: "lectures" as const,
    icon: "library-books" as const,
    title: "Lectures",
    desc: "Browse your indexed video lectures.",
    gradient: ["#35D47A", "#22C55E"],
  },
  {
    key: "questions" as const,
    icon: "question-answer" as const,
    title: "Q&A Chat",
    desc: "Ask AI questions about your content.",
    gradient: ["#34D399", "#2FA866"],
  },
  {
    key: "processing" as const,
    icon: "description" as const,
    title: "Knowledge Base",
    desc: "Interact with uploaded PDF/DOC notes.",
    gradient: ["#8EA6E8", "#38CFA8"],
  },
];

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
          <Text style={[styles.name, { color: "#F5F7F6" }]}>
            {displayName}
          </Text>
        </View>
        <Pressable
          onPress={() => (navigation as any).navigate("Profile")}
          style={({ pressed }) => [
            styles.profileBtn,
            {
              borderColor: "rgba(53,212,122,0.3)",
              backgroundColor: "rgba(37,31,50,0.72)",
            },
            pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
          ]}
        >
          {displayAvatarUrl ? (
            <Image source={{ uri: displayAvatarUrl }} style={styles.profileAvatarImg} />
          ) : (
            <LinearGradient
              colors={["#35D47A", "#22C55E"]}
              style={styles.profileAvatarGradient}
            >
              <Text style={styles.profileAvatarText}>{displayAvatarText}</Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      {/* Error Alert */}
      {docError ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{docError}</Text>
          <Pressable onPress={() => setDocError("")} hitSlop={6}>
            <MaterialIcons name="close" size={16} color="#EF4444" />
          </Pressable>
        </View>
      ) : null}

      {/* DUAL UPLOAD CHOICE BANNER (SIDE-BY-SIDE: DOCS vs VIDEO) */}
      <FadeUp index={0}>
        <View style={styles.dualUploadWrap}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.01)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.dualUploadHeader}>
            <MaterialIcons name="cloud-upload" size={20} color="#22C55E" />
            <Text style={styles.dualUploadTitle}>Upload Content</Text>
            <Text style={styles.dualUploadSub}>Choose what you want to study</Text>
          </View>

          <View style={styles.dualUploadRow}>
            {/* Side 1: Document / Notes (.pdf, .doc) */}
            <Pressable
              onPress={handlePickDocument}
              disabled={uploadingDoc}
              style={({ pressed }) => [
                styles.dualUploadCard,
                styles.dualUploadCardDoc,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <LinearGradient
                colors={["#35D47A", "#22C55E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dualIconBg}
              >
                {uploadingDoc ? (
                  <ActivityIndicator color="#06281A" size="small" />
                ) : (
                  <MaterialIcons name="description" size={24} color="#FFFFFF" />
                )}
              </LinearGradient>

              <Text style={styles.dualCardTitle}>Notes & PDF</Text>
              <Text style={styles.dualCardMeta}>.doc, .docx, .pdf files</Text>

              <View style={styles.dualCardBadge}>
                <Text style={styles.dualCardBadgeText}>Upload Notes</Text>
                <MaterialIcons name="add" size={14} color="#35D47A" />
              </View>
            </Pressable>

            {/* Side 2: Video Lectures (YouTube) */}
            <Pressable
              onPress={handleAddVideo}
              style={({ pressed }) => [
                styles.dualUploadCard,
                styles.dualUploadCardVideo,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <LinearGradient
                colors={["#8EA6E8", "#38CFA8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dualIconBg}
              >
                <MaterialIcons name="smart-display" size={24} color="#FFFFFF" />
              </LinearGradient>

              <Text style={styles.dualCardTitle}>Video Lecture</Text>
              <Text style={styles.dualCardMeta}>YouTube video URLs</Text>

              <View style={styles.dualCardBadgeVideo}>
                <Text style={styles.dualCardBadgeTextVideo}>Add Video</Text>
                <MaterialIcons name="add" size={14} color="#8EA6E8" />
              </View>
            </Pressable>
          </View>
        </View>
      </FadeUp>

      {/* Floating stat cards with gradient blobs background */}
      <View style={styles.statsWrap}>
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
              <FadeUp index={i + 1} delay={80}>
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
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  <Text style={styles.cardDesc}>{s.desc}</Text>
                  <View style={styles.cardAction}>
                    <MaterialIcons
                      name="arrow-forward"
                      size={16}
                      color="#34D399"
                    />
                  </View>
                </Pressable>
              </FadeUp>
            </View>
          ))}
        </View>
      </View>

      {/* Section Header for Recent Lectures */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: "#F5F7F6" }]}>
          Your Lectures
        </Text>
        <Pressable onPress={() => (navigation as any).navigate("Library")}>
          <Text style={[styles.seeAll, { color: "#22C55E" }]}>See all</Text>
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
                      <GlowChip color="#FBBF24">
                        <View
                          style={[
                            styles.progressDot,
                            { backgroundColor: "#FBBF24" },
                          ]}
                        />
                        <Text
                          style={[styles.progressText, { color: "#FBBF24" }]}
                        >
                          {item.progress}%
                        </Text>
                      </GlowChip>
                    ) : item.status === "queued" ? (
                      <GlowChip color="#9F8FF0">
                        <Text
                          style={[
                            styles.progressText,
                            { color: "#9F8FF0" },
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
                    { backgroundColor: "#9F8FF0" },
                  ]}
                />
                <Text
                  style={[styles.lectureDate, { color: "rgba(255,255,255,0.55)" }]}
                >
                  Added {timeAgo(item.addedAt)}
                </Text>
              </View>
            </GlassCard>
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
  name: { ...typography.h2, marginTop: 2 },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  profileAvatarGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    ...typography.bodySemi,
    color: "#06281A",
    fontWeight: "800",
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    marginBottom: 16,
  },
  errorText: {
    ...typography.caption,
    color: "#EF4444",
    flex: 1,
  },

  // Dual Upload Side-by-Side Banner
  dualUploadWrap: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(37,31,50,0.72)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  dualUploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  dualUploadTitle: {
    ...typography.bodySemi,
    fontSize: 16,
    color: "#F5F7F6",
    fontWeight: "700",
  },
  dualUploadSub: {
    ...typography.caption,
    color: "rgba(255,255,255,0.55)",
    marginLeft: "auto",
    fontSize: 11,
  },
  dualUploadRow: {
    flexDirection: "row",
    gap: 14,
  },
  dualUploadCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  dualUploadCardDoc: {
    backgroundColor: "rgba(53,212,122,0.08)",
    borderColor: "rgba(53,212,122,0.25)",
  },
  dualUploadCardVideo: {
    backgroundColor: "rgba(142,166,232,0.08)",
    borderColor: "rgba(142,166,232,0.25)",
  },
  dualIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  dualCardTitle: {
    ...typography.bodySemi,
    fontSize: 14,
    color: "#F5F7F6",
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  dualCardMeta: {
    ...typography.caption,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 12,
    textAlign: "center",
  },
  dualCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(53,212,122,0.15)",
    borderWidth: 1,
    borderColor: "rgba(53,212,122,0.3)",
  },
  dualCardBadgeText: {
    ...typography.caption,
    color: "#35D47A",
    fontWeight: "700",
    fontSize: 11,
  },
  dualCardBadgeVideo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(142,166,232,0.15)",
    borderWidth: 1,
    borderColor: "rgba(142,166,232,0.3)",
  },
  dualCardBadgeTextVideo: {
    ...typography.caption,
    color: "#8EA6E8",
    fontWeight: "700",
    fontSize: 11,
  },

  // Stats Wrap
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
    borderColor: "rgba(255,255,255,0.08)",
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
    color: "#F5F7F6",
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
});
