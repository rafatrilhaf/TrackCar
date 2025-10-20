// components/ThemeTransition.tsx - VERSÃO OTIMIZADA
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ThemeTransitionProps {
  children: React.ReactNode;
}

export const ThemeTransition: React.FC<ThemeTransitionProps> = ({ children }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevThemeRef = useRef(theme.isDark);

  useEffect(() => {
    // CORRIGIDO: Só anima se o tema realmente mudou
    if (prevThemeRef.current !== theme.isDark) {
      console.log('Theme changed, animating transition:', prevThemeRef.current, '->', theme.isDark);
      
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 100, // Mais rápido
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100, // Mais rápido
          useNativeDriver: true,
        }),
      ]).start();
      
      prevThemeRef.current = theme.isDark;
    }
  }, [theme.isDark, fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});