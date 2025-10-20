// components/ThemeSwitch.tsx - VERSÃO OTIMIZADA PARA ATUALIZAÇÃO IMEDIATA
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useThemeManager } from '../hooks/useThemeManager';

interface ThemeSwitchProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ 
  size = 'medium', 
  style 
}) => {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemeManager();
  
  // VALOR ANIMADO SIMPLES
  const animatedValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  
  // Configurações de tamanho
  const sizes = {
    small: {
      width: 50,
      height: 26,
      thumbSize: 22,
      padding: 2,
      iconSize: 12,
    },
    medium: {
      width: 60,
      height: 32,
      thumbSize: 28,
      padding: 2,
      iconSize: 16,
    },
    large: {
      width: 70,
      height: 38,
      thumbSize: 34,
      padding: 2,
      iconSize: 20,
    },
  };

  const currentSize = sizes[size];

  // CORRIGIDO: Animação sincronizada com mudança de tema
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      tension: 300,
      friction: 8,
    }).start();
  }, [isDark, animatedValue]);

  const handlePress = () => {
    // CORRIGIDO: Log para debug + toggle imediato
    console.log('ThemeSwitch pressed, current isDark:', isDark);
    toggleTheme();
  };

  // Interpolações
  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, currentSize.width - currentSize.thumbSize - currentSize.padding * 2],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 206, 84, 0.8)', 'rgba(96, 125, 139, 0.8)'],
  });

  const thumbBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFD700', '#37474F'],
  });

  const sunOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 0.2],
  });

  const moonOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.4, 0.8],
  });

  const styles = StyleSheet.create({
    container: {
      width: currentSize.width,
      height: currentSize.height,
      borderRadius: currentSize.height / 2,
      justifyContent: 'center',
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    track: {
      width: '100%',
      height: '100%',
      borderRadius: currentSize.height / 2,
      position: 'relative',
      justifyContent: 'center',
      padding: currentSize.padding,
    },
    thumb: {
      position: 'absolute',
      width: currentSize.thumbSize,
      height: currentSize.thumbSize,
      borderRadius: currentSize.thumbSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      left: currentSize.padding,
    },
    backgroundIcon: {
      position: 'absolute',
      top: '50%',
      marginTop: -currentSize.iconSize / 2,
    },
    sunIcon: {
      left: currentSize.padding + 4,
    },
    moonIcon: {
      right: currentSize.padding + 4,
    },
  });

  // ADICIONADO: Log para debug do estado atual
  console.log('ThemeSwitch render - isDark:', isDark, 'theme.isDark:', theme.isDark);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor,
          },
        ]}
      >
        {/* Ícones de fundo */}
        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.sunIcon,
            {
              opacity: sunOpacity,
            },
          ]}
        >
          <Ionicons
            name="sunny"
            size={currentSize.iconSize}
            color="rgba(255, 255, 255, 0.8)"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.moonIcon,
            {
              opacity: moonOpacity,
            },
          ]}
        >
          <Ionicons
            name="moon"
            size={currentSize.iconSize}
            color="rgba(255, 255, 255, 0.8)"
          />
        </Animated.View>

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbBackgroundColor,
              transform: [{ translateX: thumbTranslateX }],
            },
          ]}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={currentSize.iconSize}
            color={isDark ? '#E3F2FD' : '#FFF8E1'}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};