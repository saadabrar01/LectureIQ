import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../theme/typography';

const MINT = '#34D399';
const MINT_BRIGHT = '#2DD4BF';
const MINT_DEEP = '#0EA5A0';
const MINT_RING = 'rgba(52,211,153,0.55)';
const BG_DEEP = '#080E0B';
const BG_SOFT = '#0E1712';
const CARD_BG = 'rgba(14,23,18,0.78)';
const HAIRLINE = 'rgba(255,255,255,0.09)';

interface AuthSplitLayoutProps {
  children: ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 880;

  return (
    <LinearGradient
      colors={[BG_DEEP, BG_SOFT, BG_DEEP]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      {/* Dark emerald ambient glow circles in background */}
      <View style={styles.ambient}>
        <LinearGradient
          colors={['rgba(52,211,153,0.15)', 'rgba(52,211,153,0)']}
          style={styles.ambientTopRight}
        />
        <LinearGradient
          colors={['rgba(14,165,160,0.12)', 'rgba(14,165,160,0)']}
          style={styles.ambientBottomLeft}
        />
        <LinearGradient
          colors={['rgba(159,143,240,0.08)', 'rgba(159,143,240,0)']}
          style={styles.ambientCenter}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Math.max(insets.top + 16, 24),
              paddingBottom: Math.max(insets.bottom + 20, 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Outer Container */}
          <View style={[styles.outerContainer, isWide && styles.outerContainerWide]}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

            {/* Top Brand Logo: Emerald Badge + Name */}
            <View style={styles.brandRow}>
              <LinearGradient
                colors={[MINT, MINT_DEEP]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBadge}
              >
                <MaterialIcons name="auto-awesome" size={17} color="#06281A" />
              </LinearGradient>
              <Text style={styles.brandName}>LectureIQ</Text>
            </View>

            {/* Split Content Area */}
            <View style={[styles.splitContent, isWide && styles.splitContentWide]}>
              {/* Left Column: Dark Glass Auth Card */}
              <View style={[styles.authCard, isWide && styles.authCardWide]}>
                <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.015)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {children}
              </View>

              {/* Right Column: Illustration & Floating Lecture IQ Notes Card */}
              {isWide ? (
                <View style={styles.illustrationColumn}>
                  {/* Window Grid in Background with soft night glow */}
                  <View style={styles.windowFrame}>
                    <View style={styles.windowPane} />
                    <View style={styles.windowPane} />
                    <View style={styles.windowPane} />
                    <View style={styles.windowPane} />
                  </View>

                  {/* Standing Floor Lamp */}
                  <View style={styles.floorLamp}>
                    <View style={styles.lampShade} />
                    <View style={styles.lampPole} />
                    <View style={styles.lampBase} />
                  </View>

                  {/* Character in Cozy Emerald Lounge Chair */}
                  <View style={styles.studySceneWrap}>
                    {/* Cozy Emerald Lounge Chair */}
                    <View style={styles.loungeChair}>
                      <View style={styles.chairBack} />
                      <View style={styles.chairSeat} />
                      <View style={styles.chairArm} />
                    </View>

                    {/* Character Figure (Stylized vector shapes) */}
                    <View style={styles.characterFigure}>
                      {/* Head & Glasses */}
                      <View style={styles.charHead}>
                        <View style={styles.charHair} />
                        <View style={styles.charGlasses} />
                      </View>
                      {/* Torso */}
                      <View style={styles.charTorso} />
                      {/* Legs */}
                      <View style={styles.charLegTop} />
                      <View style={styles.charLegBottom} />
                      {/* Shoes */}
                      <View style={styles.charShoe} />
                      {/* Laptop */}
                      <View style={styles.charLaptop}>
                        <View style={styles.laptopScreen} />
                        <View style={styles.laptopKeyboard} />
                      </View>
                    </View>

                    {/* Coffee Mug on Floor with Steam */}
                    <View style={styles.coffeeCup}>
                      <View style={styles.cupBody} />
                      <View style={styles.cupHandle} />
                      <View style={styles.cupSteam} />
                    </View>

                    {/* Floating AI Notes / Document Widget */}
                    <View style={styles.floatingDocWidget}>
                      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
                      <View style={styles.docHeader}>
                        <View style={styles.docDotRed} />
                        <View style={styles.docDotYellow} />
                        <View style={styles.docDotGreen} />
                        <Text style={styles.docTitle}>AI Lecture Assistant</Text>
                      </View>
                      <View style={styles.docContent}>
                        <View style={styles.docLinePrimary} />
                        <View style={styles.docLineSecondary} />
                        <View style={styles.docLineTertiary} />
                        <View style={styles.docTagRow}>
                          <View style={styles.docTag}>
                            <Text style={styles.docTagText}>⚡ RAG Sync</Text>
                          </View>
                          <View style={[styles.docTag, { backgroundColor: 'rgba(52,211,153,0.18)' }]}>
                            <Text style={[styles.docTagText, { color: MINT }]}>98% Match</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Potted Plant in Corner */}
                    <View style={styles.pottedPlant}>
                      <View style={styles.plantVase} />
                      <View style={[styles.plantLeaf, { transform: [{ rotate: '-25deg' }], left: 4 }]} />
                      <View style={[styles.plantLeaf, { transform: [{ rotate: '15deg' }], left: 16 }]} />
                      <View style={[styles.plantLeaf, { transform: [{ rotate: '35deg' }], left: 10, top: -14 }]} />
                    </View>

                    {/* Soft Rug Under Chair */}
                    <View style={styles.rugShadow} />
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: { flex: 1 },
  ambient: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  ambientTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  ambientBottomLeft: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  ambientCenter: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 700,
    height: 500,
    borderRadius: 250,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  outerContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 32,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: HAIRLINE,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 36,
    elevation: 10,
    overflow: 'hidden',
  },
  outerContainerWide: {
    maxWidth: 1100,
    padding: 36,
    minHeight: 640,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  brandName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#F5F7F6',
    letterSpacing: -0.4,
  },
  splitContent: {
    width: '100%',
  },
  splitContentWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
  },
  authCard: {
    width: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(18,28,22,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
    overflow: 'hidden',
  },
  authCardWide: {
    flex: 1,
    maxWidth: 460,
  },
  illustrationColumn: {
    flex: 1.1,
    height: 520,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  windowFrame: {
    position: 'absolute',
    right: 40,
    top: 20,
    width: 170,
    height: 240,
    borderWidth: 2.5,
    borderColor: 'rgba(52,211,153,0.3)',
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(14,23,18,0.45)',
  },
  windowPane: {
    width: '50%',
    height: '50%',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.2)',
  },
  floorLamp: {
    position: 'absolute',
    left: 40,
    top: 60,
    alignItems: 'center',
  },
  lampShade: {
    width: 44,
    height: 34,
    backgroundColor: '#34D399',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  lampPole: {
    width: 3.5,
    height: 280,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  lampBase: {
    width: 36,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  studySceneWrap: {
    position: 'absolute',
    left: 80,
    bottom: 20,
    width: 360,
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rugShadow: {
    position: 'absolute',
    bottom: 20,
    width: 240,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(52,211,153,0.12)',
  },
  loungeChair: {
    position: 'absolute',
    bottom: 40,
    left: 70,
    width: 140,
    height: 160,
  },
  chairBack: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 100,
    height: 120,
    borderRadius: 50,
    backgroundColor: '#0EA5A0',
  },
  chairSeat: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    width: 120,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0D9488',
  },
  chairArm: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F766E',
  },
  characterFigure: {
    position: 'absolute',
    bottom: 50,
    left: 60,
    width: 160,
    height: 220,
  },
  charHead: {
    position: 'absolute',
    top: 10,
    left: 70,
    width: 32,
    height: 36,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: MINT,
  },
  charHair: {
    position: 'absolute',
    top: -4,
    left: -2,
    width: 34,
    height: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#34D399',
  },
  charGlasses: {
    position: 'absolute',
    top: 12,
    right: 4,
    width: 14,
    height: 8,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  charTorso: {
    position: 'absolute',
    top: 48,
    left: 64,
    width: 44,
    height: 70,
    backgroundColor: '#14251D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  charLegTop: {
    position: 'absolute',
    top: 108,
    left: 48,
    width: 60,
    height: 24,
    backgroundColor: '#1E2D25',
    borderRadius: 12,
  },
  charLegBottom: {
    position: 'absolute',
    top: 120,
    left: 20,
    width: 22,
    height: 60,
    backgroundColor: '#1A2620',
    borderRadius: 11,
    transform: [{ rotate: '20deg' }],
  },
  charShoe: {
    position: 'absolute',
    top: 172,
    left: 0,
    width: 38,
    height: 18,
    borderRadius: 8,
    backgroundColor: '#34D399',
  },
  charLaptop: {
    position: 'absolute',
    top: 65,
    left: 36,
    width: 46,
    height: 38,
  },
  laptopScreen: {
    width: 38,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#0F1E17',
    borderWidth: 1.5,
    borderColor: MINT,
    transform: [{ rotate: '-12deg' }],
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  laptopKeyboard: {
    width: 42,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2DD4BF',
    marginTop: -2,
  },
  coffeeCup: {
    position: 'absolute',
    bottom: 24,
    right: 120,
    alignItems: 'center',
  },
  cupBody: {
    width: 22,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: MINT,
  },
  cupHandle: {
    position: 'absolute',
    right: -6,
    top: 6,
    width: 8,
    height: 12,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: MINT,
  },
  cupSteam: {
    width: 8,
    height: 10,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderWidth: 1.5,
    borderColor: '#34D399',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  floatingDocWidget: {
    position: 'absolute',
    top: 60,
    right: 0,
    width: 200,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(14,23,18,0.85)',
    borderWidth: 1,
    borderColor: MINT_RING,
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  docDotRed: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  docDotYellow: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F59E0B' },
  docDotGreen: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  docTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#F5F7F6',
    marginLeft: 4,
  },
  docContent: { gap: 7 },
  docLinePrimary: {
    width: '90%',
    height: 6,
    borderRadius: 3,
    backgroundColor: MINT,
  },
  docLineSecondary: {
    width: '75%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  docLineTertiary: {
    width: '60%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  docTagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  docTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(52,211,153,0.15)',
  },
  docTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9.5,
    color: MINT,
  },
  pottedPlant: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'center',
  },
  plantVase: {
    width: 24,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#0EA5A0',
  },
  plantLeaf: {
    position: 'absolute',
    top: -12,
    width: 8,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
});
