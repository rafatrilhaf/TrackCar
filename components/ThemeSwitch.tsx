// components/ThemeSwitch.tsx - VERSÃO TOTALMENTE CORRIGIDA
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
  
  // CORRIGIDO: Valores animados separados para cada tipo de driver
  const slideAnimJS = useRef(new Animated.Value(isDark ? 1 : 0)).current; // Para JS driver
  const scaleAnimNative = useRef(new Animated.Value(1)).current; // Para Native driver
  const rotateAnimNative = useRef(new Animated.Value(0)).current; // Para Native driver
  
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

  // Anima a transição quando o tema muda
  useEffect(() => {
    // CORRIGIDO: Animação do slide usando APENAS JS driver
    Animated.spring(slideAnimJS, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false, // SEMPRE false para este valor
      tension: 300,
      friction: 8,
    }).start();

    // CORRIGIDO: Animação de rotação usando APENAS Native driver
    Animated.sequence([
      Animated.timing(rotateAnimNative, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true, // SEMPRE true para este valor
      }),
      Animated.timing(rotateAnimNative, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true, // SEMPRE true para este valor
      }),
    ]).start();
  }, [isDark]);

  const handlePress = () => {
    // CORRIGIDO: Animação de escala usando APENAS Native driver
    Animated.sequence([
      Animated.timing(scaleAnimNative, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true, // SEMPRE true para este valor
      }),
      Animated.timing(scaleAnimNative, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true, // SEMPRE true para este valor
      }),
    ]).start();

    toggleTheme();
  };

  // Interpolações usando os valores corretos
  const thumbTranslateX = slideAnimJS.interpolate({
    inputRange: [0, 1],
    outputRange: [0, currentSize.width - currentSize.thumbSize - currentSize.padding * 2],
  });

  const backgroundColor = slideAnimJS.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 206, 84, 0.8)', 'rgba(96, 125, 139, 0.8)'],
  });

  const thumbBackgroundColor = slideAnimJS.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFD700', '#37474F'],
  });

  const iconRotation = rotateAnimNative.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Interpolação para opacidade dos ícones de fundo
  const sunOpacity = slideAnimJS.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 0.2],
  });

  const moonOpacity = slideAnimJS.interpolate({
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
            backgroundColor, // JS driver
            transform: [{ scale: scaleAnimNative }], // Native driver
          },
        ]}
      >
        {/* Ícones de fundo */}
        <Animated.View
          style={[
            styles.backgroundIcon,
            styles.sunIcon,
            {
              opacity: sunOpacity, // JS driver
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
              opacity: moonOpacity, // JS driver
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
              backgroundColor: thumbBackgroundColor, // JS driver
              transform: [
                { translateX: thumbTranslateX }, // JS driver (NÃO pode usar native)
                { rotate: iconRotation }, // Native driver
              ],
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
