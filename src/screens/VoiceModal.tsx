import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
} from 'expo-audio';
import { useAppTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { AnimatedMicButton } from '../components/AnimatedMicButton';
import { Waveform } from '../components/Waveform';
import { haptics } from '../utils/helpers';

export function VoiceModal() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { lectureId } = route.params as { lectureId?: string };

  const [visible, setVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [permission, setPermission] = useState(true);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const recording = recorderState.isRecording;

  const close = () => {
    setVisible(false);
    setTimeout(() => navigation.goBack(), 200);
  };

  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        const status = await AudioModule.requestRecordingPermissionsAsync();
        setPermission(status.granted);
      } catch {
        setPermission(true);
      }
    })();
    return () => {
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (recording) {
      interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording]);

  const start = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      haptics.medium();
    } catch {
      Alert.alert('Could not start recording');
    }
  };

  const stop = () => {
    haptics.success();
    recorder.stop();
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 24,
              backgroundColor: theme.background,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {recording ? 'Listening...' : permission ? 'Tap to talk' : 'Microphone access needed'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {recording ? `Recording ${elapsed}s — ask your question` : 'Ask a question about your lecture'}
          </Text>

          <View style={[styles.waveArea, { backgroundColor: theme.surfaceAlt }]}>
            {recording ? (
              <Waveform active />
            ) : (
              <View style={styles.waveIdleRow}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveIdle,
                      {
                        backgroundColor: theme.border,
                        height: 8 + ((i * 3) % 12),
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <AnimatedMicButton active={recording} onPress={recording ? stop : start} size={84}>
            <MaterialIcons
              name={recording ? 'stop' : 'mic'}
              size={34}
              color="#fff"
            />
          </AnimatedMicButton>

          <View style={[styles.badge, { backgroundColor: theme.surfaceAlt }]}>
            <MaterialIcons name="auto-awesome" size={14} color={theme.secondary} />
            <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
              Powered by Whisper AI transcription
            </Text>
          </View>

          <Pressable onPress={close} style={styles.cancelRow}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  handle: { width: 44, height: 5, borderRadius: 3, marginBottom: 20 },
  title: { ...typography.h2 },
  subtitle: { ...typography.body, marginTop: 6, textAlign: 'center' },
  waveArea: {
    width: '100%',
    height: 120,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 28,
  },
  waveIdleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  waveIdle: { width: 4, borderRadius: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 22,
  },
  badgeText: { ...typography.caption },
  cancelRow: { marginTop: 18 },
  cancelText: { ...typography.headingSemi },
});