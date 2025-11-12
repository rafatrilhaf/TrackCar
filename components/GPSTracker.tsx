// components/GPSTracker.tsx - VERSÃO RESPONSIVA COMPLETA
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { theme } from '../constants/theme';
import {
  generateMapsURL,
  GPSLocation,
  isCarMoving,
  subscribeToCarLocation,
} from '../services/tkService';
import { Car } from '../types/car';
import { scaleFont, scaleHeight, scaleIcon } from '../utils/responsive';

const colors = Colors.light;

interface Props {
  car: Car;
  onLocationUpdate?: (location: GPSLocation | null) => void;
}

export default function GPSTracker({ car, onLocationUpdate }: Props) {
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [lastLocations, setLastLocations] = useState<GPSLocation[]>([]);

  useEffect(() => {
    if (!car.id) return;

    const unsubscribe = subscribeToCarLocation(car.id, (location) => {
      setCurrentLocation(location);
      onLocationUpdate?.(location);

      if (location) {
        setLastLocations(prev => {
          const updated = [location, ...prev.slice(0, 9)];
          const moving = isCarMoving(updated);
          setIsMoving(moving);
          return updated;
        });
      }
    });

    return unsubscribe;
  }, [car.id, onLocationUpdate]);

  const handleOpenInMaps = () => {
    if (!currentLocation) {
      Alert.alert('Erro', 'Localização não disponível');
      return;
    }

    const url = generateMapsURL(currentLocation.latitude, currentLocation.longitude);
    Linking.openURL(url);
  };

  const getLocationAge = () => {
    if (!currentLocation) return 'N/A';
    
    const now = new Date();
    const diff = now.getTime() - currentLocation.timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes === 1) return '1 minuto atrás';
    if (minutes < 60) return `${minutes} minutos atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hora atrás';
    return `${hours} horas atrás`;
  };

  const formatCoordinates = (lat: number, lon: number) => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.lg,
      minHeight: scaleHeight(24),
      justifyContent: 'center',
    },
    statusBadgeText: {
      color: '#fff',
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.bold,
    },
    locationInfo: {
      marginBottom: theme.spacing.lg,
    },
    coordinatesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    coordinates: {
      fontSize: theme.fontSize.md,
      fontFamily: 'monospace',
      marginLeft: theme.spacing.sm,
      color: colors.text,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    detail: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      fontSize: theme.fontSize.sm,
      color: colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    mapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.info,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      minHeight: scaleHeight(48),
    },
    mapButtonText: {
      color: '#fff',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      marginLeft: theme.spacing.sm,
    },
    noLocationContainer: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    noLocationText: {
      fontSize: theme.fontSize.md,
      color: colors.textSecondary,
      marginTop: theme.spacing.md,
      textAlign: 'center',
      lineHeight: scaleFont(20),
    },
    noLocationSubtext: {
      fontSize: theme.fontSize.sm,
      color: colors.textSecondary,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
      lineHeight: scaleFont(18),
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rastreamento GPS</Text>
        <View style={[styles.statusBadge, { backgroundColor: isMoving ? colors.success : colors.textSecondary }]}>
          <Text style={styles.statusBadgeText}>
            {isMoving ? 'Em movimento' : 'Parado'}
          </Text>
        </View>
      </View>

      {currentLocation ? (
        <>
          <View style={styles.locationInfo}>
            <View style={styles.coordinatesRow}>
              <Ionicons name="location" size={scaleIcon(20)} color={colors.info} />
              <Text style={styles.coordinates}>
                {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
              </Text>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detail}>
                <Ionicons name="time" size={scaleIcon(16)} color={colors.textSecondary} />
                <Text style={styles.detailText}>{getLocationAge()}</Text>
              </View>
              
              {currentLocation.speed !== undefined && (
                <View style={styles.detail}>
                  <Ionicons name="speedometer" size={scaleIcon(16)} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{currentLocation.speed.toFixed(0)} km/h</Text>
                </View>
              )}
              
              {currentLocation.accuracy !== undefined && (
                <View style={styles.detail}>
                  <Ionicons name="radio" size={scaleIcon(16)} color={colors.textSecondary} />
                  <Text style={styles.detailText}>±{currentLocation.accuracy.toFixed(0)}m</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.mapButton} onPress={handleOpenInMaps}>
            <Ionicons name="map" size={scaleIcon(20)} color="#fff" />
            <Text style={styles.mapButtonText}>Ver no Mapa</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={scaleIcon(48)} color={colors.textSecondary} />
          <Text style={styles.noLocationText}>
            Aguardando sinal GPS...
          </Text>
          <Text style={styles.noLocationSubtext}>
            Verifique se o dispositivo está ligado e com sinal GSM.
          </Text>
        </View>
      )}
    </View>
  );
}
