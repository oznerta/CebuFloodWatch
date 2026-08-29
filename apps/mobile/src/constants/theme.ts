/**
 * CebuFloodWatch — Apple Design System (iOS Human Interface Guidelines)
 * Clean white surfaces, smooth frosted glass, soft drop shadows, and vibrant iOS system accents.
 */

export const COLORS = {
  // Apple iOS System Backgrounds
  background: '#F2F2F7', // iOS Grouped Background
  backgroundSecondary: '#E5E5EA',
  card: '#FFFFFF', // Pure White Surface
  cardSubtle: '#F8F9FA',
  cardGlass: 'rgba(255, 255, 255, 0.85)',

  // Apple Vibrant System Accents
  primary: '#007AFF', // Apple System Blue
  primarySubtle: '#E5F1FF',
  success: '#34C759', // Apple System Green
  successSubtle: '#EBF9EE',
  warning: '#FF9500', // Apple System Orange
  warningSubtle: '#FFF4E5',
  danger: '#FF3B30', // Apple System Red
  dangerSubtle: '#FFEBEA',
  purple: '#AF52DE', // Apple System Purple
  purpleSubtle: '#F7ECFB',
  teal: '#5AC8FA', // Apple System Teal

  // Typography & Borders
  text: '#1C1C1E', // Apple Primary Label
  textSecondary: '#6C6C70', // Apple Secondary Label
  textTertiary: '#8E8E93', // Apple Tertiary Label
  border: '#E5E5EA', // iOS System Separator
  borderLight: '#F2F2F7',

  // Shadows
  shadowColor: '#000000',
};

export const TYPOGRAPHY = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: COLORS.text,
  },
  title1: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  title2: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  headline: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: COLORS.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.textSecondary,
  },
};
