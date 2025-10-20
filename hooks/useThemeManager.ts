// hooks/useThemeManager.ts - VERSÃO FUNCIONAL SIMPLES
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

const THEME_STORAGE_KEY = '@trackcar_theme';

type ThemeMode = 'light' | 'dark' | 'system';

// Estado global compartilhado
let globalIsDark = false;
let globalListeners: (() => void)[] = [];

const notifyAllListeners = () => {
  globalListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.log('Erro ao notificar listener:', error);
    }
  });
};

const addGlobalListener = (listener: () => void) => {
  globalListeners.push(listener);
  return () => {
    globalListeners = globalListeners.filter(l => l !== listener);
  };
};

const updateGlobalTheme = (isDark: boolean) => {
  if (globalIsDark !== isDark) {
    globalIsDark = isDark;
    console.log('🎨 Global theme updated to:', isDark ? 'DARK' : 'LIGHT');
    notifyAllListeners();
  }
};

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
  const [isDark, setIsDark] = useState(globalIsDark);
  const [, forceUpdate] = useState(0);

  // Listener para mudanças globais de tema
  useEffect(() => {
    const cleanup = addGlobalListener(() => {
      console.log('📱 Component received theme change notification');
      setIsDark(globalIsDark);
      forceUpdate(prev => prev + 1);
    });
    return cleanup;
  }, []);

  // Carrega tema salvo na inicialização
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Escuta mudanças do sistema
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('🌓 System theme changed to:', colorScheme);
      setCurrentScheme(colorScheme);
      
      // Se está no modo system, atualiza o tema
      if (themeMode === 'system') {
        updateGlobalTheme(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, [themeMode]);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        const mode = savedTheme as ThemeMode;
        console.log('💾 Loaded saved theme:', mode);
        setThemeModeState(mode);
        
        // Calcula o tema efetivo
        const effectiveIsDark = mode === 'system' 
          ? currentScheme === 'dark' 
          : mode === 'dark';
        
        updateGlobalTheme(effectiveIsDark);
      } else {
        // Default para system
        console.log('🔄 Using system theme by default');
        updateGlobalTheme(currentScheme === 'dark');
      }
    } catch (error) {
      console.log('❌ Error loading theme:', error);
      updateGlobalTheme(currentScheme === 'dark');
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      console.log('🎯 Setting theme mode to:', mode);
      setThemeModeState(mode);
      
      // Calcula e atualiza o tema imediatamente
      const effectiveIsDark = mode === 'system' 
        ? currentScheme === 'dark' 
        : mode === 'dark';
      
      updateGlobalTheme(effectiveIsDark);
      
      // Salva em background
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
        console.log('❌ Error saving theme:', error);
      });
    } catch (error) {
      console.log('❌ Error setting theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    console.log('🔄 Toggling theme from', isDark ? 'dark' : 'light', 'to', newMode);
    setThemeMode(newMode);
  };

  // Calcula o esquema efetivo
  const getEffectiveScheme = (): ColorSchemeName => {
    if (themeMode === 'system') {
      return currentScheme;
    }
    return themeMode;
  };

  const effectiveScheme = getEffectiveScheme();

  return {
    themeMode,
    currentScheme: effectiveScheme,
    setThemeMode,
    toggleTheme,
    isDark,
  };
};