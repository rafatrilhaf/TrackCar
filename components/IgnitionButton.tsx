// components/IgnitionButton.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface IgnitionButtonProps {
  carId: string;
  ignitionState: 'on' | 'off' | 'unknown';
  onToggle: (carId: string, newState: 'on' | 'off') => Promise<void>;
  disabled?: boolean;
}

export const IgnitionButton: React.FC<IgnitionButtonProps> = ({
  carId,
  ignitionState,
  onToggle,
  disabled = false,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading || disabled) return;
    
    try {
      setLoading(true);
      const newState = ignitionState === 'on' ? 'off' : 'on';
      await onToggle(carId, newState);
    } catch (error) {
      console.error('Erro ao alterar ignição:', error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = () => {
    switch (ignitionState) {
      case 'on':
        return {
          backgroundColor: theme.colors.success,
          borderColor: theme.colors.success,
        };
      case 'off':
        return {
          backgroundColor: theme.colors.error,
          borderColor: theme.colors.error,
        };
      default:
        return {
          backgroundColor: theme.colors.textSecondary,
          borderColor: theme.colors.textSecondary,
        };
    }
  };

  const getIconName = () => {
    switch (ignitionState) {
      case 'on':
        return 'power' as const;
      case 'off':
        return 'power-outline' as const;
      default:
        return 'help-outline' as const;
    }
  };

  const getStatusText = () => {
    switch (ignitionState) {
      case 'on':
        return 'Ligado';
      case 'off':
        return 'Desligado';
      default:
        return 'Desconhecido';
    }
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      minWidth: 80,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      minWidth: 70,
      minHeight: 32,
      ...getButtonStyle(),
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.medium,
      marginLeft: theme.spacing.xs,
    },
    statusText: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          (disabled || loading) && styles.buttonDisabled,
        ]}
        onPress={handleToggle}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name={getIconName()}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.buttonText}>
              {ignitionState === 'on' ? 'ON' : 'OFF'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.statusText}>{getStatusText()}</Text>
    </View>
  );
};
