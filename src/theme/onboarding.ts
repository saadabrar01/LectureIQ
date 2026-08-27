// LectureIQ design tokens — shared by Onboarding, Login, Signup and Splash.
// Single source of truth for the dark premium SaaS look:
// charcoal-black background + vibrant mint/teal accents with soft gradient glows.
export const onboardingPalette = {
  // Background gradient stops (charcoal, slightly lifted at center)
  bgDeep: '#0B0F0E',
  bgSoft: '#101614',
  // Vibrant mint green + teal accents
  primary: '#8EF0A3',
  secondary: '#22C55E',
  teal: '#3FC9A7',
  lavender: '#9F8FF0',
  // Deep green used for text/icons sitting on top of mint gradients
  accentDeep: '#06281A',
  text: '#F5F7F6',
  muted: '#8D9B92',
  card: 'rgba(255,255,255,0.04)',
  cardStrong: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  mintGlow: 'rgba(142,240,163,0.13)',
  lavenderGlow: 'rgba(159,143,240,0.11)',
  amber: 'rgba(251,191,36,0.9)',
  rose: 'rgba(243,169,201,0.9)',
};

export const onboardingMetrics = {
  stageW: 368,
  stageH: 340,
  radiusCard: 22,
  radiusShape: 46,
  radiusPill: 999,
};

// Unified emerald→teal accent family — matches the Home / Profile / Notes redesigns.
export const accent = {
  emerald: '#34D399',
  teal: '#2DD4BF',
  tealDeep: '#0EA5A0',
  mint: '#8EF0A3',
  ring: 'rgba(52,211,153,0.55)',
  glow: 'rgba(52,211,153,0.25)',
  onGradient: '#06281A',
  gradient: ['#34D399', '#0EA5A0'] as const,
} as const;

export const authTokens = {
  inputBg: 'rgba(255,255,255,0.03)',
  inputFocusBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.1)',
  inputBorderHover: accent.ring,
  focusGlow: accent.glow,
  label: 'rgba(245,247,246,0.75)',
  placeholder: 'rgba(141,155,146,0.65)',
  divider: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.14)',
};

export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 24,
  s6: 32,
  s7: 48,
  s8: 64,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
} as const;