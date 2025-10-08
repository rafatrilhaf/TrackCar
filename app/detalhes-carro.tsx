// app/detalhes-carro.tsx - COM HEADER GLOBAL
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { useTheme } from '../hooks/useTheme';
import { deleteCar, getUserCars } from '../services/carService';
import { Car, FUEL_TYPES } from '../types/car';

export default function DetalhesCarroScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarDetails();
  }, [id]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      const userCars = await getUserCars();
      const foundCar = userCars.find(c => c.id === id);
      
      if (foundCar) {
        setCar(foundCar);
      } else {
        Alert.alert('Erro', 'Veículo não encontrado', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar detalhes do carro:', error);
      Alert.alert('Erro', 'Erro ao carregar detalhes do veículo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!car) return;

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
                Alert.alert('Sucesso', 'Veículo removido com sucesso', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao remover veículo');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (car?.id) {
      router.push(`/editar-carro?id=${car.id}` as any);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFuelLabel = (fuelValue?: string) => {
    if (!fuelValue) return 'Não informado';
    return FUEL_TYPES.find(f => f.value === fuelValue)?.label || fuelValue;
  };

  const renderOptionsButton = () => (
    <TouchableOpacity
      style={styles.headerOptionsButton}
      onPress={() => {
        Alert.alert(
          'Opções do Veículo',
          '',
          [
            {
              text: 'Editar',
              onPress: handleEdit,
            },
            {
              text: 'Remover',
              style: 'destructive',
              onPress: handleDelete,
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerOptionsButton: {
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
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
    scrollContainer: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    photoSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    carPhoto: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
    },
    photoPlaceholder: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
      marginBottom: theme.spacing.md,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoLabel: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      fontWeight: theme.fontWeight.medium,
      flex: 2,
      textAlign: 'right',
    },
    colorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 2,
    },
    colorPreview: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginLeft: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    descriptionText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      lineHeight: 22,
      marginTop: theme.spacing.sm,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    editButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    deleteButton: {
      flex: 1,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: theme.colors.error,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      marginLeft: theme.spacing.sm,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Detalhes" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.container}>
        <Header title="Veículo não encontrado" showBackButton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Global */}
      <Header 
        title={`${car.brand} ${car.model}`}
        showBackButton
        rightComponent={renderOptionsButton()}
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Foto do Veículo */}
        <View style={styles.photoSection}>
          {car.photoURL ? (
            <Image source={{ uri: car.photoURL }} style={styles.carPhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="car" size={80} color={theme.colors.primary} />
            </View>
          )}
        </View>

        {/* Informações Essenciais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Essenciais</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Marca</Text>
            <Text style={styles.infoValue}>{car.brand}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Modelo</Text>
            <Text style={styles.infoValue}>{car.model}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ano</Text>
            <Text style={styles.infoValue}>{car.year}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placa</Text>
            <Text style={styles.infoValue}>{car.licensePlate}</Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Cor</Text>
            <View style={styles.colorContainer}>
              <Text style={styles.infoValue}>{car.color}</Text>
              <View style={[styles.colorPreview, { backgroundColor: car.colorHex }]} />
            </View>
          </View>
        </View>

        {/* Informações Gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Motorização</Text>
            <Text style={styles.infoValue}>{car.engine || 'Não informado'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Combustível</Text>
            <Text style={styles.infoValue}>{getFuelLabel(car.fuel)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RENAVAM</Text>
            <Text style={styles.infoValue}>{car.renavam || 'Não informado'}</Text>
          </View>

          <View style={[styles.infoRow, car.description ? {} : styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Chassi</Text>
            <Text style={styles.infoValue}>{car.chassi || 'Não informado'}</Text>
          </View>

          {car.description && (
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Observações</Text>
              <Text style={styles.descriptionText}>{car.description}</Text>
            </View>
          )}
        </View>

        {/* Informações do Sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Sistema</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cadastrado em</Text>
            <Text style={styles.infoValue}>{formatDate(car.createdAt)}</Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Última atualização</Text>
            <Text style={styles.infoValue}>
              {car.updatedAt ? formatDate(car.updatedAt) : formatDate(car.createdAt)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botões de Ação */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}