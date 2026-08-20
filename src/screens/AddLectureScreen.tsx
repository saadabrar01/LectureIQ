import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { AppCard } from '../components/AppCard';
import { Header } from '../components/Header';
import { GlowBackground } from '../components/GlowBackground';
import { extractVideoId, haptics } from '../utils/helpers';

export function AddLectureScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const pasteFromClipboard = async () => {
    haptics.light();
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrl(text.trim());
      setError('');
    }
  };

  const submit = () => {
    if (!extractVideoId(url)) {
      setError('Please enter a valid YouTube URL.');
      haptics.warning();
      return;
    }
    haptics.success();
    navigation.navigate('Processing', { url });
  };

  return (
    <GlowBackground>
      <View style={styles.container}>
        <Header title="Add Lecture" subtitle="Paste a YouTube link to start learning" back />
        <View style={styles.body}>
          <AppCard style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceAlt }]}>
              <MaterialCommunityIcons name="youtube" size={40} color="#FF4E45" />
            </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Add a YouTube video
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            We will extract the transcript, understand it, and let you chat with the lecture.
          </Text>

          <AppInput
            label="YouTube URL"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChangeText={(t) => {
              setUrl(t);
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            icon={<MaterialIcons name="link" size={22} color={theme.textSecondary} />}
            rightElement={
              <View style={styles.pasteBtn}>
                <MaterialIcons
                  name="content-paste"
                  size={22}
                  color={theme.primaryDark}
                />
              </View>
            }
            containerStyle={styles.input}
          />
          <Text style={[styles.pasteHint, { color: theme.textSecondary }]}>
            Tip: tap the paste icon to auto-detect from clipboard
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton
            title="Start Processing"
            variant="gradient"
            onPress={submit}
            icon={<MaterialIcons name="rocket-launch" size={20} color="#1A1A1A" />}
            style={styles.submit}
          />
        </AppCard>
      </View>
      </View>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    flex: 1,
    padding: 20,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  card: { padding: 24, alignItems: 'center', marginTop: 12 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { ...typography.h2, marginBottom: 6, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 22,
  },
  input: { width: '100%', marginTop: 4 },
  pasteBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(142,240,163,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteHint: { ...typography.caption, width: '100%', marginTop: 8 },
  error: { ...typography.bodySmall, color: '#FF6B6B', width: '100%', marginTop: 6 },
  submit: { width: '100%', marginTop: 18 },
});