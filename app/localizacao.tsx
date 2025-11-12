// app/localizacao.tsx - VERSÃO RESPONSIVA COMPLETA
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { theme } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getUserCars, subscribeToCarStolenStatus, updateCarStolenStatus } from '../services/carService';
import { auth } from '../services/firebase';
import { GPSLocation, isUserAuthenticated, subscribeToCarLocation } from '../services/tkService';
import { Car } from '../types/car';
import { scaleFont, scaleHeight, scaleIcon, scaleModerate } from '../utils/responsive';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  lastUpdate: Date;
  isOnline: boolean;
}

// Função para converter coordenadas em endereço (geocoding reverso)
const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TrackCar-App/1.0'
        }
      }
    );
    
    if (!response.ok) throw new Error('Erro na API de geocoding');
    
    const data = await response.json();
    
    if (data && data.display_name) {
      return data.display_name;
    }
    
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

interface CarItemProps {
  car: Car;
  onSelect: (car: Car) => void;
  isSelected: boolean;
}

const CarItem: React.FC<CarItemProps> = ({ car, onSelect, isSelected }) => {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    carItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      minHeight: scaleHeight(70),
    },
    carInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    colorIndicator: {
      width: scaleModerate(24),
      height: scaleModerate(24),
      borderRadius: scaleModerate(12),
      borderWidth: 1,
    },
    carDetails: {
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    carName: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
    },
    carPlate: {
      fontSize: theme.fontSize.sm,
      marginTop: 2,
    },
    carYear: {
      fontSize: theme.fontSize.sm,
      marginTop: 2,
    },
    stolenIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    stolenIndicatorText: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.bold,
    },
  });
  
  return (
    <TouchableOpacity
      style={[
        styles.carItem, 
        { backgroundColor: colors.surface, borderColor: colors.border },
        isSelected && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
      ]}
      onPress={() => onSelect(car)}
    >
      <View style={styles.carInfo}>
        <View style={[styles.colorIndicator, { backgroundColor: car.colorHex, borderColor: colors.border }]} />
        <View style={styles.carDetails}>
          <Text style={[styles.carName, { color: colors.text }]} numberOfLines={1}>{car.brand} {car.model}</Text>
          <Text style={[styles.carPlate, { color: colors.textSecondary }]}>{car.licensePlate}</Text>
          <Text style={[styles.carYear, { color: colors.textSecondary }]}>{car.year}</Text>
          {car.isStolen && (
            <View style={styles.stolenIndicator}>
              <Ionicons name="warning" size={scaleIcon(12)} color={colors.error} />
              <Text style={[styles.stolenIndicatorText, { color: colors.error }]}>ROUBADO</Text>
            </View>
          )}
        </View>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={scaleIcon(24)} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
};

const CarStatusCard: React.FC<{
  car: Car;
  locationData: LocationData | null;
  isStolen: boolean;
  onToggleStolen: () => void;
  onOpenMaps: () => void;
}> = ({ car, locationData, isStolen, onToggleStolen, onOpenMaps }) => {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    statusCard: {
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    carStatusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.lg,
    },
    carInfoHeader: {
      flex: 1,
    },
    carTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
    },
    carPlate: {
      fontSize: theme.fontSize.md,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      gap: theme.spacing.xs,
      minHeight: scaleHeight(28),
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.bold,
    },
    locationSection: {
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    securitySection: {
      marginBottom: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    onlineIndicator: {
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 3,
      borderRadius: theme.borderRadius.sm,
    },
    onlineText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.medium,
    },
    addressText: {
      fontSize: theme.fontSize.md,
      marginBottom: theme.spacing.md,
      lineHeight: scaleFont(22),
    },
    coordsText: {
      fontSize: theme.fontSize.sm,
      fontFamily: 'monospace',
      marginBottom: theme.spacing.sm,
      opacity: 0.8,
    },
    lastUpdateText: {
      fontSize: theme.fontSize.sm,
      marginBottom: theme.spacing.md,
    },
    mapsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      minHeight: scaleHeight(48),
    },
    securityDescription: {
      fontSize: theme.fontSize.md,
      marginBottom: theme.spacing.md,
      lineHeight: scaleFont(22),
    },
    reportedDate: {
      fontSize: theme.fontSize.sm,
      marginBottom: theme.spacing.md,
      fontWeight: theme.fontWeight.medium,
    },
    securityButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      minHeight: scaleHeight(48),
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
    },
  });
  
  return (
    <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
      {/* Header do Carro */}
      <View style={styles.carStatusHeader}>
        <View style={styles.carInfoHeader}>
          <Text style={[styles.carTitle, { color: colors.text }]} numberOfLines={1}>{car.brand} {car.model}</Text>
          <Text style={[styles.carPlate, { color: colors.textSecondary }]}>{car.licensePlate}</Text>
        </View>
        
        {/* Badge de Status de Roubo */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: isStolen ? colors.error : colors.success }
        ]}>
          <Ionicons 
            name={isStolen ? "warning" : "shield-checkmark"} 
            size={scaleIcon(16)} 
            color="#FFFFFF" 
          />
          <Text style={styles.statusText}>
            {isStolen ? 'ROUBADO' : 'PROTEGIDO'}
          </Text>
        </View>
      </View>

      {/* Seção de Localização (se disponível) */}
      {locationData && (
        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={scaleIcon(20)} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Localização Atual</Text>
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: locationData.isOnline ? colors.success : colors.textSecondary }
            ]}>
              <Text style={styles.onlineText}>
                {locationData.isOnline ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
          </View>

          <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={3}>
            {locationData.address}
          </Text>

          <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
            Coordenadas: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
          </Text>

          <Text style={[styles.lastUpdateText, { color: colors.textSecondary }]}>
            Atualizado em: {locationData.lastUpdate.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>

          <TouchableOpacity
            style={[styles.mapsButton, { backgroundColor: colors.info }]}
            onPress={onOpenMaps}
          >
            <Ionicons name="map" size={scaleIcon(20)} color="#FFFFFF" />
            <Text style={styles.buttonText}>Abrir no Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Seção de Status de Roubo */}
      <View style={styles.securitySection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield" size={scaleIcon(20)} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Controle de Segurança</Text>
        </View>

        <Text style={[styles.securityDescription, { color: colors.textSecondary }]}>
          {isStolen 
            ? '⚠️ Este veículo foi reportado como ROUBADO. Sistema de alerta ativado.'
            : '🔒 Este veículo está sob proteção normal do sistema TrackCar.'
          }
        </Text>

        {isStolen && car.stolenReportedAt && (
          <Text style={[styles.reportedDate, { color: colors.error }]}>
            📅 Reportado como roubado em: {car.stolenReportedAt.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.securityButton,
            { backgroundColor: isStolen ? colors.success : colors.error }
          ]}
          onPress={onToggleStolen}
        >
          <Ionicons 
            name={isStolen ? "shield-checkmark" : "warning"} 
            size={scaleIcon(20)} 
            color="#FFFFFF" 
          />
          <Text style={styles.buttonText}>
            {isStolen ? 'Marcar como Encontrado' : 'Reportar Roubo'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function LocalizacaoScreen() {
  const { colors } = useTheme();
  const [userCars, setUserCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [unsubscribeLocation, setUnsubscribeLocation] = useState<(() => void) | null>(null);
  const [unsubscribeStolenStatus, setUnsubscribeStolenStatus] = useState<(() => void) | null>(null);

  useEffect(() => {
    loadUserCars();
  }, []);

  useEffect(() => {
    const cleanup = () => {
      if (unsubscribeLocation) {
        console.log('Limpando subscription de localização...');
        unsubscribeLocation();
        setUnsubscribeLocation(null);
      }
      if (unsubscribeStolenStatus) {
        console.log('Limpando subscription de status roubado...');
        unsubscribeStolenStatus();
        setUnsubscribeStolenStatus(null);
      }
    };

    cleanup();

    if (selectedCar?.id) {
      try {
        const locationUnsubscribe = subscribeToCarLocation(selectedCar.id, async (location) => {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.log('Usuário deslogado, parando processamento de localização');
            return;
          }

          setCurrentLocation(location);
          
          if (location) {
            try {
              const address = await getAddressFromCoordinates(location.latitude, location.longitude);
              
              if (auth.currentUser) {
                setLocationData({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  address,
                  lastUpdate: location.timestamp,
                  isOnline: true
                });
              }
            } catch (error) {
              console.error('Erro ao buscar endereço:', error);
              if (auth.currentUser) {
                setLocationData({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  address: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
                  lastUpdate: location.timestamp,
                  isOnline: true
                });
              }
            }
          } else {
            if (auth.currentUser) {
              setLocationData(null);
            }
          }
        });

        const stolenUnsubscribe = subscribeToCarStolenStatus(selectedCar.id, (isStolen, reportedAt) => {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.log('Usuário deslogado, parando processamento de status roubado');
            return;
          }

          setSelectedCar(prev => prev ? {
            ...prev,
            isStolen,
            stolenReportedAt: reportedAt
          } : null);
        });

        setUnsubscribeLocation(() => locationUnsubscribe);
        setUnsubscribeStolenStatus(() => stolenUnsubscribe);
      } catch (error) {
        console.error('Erro ao configurar subscriptions:', error);
      }
    }

    return cleanup;
  }, [selectedCar?.id]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log('Auth state changed: user logged out, cleaning up subscriptions');
        if (unsubscribeLocation) {
          unsubscribeLocation();
          setUnsubscribeLocation(null);
        }
        if (unsubscribeStolenStatus) {
          unsubscribeStolenStatus();
          setUnsubscribeStolenStatus(null);
        }
        setCurrentLocation(null);
        setLocationData(null);
        setSelectedCar(null);
        setUserCars([]);
      }
    });

    return unsubscribeAuth;
  }, [unsubscribeLocation, unsubscribeStolenStatus]);

  const loadUserCars = async () => {
    setIsLoading(true);
    try {
      if (!isUserAuthenticated()) {
        console.log('Usuário não autenticado, cancelando carregamento de carros');
        return;
      }

      const cars = await getUserCars();
      setUserCars(cars);
      
      if (cars.length > 0 && !selectedCar) {
        setSelectedCar(cars[0]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar carros:', error);
      
      if (isUserAuthenticated()) {
        Alert.alert('Erro', 'Não foi possível carregar os veículos: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCarSelect = (car: Car) => {
    setSelectedCar(car);
    setShowCarSelector(false);
    setLocationData(null);
  };

  const handleToggleStolen = async () => {
    if (!selectedCar?.id) return;

    if (!isUserAuthenticated()) {
      Alert.alert('Erro', 'Você precisa estar logado para alterar o status de segurança');
      return;
    }

    const currentStatus = selectedCar.isStolen || false;
    const newStatus = !currentStatus;

    const alertTitle = newStatus ? '🚨 Reportar Roubo' : '✅ Confirmar Recuperação';
    const alertMessage = newStatus 
      ? 'Confirma que este veículo foi ROUBADO?\n\n• Alertas de segurança serão ativados\n• Outros usuários serão notificados\n• Autoridades poderão ser contatadas'
      : 'Confirma que este veículo foi ENCONTRADO/RECUPERADO?\n\n• Alertas de roubo serão desativados\n• Status voltará ao normal';

    Alert.alert(
      alertTitle,
      alertMessage,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: newStatus ? 'Sim, foi Roubado' : 'Sim, foi Recuperado',
          style: newStatus ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (!isUserAuthenticated()) {
                Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
                return;
              }

              await updateCarStolenStatus(selectedCar.id!, newStatus);
              
              Alert.alert(
                newStatus ? '🚨 Roubo Reportado' : '✅ Veículo Recuperado',
                `${selectedCar.brand} ${selectedCar.model} foi marcado como ${newStatus ? 'ROUBADO' : 'RECUPERADO'} com sucesso!\n\n${
                  newStatus 
                    ? 'Sistema de alertas ativado. Mantenha-se seguro!' 
                    : 'Que ótima notícia! Status de segurança normalizado.'
                }`
              );
            } catch (error: any) {
              console.error('Erro ao atualizar status de roubo:', error);
              Alert.alert('❌ Erro', 'Não foi possível atualizar o status de segurança: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleOpenMaps = () => {
    if (!locationData) return;

    const url = `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o Google Maps. Verifique se o aplicativo está instalado.');
      }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserCars();
    } catch (error) {
      console.error('Erro no refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    headerTitle: {
      fontSize: scaleFont(24),
      fontWeight: theme.fontWeight.bold,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: theme.fontSize.md,
      lineHeight: scaleFont(22),
    },
    carSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      minHeight: scaleHeight(60),
    },
    carSelectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    carSelectorText: {
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    carSelectorTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
    },
    carSelectorPlate: {
      fontSize: theme.fontSize.sm,
      marginTop: 2,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: theme.fontSize.md,
      textAlign: 'center',
      lineHeight: scaleFont(22),
    },
    noLocationCard: {
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    noLocationTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    noLocationText: {
      fontSize: theme.fontSize.md,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      lineHeight: scaleFont(20),
    },
    noLocationSubtext: {
      fontSize: theme.fontSize.sm,
      textAlign: 'center',
      lineHeight: scaleFont(18),
    },
    loadingContainer: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      fontSize: theme.fontSize.md,
      marginTop: theme.spacing.md,
    },
    infoSection: {
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    infoTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      marginBottom: theme.spacing.md,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    infoText: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      marginLeft: theme.spacing.sm,
      lineHeight: scaleFont(20),
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
    },
    carList: {
      padding: theme.spacing.md,
    },
    emptyModalState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyModalText: {
      fontSize: theme.fontSize.md,
    },
  });

  if (!isUserAuthenticated()) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Localização" showBackButton />
        <View style={styles.emptyState}>
          <Ionicons name="log-in" size={scaleIcon(80)} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Acesso Negado</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Você precisa estar logado para acessar o sistema de rastreamento
          </Text>
        </View>
      </View>
    );
  }

  if (userCars.length === 0 && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Localização" showBackButton />
        <View style={styles.emptyState}>
          <Ionicons name="car-sport" size={scaleIcon(80)} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum Veículo{'\n'}Cadastrado</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Para utilizar o sistema de rastreamento, primeiro cadastre um veículo na tela "Meus Carros"
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Localização & Segurança" showBackButton />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Rastreamento{'\n'}Veicular</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Monitore localização em tempo real e gerencie a segurança do seu veículo
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.carSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowCarSelector(true)}
        >
          <View style={styles.carSelectorContent}>
            <Ionicons name="car" size={scaleIcon(24)} color={colors.primary} />
            <View style={styles.carSelectorText}>
              <Text style={[styles.carSelectorTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : 'Escolher Veículo'}
              </Text>
              {selectedCar && (
                <Text style={[styles.carSelectorPlate, { color: colors.textSecondary }]}>{selectedCar.licensePlate}</Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={scaleIcon(20)} color={colors.textSecondary} />
        </TouchableOpacity>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando dados do veículo...</Text>
          </View>
        ) : (
          selectedCar && (
            <CarStatusCard
              car={selectedCar}
              locationData={locationData}
              isStolen={selectedCar.isStolen || false}
              onToggleStolen={handleToggleStolen}
              onOpenMaps={handleOpenMaps}
            />
          )
        )}

        {selectedCar && !locationData && !isLoading && (
          <View style={[styles.noLocationCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="location-outline" size={scaleIcon(48)} color={colors.textSecondary} />
            <Text style={[styles.noLocationTitle, { color: colors.text }]}>GPS Indisponível</Text>
            <Text style={[styles.noLocationText, { color: colors.textSecondary }]}>
              Nenhum sinal GPS foi recebido para este veículo ainda.
            </Text>
            <Text style={[styles.noLocationSubtext, { color: colors.textSecondary }]}>
              Verifique se o rastreador está instalado, ligado e com conexão ativa.
            </Text>
          </View>
        )}

        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>💡 Como Funciona</Text>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={scaleIcon(16)} color={colors.info} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: theme.fontWeight.medium }}>Rastreamento:</Text> Posição atualizada automaticamente quando o veículo se movimenta
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={scaleIcon(16)} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: theme.fontWeight.medium }}>Segurança:</Text> Status de roubo pode ser alterado a qualquer momento, mesmo sem GPS
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="notifications" size={scaleIcon(16)} color={colors.warning} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: theme.fontWeight.medium }}>Alertas:</Text> Veículos roubados geram notificações especiais e podem ser vistos por outros usuários
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="refresh" size={scaleIcon(16)} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: theme.fontWeight.medium }}>Atualização:</Text> Puxe para baixo para atualizar manualmente as informações
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Seleção de Carro */}
      <Modal
        visible={showCarSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCarSelector(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Escolher Veículo</Text>
              <TouchableOpacity onPress={() => setShowCarSelector(false)}>
                <Ionicons name="close" size={scaleIcon(24)} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {userCars.length > 0 ? (
              <FlatList
                data={userCars}
                keyExtractor={(item) => item.id!}
                renderItem={({ item }) => (
                  <CarItem
                    car={item}
                    onSelect={handleCarSelect}
                    isSelected={selectedCar?.id === item.id}
                  />
                )}
                style={styles.carList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyModalState}>
                <Text style={[styles.emptyModalText, { color: colors.textSecondary }]}>
                  Nenhum veículo encontrado
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
