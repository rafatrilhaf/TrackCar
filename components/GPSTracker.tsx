// components/GPSTracker.tsx - Componente para rastreamento GPS
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
import {
    generateMapsURL,
    GPSLocation,
    isCarMoving,
    subscribeToCarLocation,
} from '../services/TrackingService';
import { Car } from '../types/car';

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

    // Subscreve para atualizações de localização em tempo real
    const unsubscribe = subscribeToCarLocation(car.id, (location) => {
      setCurrentLocation(location);
      onLocationUpdate?.(location);

      if (location) {
        // Atualiza histórico de localizações
        setLastLocations(prev => {
          const updated = [location, ...prev.slice(0, 9)]; // Mantém últimas 10
          
          // Verifica se está em movimento
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rastreamento GPS</Text>
        <View style={[styles.statusBadge, { backgroundColor: isMoving ? '#4CAF50' : '#757575' }]}>
          <Text style={styles.statusBadgeText}>
            {isMoving ? 'Em movimento' : 'Parado'}
          </Text>
        </View>
      </View>

      {currentLocation ? (
        <>
          <View style={styles.locationInfo}>
            <View style={styles.coordinatesRow}>
              <Ionicons name="location" size={20} color="#2196F3" />
              <Text style={styles.coordinates}>
                {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
              </Text>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detail}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.detailText}>{getLocationAge()}</Text>
              </View>
              
              {currentLocation.speed !== undefined && (
                <View style={styles.detail}>
                  <Ionicons name="speedometer" size={16} color="#666" />
                  <Text style={styles.detailText}>{currentLocation.speed.toFixed(0)} km/h</Text>
                </View>
              )}
              
              {currentLocation.accuracy !== undefined && (
                <View style={styles.detail}>
                  <Ionicons name="radio" size={16} color="#666" />
                  <Text style={styles.detailText}>±{currentLocation.accuracy.toFixed(0)}m</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.mapButton} onPress={handleOpenInMaps}>
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.mapButtonText}>Ver no Mapa</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={48} color="#ccc" />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 10,
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
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationInfo: {
    marginBottom: 20,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 16,
    fontFamily: 'monospace',
    marginLeft: 8,
    color: '#333',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noLocationContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noLocationText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  noLocationSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});
