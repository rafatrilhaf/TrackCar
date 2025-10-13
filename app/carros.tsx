// app/carros.tsx - COM HEADER GLOBAL, DESIGN ATUALIZADO E BOTÃO DE IGNIÇÃO
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { IgnitionButton } from '../components/IgnitionButton';
import { useTheme } from '../hooks/useTheme';
import { deleteCar, getUserCars, toggleCarIgnition } from '../services/carService';
import { Car } from '../types/car';

export default function CarrosScreen() {
  const theme = useTheme();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carrega os carros quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadCars();
    }, [])
  );

  const loadCars = async () => {
    try {
      setLoading(true);
      const userCars = await getUserCars();
      setCars(userCars);
    } catch (error: any) {
      console.error('Erro ao carregar carros:', error);
      Alert.alert('Erro', 'Erro ao carregar seus veículos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCars();
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteCar = (car: Car) => {
    Alert.alert(
      'Remover Veículo',
      `Tem certeza que deseja remover o ${car.brand} ${car.model}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              if (car.id) {
                await deleteCar(car.id, car.photoURL);
                await loadCars(); // Recarrega a lista
                Alert.alert('Sucesso', 'Veículo removido com sucesso');
              }
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao remover veículo');
            }
          },
        },
      ]
    );
  };

  // NOVA FUNÇÃO: Lidar com ignição
  const handleIgnitionToggle = async (carId: string, newState: 'on' | 'off') => {
    try {
      await toggleCarIgnition(carId, newState);
      // Recarrega a lista para mostrar o estado atualizado
      await loadCars();
      
      const actionText = newState === 'on' ? 'ligada' : 'desligada';
      Alert.alert('Sucesso', `Ignição ${actionText} com sucesso!`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao alterar ignição');
    }
  };

  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.headerAddButton}
      onPress={() => router.push('/cadastrar-carro')}
      activeOpacity={0.7}
    >
      <Ionicons name="add" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  const renderCarCard = ({ item: car }: { item: Car }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => router.push(`/detalhes-carro?id=${car.id}` as any)}
      activeOpacity={0.7}
    >
      {/* Foto do Carro */}
      <View style={styles.carImageContainer}>
        {car.photoURL ? (
          <Image source={{ uri: car.photoURL }} style={styles.carImage} />
        ) : (
          <View style={styles.carImagePlaceholder}>
            <Ionicons name="car" size={40} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Informações do Carro */}
      <View style={styles.carInfo}>
        <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
        <Text style={styles.carSubtitle}>Ano {car.year}</Text>
        <Text style={styles.carPlate}>{car.licensePlate}</Text>
        
        {/* Preview da Cor */}
        <View style={styles.carColorContainer}>
          <View style={[styles.carColorPreview, { backgroundColor: car.colorHex }]} />
          <Text style={styles.carColorText}>{car.color}</Text>
        </View>
      </View>

      {/* NOVA SEÇÃO: Controles do Carro */}
      <View style={styles.carControls}>
        {/* Botão de Ignição */}
        <IgnitionButton
          carId={car.id!}
          ignitionState={car.ignitionState || 'unknown'}
          onToggle={handleIgnitionToggle}
        />

        {/* Botão de Opções */}
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert(
              'Opções do Veículo',
              `${car.brand} ${car.model} - ${car.year}`,
              [
                {
                  text: 'Ver Detalhes',
                  onPress: () => router.push(`/detalhes-carro?id=${car.id}` as any),
                },
                {
                  text: 'Editar',
                  onPress: () => router.push(`/editar-carro?id=${car.id}` as any),
                },
                {
                  text: 'Remover',
                  style: 'destructive',
                  onPress: () => handleDeleteCar(car),
                },
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="car" size={80} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum veículo cadastrado</Text>
      <Text style={styles.emptySubtitle}>
        Cadastre seu primeiro veículo para começar a monitorá-lo
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/cadastrar-carro')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Cadastrar Veículo</Text>
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerAddButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.full,
      padding: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
    listContainer: {
      padding: theme.spacing.lg,
    },
    carCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    carImageContainer: {
      marginRight: theme.spacing.lg,
    },
    carImage: {
      width: 80,
      height: 60,
      borderRadius: theme.borderRadius.md,
    },
    carImagePlaceholder: {
      width: 80,
      height: 60,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    carInfo: {
      flex: 1,
      justifyContent: 'space-between',
    },
    carTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    carSubtitle: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    carPlate: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.bold,
      marginBottom: theme.spacing.xs,
    },
    carColorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    carColorPreview: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    carColorText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    // NOVOS ESTILOS: Controles do carro
    carControls: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: theme.spacing.sm,
      minWidth: 90,
    },
    optionsButton: {
      padding: theme.spacing.sm,
      justifyContent: 'center',
      marginTop: theme.spacing.sm,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xxl,
    },
    emptyIconContainer: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.full,
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.xxl,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      elevation: 3,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      marginLeft: theme.spacing.sm,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Meus Carros" 
          showBackButton 
          onBackPress={() => router.push('/home')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando seus veículos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Global */}
      <Header 
        title="Meus Carros" 
        showBackButton 
        onBackPress={() => router.push('/home')}
        rightComponent={renderAddButton()}
      />

      {/* Lista de Carros */}
      <FlatList
        data={cars}
        renderItem={renderCarCard}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={cars.length === 0 ? { flex: 1 } : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}
