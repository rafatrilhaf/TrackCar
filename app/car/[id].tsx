// app/car/[id].tsx - Tela de detalhes do carro com controles de ignição e GPS
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import GPSTracker from '../../components/GPSTracker';
import IgnitionControl from '../../components/IgnitionControl';
import { getUserCars } from '../../services/carService';
import { GPSLocation } from '../../services/TrackingService';
import { Car } from '../../types/car';

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [ignitionState, setIgnitionState] = useState<'on' | 'off' | 'unknown'>('unknown');

  useEffect(() => {
    loadCarDetails();
  }, [id]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      const cars = await getUserCars();
      const foundCar = cars.find(c => c.id === id);
      
      if (foundCar) {
        setCar(foundCar);
        setIgnitionState(foundCar.ignitionState || 'unknown');
      } else {
        Alert.alert('Erro', 'Carro não encontrado');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar dados do carro');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCarDetails();
    setRefreshing(false);
  };

  const handleLocationUpdate = (location: GPSLocation | null) => {
    setCurrentLocation(location);
  };

  const handleIgnitionStateChange = (newState: 'on' | 'off' | 'unknown') => {
    setIgnitionState(newState);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.centerContainer}>
        <Text>Carro não encontrado</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: `${car.brand} ${car.model}`,
          headerStyle: { backgroundColor: car.colorHex || '#2196F3' },
          headerTintColor: '#fff',
        }}
      />
      
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Informações do Carro */}
        <View style={styles.carInfoCard}>
          <View style={styles.carHeader}>
            <View style={[styles.colorBadge, { backgroundColor: car.colorHex }]} />
            <View>
              <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
              <Text style={styles.carSubtitle}>{car.year} • {car.licensePlate}</Text>
            </View>
          </View>
          
          {car.description && (
            <Text style={styles.carDescription}>{car.description}</Text>
          )}
          
          <View style={styles.carSpecs}>
            {car.engine && (
              <View style={styles.spec}>
                <Ionicons name="speedometer-outline" size={16} color="#666" />
                <Text style={styles.specText}>{car.engine}</Text>
              </View>
            )}
            {car.fuel && (
              <View style={styles.spec}>
                <Ionicons name="car-outline" size={16} color="#666" />
                <Text style={styles.specText}>{car.fuel}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Status Geral */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status do Veículo</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Ionicons 
                name={ignitionState === 'on' ? 'car-sport' : 'car-sport-outline'} 
                size={24} 
                color={ignitionState === 'on' ? '#4CAF50' : '#F44336'} 
              />
              <Text style={styles.statusLabel}>Ignição</Text>
              <Text style={styles.statusValue}>
                {ignitionState === 'on' ? 'Ligada' : ignitionState === 'off' ? 'Desligada' : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons 
                name={currentLocation ? 'location' : 'location-outline'} 
                size={24} 
                color={currentLocation ? '#2196F3' : '#ccc'} 
              />
              <Text style={styles.statusLabel}>GPS</Text>
              <Text style={styles.statusValue}>
                {currentLocation ? 'Ativo' : 'Sem sinal'}
              </Text>
            </View>
          </View>
        </View>

        {/* Controle de Ignição */}
        <IgnitionControl 
          car={car} 
          onStateChange={handleIgnitionStateChange}
        />

        {/* Rastreamento GPS */}
        <GPSTracker 
          car={car} 
          onLocationUpdate={handleLocationUpdate}
        />

        {/* Últimas Atividades */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Última Atividade</Text>
          
          {car.lastIgnitionUpdate && (
            <View style={styles.activityItem}>
              <Ionicons name="car-sport" size={20} color="#4CAF50" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Ignição alterada</Text>
                <Text style={styles.activityTime}>
                  {car.lastIgnitionUpdate.toLocaleString()}
                </Text>
              </View>
            </View>
          )}
          
          {currentLocation && (
            <View style={styles.activityItem}>
              <Ionicons name="location" size={20} color="#2196F3" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Localização atualizada</Text>
                <Text style={styles.activityTime}>
                  {currentLocation.timestamp.toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carInfoCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  carTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  carSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  carDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  carSpecs: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 20,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  activityContent: {
    marginLeft: 15,
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
