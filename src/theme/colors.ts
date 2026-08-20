export const colors = {
  primary: '#8EF0A3',
  primaryDark: '#2FA866',
  primaryDeep: '#06281A',
  teal: '#22C55E',
  secondary: '#9F8FF0',
  lavender: '#9F8FF0',
  coral: '#F9A8A8',
  amber: '#FBBF24',
  backgroundLight: '#F8FFF9',
  backgroundDark: '#0B0F0E',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#0E1712',
  textPrimaryLight: '#1A1A1A',
  textPrimaryDark: '#F5F7F6',
  textSecondaryLight: '#6B7280',
  textSecondaryDark: '#8D9B92',
  success: '#8EF0A3',
  warning: '#FFB84D',
  error: '#FF6B6B',
  mic: '#FF7EB3',
  borderLight: '#E3F2E5',
  borderDark: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBgLight: 'rgba(255, 255, 255, 0.72)',
  glassBgDark: 'rgba(255, 255, 255, 0.05)',
  glowMint: 'rgba(142, 240, 163, 0.14)',
  glowLavender: 'rgba(159, 143, 240, 0.12)',
  overlay: 'rgba(0,0,0,0.55)',
  white: '#FFFFFF',
  black: '#000000',
};

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  primary: string;
  primaryDark: string;
  primaryDeep: string;
  teal: string;
  secondary: string;
  lavender: string;
  coral: string;
  amber: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  mic: string;
  border: string;
  glassBorder: string;
  glassBg: string;
  glowMint: string;
  glowLavender: string;
  overlay: string;
  shadowColor: string;
  gradient: readonly [string, string];
  gradientSoft: readonly [string, string];
  cardShadow: string;
  white: string;
  black: string;
}

export const lightTheme: AppTheme = {
  mode: 'light',
  white: colors.white,
  black: colors.black,
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  primaryDeep: colors.primaryDeep,
  teal: colors.teal,
  secondary: colors.secondary,
  lavender: colors.lavender,
  coral: colors.coral,
  amber: colors.amber,
  background: colors.backgroundLight,
  surface: colors.surfaceLight,
  surfaceAlt: '#F1FBF2',
  textPrimary: colors.textPrimaryLight,
  textSecondary: colors.textSecondaryLight,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  mic: colors.mic,
  border: colors.borderLight,
  glassBorder: colors.borderLight,
  glassBg: colors.glassBgLight,
  glowMint: 'rgba(142, 240, 163, 0.35)',
  glowLavender: 'rgba(159, 143, 240, 0.3)',
  overlay: colors.overlay,
  shadowColor: '#1A1A1A',
  gradient: ['#8EF0A3', '#9F8FF0'] as const,
  gradientSoft: ['#8EF0A3', '#9F8FF0'] as const,
  cardShadow: 'rgba(46, 139, 87, 0.18)',
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  white: colors.white,
  black: colors.black,
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  primaryDeep: colors.primaryDeep,
  teal: colors.teal,
  secondary: colors.secondary,
  lavender: colors.lavender,
  coral: colors.coral,
  amber: colors.amber,
  background: colors.backgroundDark,
  surface: colors.surfaceDark,
  surfaceAlt: 'rgba(255,255,255,0.04)',
  textPrimary: colors.textPrimaryDark,
  textSecondary: colors.textSecondaryDark,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  mic: colors.mic,
  border: colors.borderDark,
  glassBorder: colors.glassBorder,
  glassBg: colors.glassBgDark,
  glowMint: 'rgba(142,240,163,0.12)',
  glowLavender: 'rgba(159,143,240,0.1)',
  overlay: colors.overlay,
  shadowColor: '#000000',
  gradient: ['#8EF0A3', '#22C55E'] as const,
  gradientSoft: ['#8EF0A3', '#22C55E'] as const,
  cardShadow: 'rgba(0, 0, 0, 0.6)',
};