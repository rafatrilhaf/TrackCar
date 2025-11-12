// constants/theme.ts
import { scaleFont, scaleSpacing } from '../utils/responsive';

export const theme = {
  spacing: {
    xs: scaleSpacing(4),
    sm: scaleSpacing(8),
    md: scaleSpacing(16),
    lg: scaleSpacing(24),
    xl: scaleSpacing(32),
    xxl: scaleSpacing(48),
  },
  
  borderRadius: {
    sm: scaleSpacing(4),
    md: scaleSpacing(8),
    lg: scaleSpacing(12),
    xl: scaleSpacing(20),
    full: 999,
  },

  fontSize: {
    xs: scaleFont(12),
    sm: scaleFont(14),
    md: scaleFont(16),
    lg: scaleFont(18),
    xl: scaleFont(20),
    xxl: scaleFont(24),
    title: scaleFont(28),
    header: scaleFont(32),
  },

  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
