import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { MainTabParamList } from './types';
import { GlowBackground } from '../components/GlowBackground';
import { Sidebar } from '../components/navigation/Sidebar';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, [string, string]> = {
  Home: ['home', 'home'],
  Notes: ['sticky-note-2', 'sticky-note-2'],
  Search: ['search', 'search'],
  Library: ['library-books', 'library-books'],
  Profile: ['person', 'person-outline'],
};

const LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Home',
  Notes: 'Notes',
  Search: 'Search',
  Library: 'Library',
  Profile: 'Profile',
};

// Wide screens (≥760px) show the navigation as a floating dock;
// small screens keep the floating bottom tab bar.
const SIDEBAR_MIN_WIDTH = 760;

function ScreenContainer({ children }: { children: React.ReactNode }) {
  const route = useRoute();
  const { width } = useWindowDimensions();
  const wide = width >= SIDEBAR_MIN_WIDTH;

  if (wide) {
    return (
      <View style={styles.screenRootWide}>
        <GlowBackground style={styles.screenContentWithDock}>
          {children}
        </GlowBackground>
        {/* Dock renders on TOP so the opaque background never covers it */}
        <Sidebar active={route.name} />
      </View>
    );
  }

  return <GlowBackground style={styles.screenContent}>{children}</GlowBackground>;
}

const WRAPPED: Record<keyof MainTabParamList, React.ComponentType<any>> = {
  Home: (props) => (
    <ScreenContainer>
      <HomeScreen {...props} />
    </ScreenContainer>
  ),
  Notes: (props) => (
    <ScreenContainer>
      <NotesScreen {...props} />
    </ScreenContainer>
  ),
  Search: (props) => (
    <ScreenContainer>
      <SearchScreen {...props} />
    </ScreenContainer>
  ),
  Library: (props) => (
    <ScreenContainer>
      <LibraryScreen {...props} />
    </ScreenContainer>
  ),
  Profile: (props) => (
    <ScreenContainer>
      <ProfileScreen {...props} />
    </ScreenContainer>
  ),
};

export function MainTabs() {
  const { theme } = useAppTheme();
  const isDark = theme.mode === 'dark';
  const { width } = useWindowDimensions();
  const wide = width >= SIDEBAR_MIN_WIDTH;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: wide
          ? { display: 'none' }
          : {
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 18,
              height: 68,
              borderRadius: 34,
              borderTopWidth: 0,
              borderWidth: 1,
              borderColor: theme.glassBorder,
              elevation: 0,
              shadowColor: theme.primaryDeep,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              overflow: 'hidden',
              backgroundColor: theme.glassBg,
            },
        tabBarBackground: () => (
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          const [activeIcon, inactiveIcon] = ICONS[route.name];
          return (
            <View
              style={[
                styles.iconWrap,
                focused && { borderColor: theme.glassBorder },
              ]}
            >
              {focused ? (
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <MaterialIcons
                    name={activeIcon as never}
                    size={22}
                    color={theme.primaryDeep}
                  />
                </LinearGradient>
              ) : (
                <MaterialIcons name={inactiveIcon as never} size={22} color={color} />
              )}
            </View>
          );
        },
      })}
    >
      {(
        Object.keys(ICONS) as Array<keyof MainTabParamList>
      ).map((name) => (
        <Tab.Screen
          key={name}
          name={name}
          component={WRAPPED[name]}
          options={{ tabBarLabel: LABELS[name] }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screenRootWide: { flex: 1, flexDirection: 'row' },
  screenContent: { flex: 1 },
  screenContentWithDock: { flex: 1, paddingLeft: 106 },
  tabItem: { paddingVertical: 6 },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginTop: 2,
  },
  iconGradient: {
    width: 36,
    height: 30,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});