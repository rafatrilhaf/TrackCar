// hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import { theme as baseTheme } from '../constants/theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const colors = isDark ? Colors.dark : Colors.light;
  
  return {
    colors,
    isDark,
    ...baseTheme,
  };
};