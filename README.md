# LectureIQ

**Learn Smarter with AI** — A React Native (Expo SDK 57) app that turns YouTube lectures into interactive Q&A. Ask questions about any lecture and get timestamp-cited answers from the transcript.

## Design System

Mint green (`#A8F9AB`) base with emerald, soft purple, coral and amber accents. Full palette in [`src/theme/colors.ts`](src/theme/colors.ts).

| Purpose | Color |
|---|---|
| Primary | `#A8F9AB` |
| Primary Dark / buttons | `#2E8B57` |
| Secondary / contrast | `#8E7CFF` |
| Background (light / dark) | `#F8FFF9` / `#121417` |
| Surface (light / dark) | `#FFFFFF` / `#1E2124` |
| Warning / Active mic | `#FFB84D` / `#FF7EB3` |
| Error / Success | `#FF6B6B` / `#A8F9AB` |

Fonts: **Poppins** (headings) + **Inter** (body) via `@expo-google-fonts`.

## Screens

1. **Splash** — logo fade + scale on gradient background
2. **Onboarding** — swipeable feature cards + Get Started
3. **Login / Signup** — animated mode toggle, Google/Apple buttons
4. **Home Dashboard** — lecture grid, stats card, mint FAB
5. **Add Lecture** — YouTube URL input with clipboard paste
6. **Processing Status** — animated step-by-step checkmarks
7. **Lecture Detail** — embedded YouTube player + Transcript/Notes/Chat tabs (transcript auto-syncs with playback timestamp)
8. **Chat (RAG)** — chat bubbles, voice mic, AI typing animation, tap-to-jump citations
9. **Voice Input** — bottom-sheet with live waveform (expo-audio)
10. **Notes** — sticky-note style cards
11. **Add/Edit Note** — rich toolbar, color picker, lecture linking
12. **Search** — global search with filter chips + highlight match
13. **Lecture Summary** — AI key points + Generate Quiz
14. **Quiz** — gamified MCQ with score, progress, review
15. **Profile** — gradient card, usage stats
16. **Settings** — dark mode toggle, language, notifications, account
17. **Bookmarks** — saved answers & highlights, grouped by lecture

## Tech

- Expo SDK 57 / React Native 0.86 / React 19
- React Navigation 7 (native-stack + bottom tabs, light/dark themes)
- react-native-reanimated 4 (animations), react-native-worklets
- expo-linear-gradient, expo-audio, expo-clipboard, expo-haptics
- react-native-webview (YouTube embed)
- AsyncStorage (theme persistence)

## Run

```bash
npm install
npm run start      # Expo dev server (use Expo Go)
npm run android
npm run ios
```

The app currently uses mock data in [`src/data/mock.ts`](src/data/mock.ts) — swap it with real transcript/embedding API calls in `src/utils`.

## Structure

```
src/
  components/   reusable UI (buttons, cards, toggles, skeleton, waveform...)
  context/      ThemeContext (light/dark mode)
  data/         mock lectures, transcripts, notes, quiz, chat
  navigation/   RootNavigator (stack) + MainTabs (bottom tabs) + types
  screens/      all 17 screens
  theme/        colors + typography tokens
  utils/        haptics, time formatting, YouTube helpers
```