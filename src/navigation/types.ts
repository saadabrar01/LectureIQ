import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: { initialSlide?: number } | undefined;
  Login: undefined;
  Signup: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  AddLecture: undefined;
  Processing: { url: string } | undefined;
  LectureDetail: { lectureId: string };
  Chat: { lectureId: string };
  Voice: { lectureId?: string };
  AddNote: { noteId?: string };
  Summary: { lectureId: string };
  Quiz: { lectureId: string; count?: number };
  QuizConfig: { lectureId: string };
  Settings: undefined;
  Documents: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Notes: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

export interface ScreenProps<RouteName extends keyof RootStackParamList> {
  navigation: {
    navigate: <T extends keyof RootStackParamList>(
      screen: T,
      params?: RootStackParamList[T]
    ) => void;
    goBack: () => void;
  };
  route: { params: RootStackParamList[RouteName] };
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, MainTabParamList {}
  }
}