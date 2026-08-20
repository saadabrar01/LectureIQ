import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { Header } from '../components/Header';
import { GlassCard } from '../components/GlassCard';
import { GlowBackground } from '../components/GlowBackground';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { haptics } from '../utils/helpers';

const LANGUAGES = ['English (en)', 'Hindi (hi)', 'Spanish (es)', 'French (fr)', 'German (de)', 'Arabic (ar)'];

export function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [language, setLanguage] = useState(LANGUAGES[0]);

  const menuTap = () => haptics.light();

  const row = (
    icon: string,
    iconBg: string,
    label: string,
    desc: string,
    right: React.ReactNode
  ) => (
    <GlassCard style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon as never} size={20} color={theme.primaryDark} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>{desc}</Text>
      </View>
      {right}
    </GlassCard>
  );

  const navRow = (icon: string, iconBg: string, label: string, desc: string, onPress: () => void) => (
    <GlassCard onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon as never} size={20} color={theme.primaryDark} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>{desc}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
    </GlassCard>
  );

  const deleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your lectures. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptics.warning();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  return (
    <GlowBackground>
      <View style={styles.container}>
        <Header title="Settings" subtitle="Customize your experience" back />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Appearance</Text>
        {row('dark-mode', 'rgba(142,124,255,0.2)', 'Dark mode', isDark ? 'Dark theme enabled' : 'Light theme enabled', (
          <ToggleSwitch value={isDark} onValueChange={toggleTheme} />
        ))}

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Preferences</Text>
        {row(
          'language',
          'rgba(46,139,87,0.15)',
          'Transcription language',
          language,
          <Pressable onPress={menuTap} style={styles.pickerBtn}>
            <Text style={[styles.pickerText, { color: theme.primaryDark }]}>Change</Text>
          </Pressable>
        )}
        {row('notifications', 'rgba(255,184,77,0.25)', 'Notifications', 'Remind me to review lectures', (
          <ToggleSwitch value={notifications} onValueChange={setNotifications} />
        ))}
        {row('volume-up', 'rgba(142,240,163,0.18)', 'Sound effects', 'Play sounds on actions', (
          <ToggleSwitch value={sound} onValueChange={setSound} />
        ))}
        {row('cloud-done', 'rgba(255,126,179,0.2)', 'Auto-save notes', 'Save notes automatically', (
          <ToggleSwitch value={autoSave} onValueChange={setAutoSave} />
        ))}

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Account</Text>
        {navRow('lock', 'rgba(46,139,87,0.15)', 'Change password', 'Update your password', menuTap)}
        {navRow('help-outline', 'rgba(142,124,255,0.2)', 'Help & support', 'FAQ, tutorials and contact', menuTap)}

        <Pressable onPress={deleteAccount} style={[styles.dangerRow, { backgroundColor: 'rgba(255,107,107,0.1)' }]}>
          <MaterialIcons name="delete-outline" size={20} color={theme.error} />
          <Text style={[styles.dangerText, { color: theme.error }]}>Delete account</Text>
        </Pressable>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          LectureIQ makes you learn smarter with AI
        </Text>
        </ScrollView>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    // settings surface: centered max-w-5xl panel with comfortable gutters
    paddingBottom: 60,
    maxWidth: 1024,
    width: '100%',
    alignSelf: 'center',
  },
  sectionLabel: { ...typography.caption, marginHorizontal: 28, marginTop: 18, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 28,
    marginBottom: 10,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodySemi },
  rowDesc: { ...typography.caption, marginTop: 2 },
  pickerBtn: {
    backgroundColor: 'rgba(142,240,163,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pickerText: { ...typography.caption },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 28,
    padding: 15,
    borderRadius: 18,
    marginTop: 10,
  },
  dangerText: { ...typography.bodySemi },
  footer: { ...typography.caption, textAlign: 'center', marginTop: 24 },
});