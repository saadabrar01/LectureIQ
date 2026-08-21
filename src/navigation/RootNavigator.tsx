import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../context/ThemeContext';
import type { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { AddLectureScreen } from '../screens/AddLectureScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { LectureDetailScreen } from '../screens/LectureDetailScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { VoiceModal } from '../screens/VoiceModal';
import { AddNoteScreen } from '../screens/AddNoteScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { QuizConfigScreen } from '../screens/QuizConfigScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { MainTabs } from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="AddLecture" component={AddLectureScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="LectureDetail" component={LectureDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="Voice"
        component={VoiceModal}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="AddNote"
        component={AddNoteScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Summary" component={SummaryScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen
        name="QuizConfig"
        component={QuizConfigScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}