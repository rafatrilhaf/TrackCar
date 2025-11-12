// utils/responsive.ts
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 - seu dispositivo de desenvolvimento)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Calcular fatores de escala
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Normaliza tamanhos horizontais (largura, paddingHorizontal, marginHorizontal, etc.)
 * Usa a largura da tela como base
 */
export function scaleWidth(size: number): number {
  const newSize = size * widthScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Normaliza tamanhos verticais (altura, paddingVertical, marginVertical, etc.)
 * Usa a altura da tela como base
 */
export function scaleHeight(size: number): number {
  const newSize = size * heightScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Normaliza fontes e elementos que devem escalar de forma moderada
 * Usa a menor escala entre largura e altura para manter proporções
 * Aplica um fator moderador para evitar mudanças muito drásticas
 */
export function scaleFont(size: number, factor: number = 0.5): number {
  const scale = Math.min(widthScale, heightScale);
  const newSize = size + (size * (scale - 1)) * factor;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Android precisa de ajuste adicional devido às diferenças de renderização
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

/**
 * Normaliza espaçamentos que devem ser consistentes
 * Usa escala moderada baseada na largura
 */
export function scaleSpacing(size: number): number {
  const newSize = size * widthScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Retorna informações sobre o dispositivo atual
 */
export const deviceInfo = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  widthScale,
  heightScale,
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  isShortDevice: SCREEN_HEIGHT < 700,
  platform: Platform.OS,
};

/**
 * Aplica escala apenas se o dispositivo for menor que a base
 * Útil para evitar aumentar elementos em telas maiores
 */
export function scaleModerate(size: number, factor: number = 0.5): number {
  const scale = Math.min(widthScale, heightScale);
  if (scale >= 1) return size;
  
  const newSize = size + (size * (scale - 1)) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Helper para breakpoints responsivos
 */
export function getBreakpoint() {
  if (SCREEN_WIDTH < 360) return 'xs';
  if (SCREEN_WIDTH < 390) return 'sm';
  if (SCREEN_WIDTH < 428) return 'md';
  return 'lg';
}

/**
 * Escala específica para ícones
 */
export function scaleIcon(size: number): number {
  const scale = Math.min(widthScale, heightScale);
  const newSize = size * Math.max(0.85, scale); // Nunca menor que 85% do original
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}
