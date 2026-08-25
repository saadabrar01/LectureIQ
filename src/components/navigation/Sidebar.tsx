// Floating vertical dock navigation for wide screens — macOS-dock inspired.
// Lightweight glass panel floats on the left edge; each nav item is an
// icon button with hover scale + tooltip label, active item glows with
// LectureIQ's mint→green gradient. Brand on top, Settings/Logout at the
// bottom behind a soft divider. Functionality is identical to the tabs.
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onboardingPalette } from '../../theme/onboarding';
import { haptics } from '../../utils/helpers';

interface SidebarProps {
  active: string;
}

const ITEMS: { key: string; label: string; icon: string; iconOff: string }[] = [
  { key: 'Home', label: 'Home', icon: 'home', iconOff: 'home' },
  { key: 'Notes', label: 'Notes', icon: 'sticky-note-2', iconOff: 'sticky-note-2' },
  { key: 'Search', label: 'Search', icon: 'search', iconOff: 'search' },
  { key: 'Bookmarks', label: 'Saved', icon: 'bookmark', iconOff: 'bookmark-border' },
  { key: 'Profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

const SPRING = { damping: 16, stiffness: 220, mass: 0.6 };

function DockItem({
  icon,
  label,
  scale,
  active,
  hovered,
  tooltip,
  onHoverIn,
  onHoverOut,
  onPress,
}: {
  icon: string;
  label: string;
  scale: number;
  active: boolean;
  hovered: boolean;
  tooltip: { opacity: SharedValue<number>; x: SharedValue<number> };
  onHoverIn: () => void;
  onHoverOut: () => void;
  onPress: () => void;
}) {
  const animatedScale = useSharedValue(scale);
  React.useEffect(() => {
    animatedScale.value = withSpring(scale, SPRING);
  }, [scale, animatedScale]);

  const itemStyle = useAnimatedStyle(() => ({ transform: [{ scale: animatedScale.value }] }));
  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltip.opacity.value,
    transform: [{ translateX: tooltip.x.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={styles.itemOuter}
    >
      <Animated.View style={[styles.item, itemStyle]}>
        {active ? (
          <LinearGradient
            colors={[onboardingPalette.primary, onboardingPalette.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconActive}
          >
            <MaterialIcons name={icon as never} size={23} color={onboardingPalette.accentDeep} />
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.iconIdle,
              hovered && { backgroundColor: 'rgba(255,255,255,0.06)' },
            ]}
          >
            <MaterialIcons
              name={icon as never}
              size={22}
              color={hovered ? onboardingPalette.text : onboardingPalette.muted}
            />
          </View>
        )}
      </Animated.View>

      {/* Tooltip label on hover */}
      <Animated.View style={[styles.tooltip, tooltipStyle, { pointerEvents: 'none' }]}>
        <Text style={styles.tooltipText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Sidebar({ active }: SidebarProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [hovered, setHovered] = useState<number | null>(null);

  const tooltipVisible = useSharedValue(0);
  const tooltipX = useSharedValue(6);

  const showTooltip = () => {
    tooltipVisible.value = withSpring(1, SPRING);
    tooltipX.value = withSpring(0, SPRING);
  };
  const hideTooltip = () => {
    tooltipVisible.value = withSpring(0, SPRING);
    tooltipX.value = withSpring(6, SPRING);
  };

  const go = (key: string) => {
    haptics.light();
    navigation.navigate(key as never);
  };

  const openSettings = () => {
    haptics.light();
    navigation.navigate('Settings' as never);
  };

  const logout = () => {
    haptics.medium();
    navigation.navigate('Login' as never);
  };

  const scaleFor = (i: number) => {
    if (hovered === null) return 1;
    if (i === hovered) return 1.12;
    if (Math.abs(i - hovered) === 1) return 1.05;
    return 1;
  };

  return (
    <View
      style={[
        styles.dockWrap,
        {
          top: insets.top + 22,
          bottom: insets.bottom + 22,
        },
      ]}
    >
      <View style={styles.dock}>
        <BlurView intensity={32} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 26 }]} />

        {/* Brand */}
        <View style={styles.brand}>
          <LinearGradient
            colors={[onboardingPalette.primary, onboardingPalette.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoTile}
          >
            <MaterialIcons name="auto-awesome" size={17} color={onboardingPalette.accentDeep} />
          </LinearGradient>
          <Text style={styles.brandName}>LectureIQ</Text>
          <Text style={styles.brandTag}>AI Learning</Text>
        </View>

        <View style={styles.divider} />

        {/* Primary navigation */}
        <View style={styles.list}>
          {ITEMS.map((item, i) => (
            <DockItem
              key={item.key}
              icon={active === item.key ? item.icon : item.iconOff}
              label={item.label}
              scale={scaleFor(i)}
              active={active === item.key}
              hovered={hovered === i}
              tooltip={{ opacity: tooltipVisible, x: tooltipX }}
              onHoverIn={() => {
                setHovered(i);
                showTooltip();
              }}
              onHoverOut={() => {
                setHovered(null);
                hideTooltip();
              }}
              onPress={() => go(item.key)}
            />
          ))}
        </View>

        <View style={styles.spacer} />

        {/* Secondary actions */}
        <View style={styles.divider} />
        <DockItem
          icon="settings"
          label="Settings"
          scale={hovered === null ? 1 : Math.abs(hovered - ITEMS.length) === 1 ? 1.05 : 1}
          active={false}
          hovered={false}
          tooltip={{ opacity: tooltipVisible, x: tooltipX }}
          onHoverIn={showTooltip}
          onHoverOut={hideTooltip}
          onPress={openSettings}
        />
        <DockItem
          icon="logout"
          label="Log out"
          scale={1}
          active={false}
          hovered={hovered === ITEMS.length + 1}
          tooltip={{ opacity: tooltipVisible, x: tooltipX }}
          onHoverIn={() => {
            setHovered(ITEMS.length + 1);
            showTooltip();
          }}
          onHoverOut={() => {
            setHovered(null);
            hideTooltip();
          }}
          onPress={logout}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrap: {
    position: 'absolute',
    left: 16,
    width: 76,
    zIndex: 50,
    elevation: 20,
  },
  dock: {
    flex: 1,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(10,15,13,0.55)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10,
  },
  brand: { alignItems: 'center', gap: 5, marginBottom: 4 },
  logoTile: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: onboardingPalette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  },
  brandName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 0.4,
    color: onboardingPalette.text,
  },
  brandTag: {
    fontFamily: 'Inter_500Medium',
    fontSize: 8,
    color: onboardingPalette.muted,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  list: { gap: 8 },
  itemOuter: {
    borderRadius: 15,
  },
  item: {
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: onboardingPalette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  iconIdle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute',
    left: 60,
    top: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(10,14,12,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  tooltipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: onboardingPalette.text,
  },
  spacer: { flex: 1 },
});