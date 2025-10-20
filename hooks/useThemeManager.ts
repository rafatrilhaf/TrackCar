// hooks/useThemeManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

const THEME_STORAGE_KEY = '@trackcar_theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeManager {
  themeMode: ThemeMode;
  currentScheme: ColorSchemeName;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const useThemeManager = (): ThemeManager => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [currentScheme, setCurrentScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Carrega o tema salvo
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Escuta mudanças do sistema
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setCurrentScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.log('Erro ao carregar tema:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.log('Erro ao salvar tema:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  // Determina o esquema atual baseado na configuração
  const getEffectiveScheme = (): ColorSchemeName => {
    if (themeMode === 'system') {
      return currentScheme;
    }
    return themeMode;
  };

  const effectiveScheme = getEffectiveScheme();
  const isDark = effectiveScheme === 'dark';

  return {
    themeMode,
    currentScheme: effectiveScheme,
    setThemeMode,
    toggleTheme,
    isDark,
  };
};
