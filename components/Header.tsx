// components/Header.tsx - VERSÃO RESPONSIVA COMPLETA
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { scaleFont, scaleHeight, scaleIcon } from '../utils/responsive';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  backgroundColor,
}) => {
  const theme = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: scaleHeight(Platform.OS === 'ios' ? 48 : 40),
      paddingBottom: theme.spacing.lg,
      backgroundColor: backgroundColor || theme.colors.primary,
      borderBottomWidth: 0,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3.84,
      minHeight: scaleHeight(88),
    },
    leftSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
    },
    centerSection: {
      flex: 2,
      alignItems: 'center',
    },
    title: {
      fontSize: scaleFont(18),
      fontWeight: theme.fontWeight.bold,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    rightSection: {
      flex: 1,
      alignItems: 'flex-end',
    },
    spacer: {
      width: scaleIcon(40),
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={scaleIcon(24)} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {rightComponent || <View style={styles.spacer} />}
      </View>
    </View>
  );
};
