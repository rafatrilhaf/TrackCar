// constants/theme.ts
export const theme = {
  colors: {
    // Cores principais da logo
    primary: '#F57C00', // Laranja da logo
    secondary: '#000000', // Preto
    
    // Cores do sistema (modo claro)
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    
    // Estados
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    
    // Transparências
    overlay: 'rgba(0, 0, 0, 0.5)',
    primaryLight: 'rgba(245, 124, 0, 0.1)',
    
    // Cores específicas do app
    inputBackground: '#F8F8F8',
    inputBorder: '#DDDDDD',
    buttonDisabled: '#CCCCCC',
    textDisabled: '#999999',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    full: 999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    header: 32,
  },
  
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export type Theme = typeof theme;
