// hooks/useTheme.ts - VERSÃO ATUALIZADA
import { Colors } from '../constants/colors';
import { theme as baseTheme } from '../constants/theme';
import { useThemeManager } from './useThemeManager';

export const useTheme = () => {
  const { isDark } = useThemeManager();
  
  const colors = isDark ? Colors.dark : Colors.light;
  
  return {
    colors,
    isDark,
    ...baseTheme,
  };
};
