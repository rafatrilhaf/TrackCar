// hooks/useThemeManager.ts - VERSÃO CORRIGIDA PARA ATUALIZAÇÃO IMEDIATA
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega o tema salvo na inicialização
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
      setIsLoaded(true);
    } catch (error) {
      console.log('Erro ao carregar tema:', error);
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      // CORRIGIDO: Atualiza o estado imediatamente
      setThemeModeState(mode);
      
      // Salva em background para não bloquear a UI
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
        console.log('Erro ao salvar tema:', error);
      });
    } catch (error) {
      console.log('Erro ao definir tema:', error);
    }
  };

  const toggleTheme = () => {
    // CORRIGIDO: Determina o novo modo baseado no estado atual efetivo
    const currentEffectiveScheme = getEffectiveScheme();
    const newMode = currentEffectiveScheme === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Determina o esquema atual baseado na configuração
  const getEffectiveScheme = (): ColorSchemeName => {
    if (!isLoaded) {
      // Durante o carregamento, usa o esquema do sistema
      return currentScheme;
    }
    
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