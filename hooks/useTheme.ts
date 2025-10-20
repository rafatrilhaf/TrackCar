// hooks/useTheme.ts - VERSÃO SINCRONIZADA COM LOGS
import { Colors } from '../constants/colors';
import { theme as baseTheme } from '../constants/theme';
import { useThemeManager } from './useThemeManager';

export const useTheme = () => {
  const { isDark } = useThemeManager();
  
  const colors = isDark ? Colors.dark : Colors.light;
  
  console.log('🎨 useTheme render:', { 
    isDark, 
    backgroundUsed: colors.background,
    textUsed: colors.text,
    colorsType: isDark ? 'DARK' : 'LIGHT'
  });
  
  return {
    colors,
    isDark,
    ...baseTheme,
  };
};