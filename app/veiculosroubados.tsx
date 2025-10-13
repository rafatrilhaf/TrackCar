import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { theme } from '../constants/theme';
import { useStolenVehicles } from '../hooks/useStolenVehicle';
import { useTheme } from '../hooks/useTheme';
import { getCurrentLocation } from '../services/stolenVehicleService';
import { StolenVehicle } from '../types/stolenVehicle';

const StolenVehicleCard: React.FC<{
  vehicle: StolenVehicle;
  onReportSighting: (vehicle: StolenVehicle) => void;
}> = ({ vehicle, onReportSighting }) => {
  const { colors } = useTheme();
  
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    return 'Agora mesmo';
  };

  const handleContactOwner = () => {
    if (vehicle.ownerPhone) {
      const phoneNumber = vehicle.ownerPhone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=Olá! Vi seu veículo ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) na lista de veículos roubados do TrackCar.`;
      
      Linking.canOpenURL(whatsappUrl).then(supported => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('Erro', 'WhatsApp não está instalado');
        }
      });
    }
  };

  return (
    <View style={[styles.vehicleCard, { backgroundColor: colors.surface }]}>
      {/* Header do Post */}
      <View style={styles.cardHeader}>
        <View style={styles.ownerInfo}>
          {vehicle.ownerPhotoURL ? (
            <Image source={{ uri: vehicle.ownerPhotoURL }} style={styles.ownerPhoto} />
          ) : (
            <View style={[styles.ownerPhotoPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.ownerDetails}>
            <Text style={[styles.ownerName, { color: colors.text }]}>{vehicle.ownerName}</Text>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>
              Roubado há {getTimeAgo(vehicle.stolenAt)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.urgencyBadge, { backgroundColor: colors.error }]}>
          <Ionicons name="warning" size={14} color="#FFFFFF" />
          <Text style={styles.urgencyText}>ROUBADO</Text>
        </View>
      </View>

      {/* Imagem do Veículo */}
      {vehicle.photoURL && (
        <Image source={{ uri: vehicle.photoURL }} style={styles.vehicleImage} />
      )}

      {/* Informações do Veículo */}
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleMainInfo}>
          <Text style={[styles.vehicleName, { color: colors.text }]}>
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </Text>
          <View style={styles.plateContainer}>
            <View style={[styles.colorDot, { backgroundColor: vehicle.colorHex }]} />
            <Text style={[styles.vehiclePlate, { color: colors.text }]}>{vehicle.licensePlate}</Text>
            <Text style={[styles.vehicleColor, { color: colors.textSecondary }]}>• {vehicle.color}</Text>
          </View>
        </View>

        {vehicle.description && (
          <Text style={[styles.vehicleDescription, { color: colors.textSecondary }]}>
            {vehicle.description}
          </Text>
        )}

        {/* Última localização vista */}
        {vehicle.lastSeenLocation && (
          <View style={styles.lastSeenContainer}>
            <Ionicons name="location" size={16} color={colors.warning} />
            <Text style={[styles.lastSeenText, { color: colors.textSecondary }]}>
              Visto pela última vez: {vehicle.lastSeenLocation.address}
            </Text>
          </View>
        )}
      </View>

      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="eye" size={16} color={colors.info} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {vehicle.sightingsCount} avistamento{vehicle.sightingsCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {getTimeAgo(vehicle.stolenAt)}
          </Text>
        </View>
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.sightingButton, { backgroundColor: colors.primary }]}
          onPress={() => onReportSighting(vehicle)}
        >
          <Ionicons name="eye" size={18} color="#FFFFFF" />
          <Text style={styles.sightingButtonText}>Vi Este Carro!</Text>
        </TouchableOpacity>

        {vehicle.ownerPhone && (
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.success }]}
            onPress={handleContactOwner}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contatar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function VeiculosRoubadosScreen() {
  const { colors } = useTheme();
  const { stolenVehicles, isLoading, refreshVehicles, reportVehicleSighting } = useStolenVehicles();
  const [showSightingModal, setShowSightingModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<StolenVehicle | null>(null);
  const [sightingDescription, setSightingDescription] = useState('');
  const [reportingLocation, setReportingLocation] = useState(false);

  const handleReportSighting = (vehicle: StolenVehicle) => {
    setSelectedVehicle(vehicle);
    setShowSightingModal(true);
    setSightingDescription('');
  };

  const confirmSighting = async () => {
    if (!selectedVehicle) return;

    setReportingLocation(true);
    
    try {
      // Obtém localização atual
      const currentLocation = await getCurrentLocation();
      
      // Reporta o avistamento
      await reportVehicleSighting(
        selectedVehicle.id,
        currentLocation,
        sightingDescription.trim() || undefined
      );

      Alert.alert(
        '✅ Avistamento Reportado!',
        `Obrigado por ajudar! O proprietário do ${selectedVehicle.brand} ${selectedVehicle.model} foi notificado sobre o avistamento.`,
        [{ text: 'OK' }]
      );

      setShowSightingModal(false);
      setSelectedVehicle(null);
      
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setReportingLocation(false);
    }
  };

  const renderVehicleCard = ({ item }: { item: StolenVehicle }) => (
    <StolenVehicleCard
      vehicle={item}
      onReportSighting={handleReportSighting}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="shield-checkmark" size={80} color={colors.success} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        🎉 Ótimas Notícias!
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Não há veículos roubados reportados no momento. Nossa comunidade está segura!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Veículos Roubados" showBackButton />
      
      <FlatList
        data={stolenVehicles}
        renderItem={renderVehicleCard}
        keyExtractor={(item) => item.id}
        style={styles.feedList}
        contentContainerStyle={stolenVehicles.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshVehicles} />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListHeaderComponent={
          stolenVehicles.length > 0 ? (
            <View style={styles.feedHeader}>
              <Text style={[styles.feedTitle, { color: colors.text }]}>
                🚨 Feed de Segurança Comunitária
              </Text>
              <Text style={[styles.feedSubtitle, { color: colors.textSecondary }]}>
                Ajude a comunidade reportando avistamentos de veículos roubados
              </Text>
              <View style={[styles.alertBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                <Ionicons name="information-circle" size={16} color={colors.warning} />
                <Text style={[styles.alertText, { color: colors.warning }]}>
                  Sua localização será compartilhada apenas com o proprietário do veículo
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Modal de Reportar Avistamento */}
      <Modal
        visible={showSightingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSightingModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                🚗 Reportar Avistamento
              </Text>
              <TouchableOpacity onPress={() => setShowSightingModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedVehicle && (
              <View style={styles.modalBody}>
                <View style={styles.vehicleSummary}>
                  <Text style={[styles.vehicleSummaryText, { color: colors.text }]}>
                    {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                  </Text>
                  <Text style={[styles.vehicleSummaryPlate, { color: colors.textSecondary }]}>
                    {selectedVehicle.licensePlate} • {selectedVehicle.color}
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Descrição do Avistamento (opcional)
                </Text>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      color: colors.text
                    }
                  ]}
                  value={sightingDescription}
                  onChangeText={setSightingDescription}
                  placeholder="Ex: Parado em estacionamento, duas pessoas dentro do carro..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />

                <View style={styles.privacyNote}>
                  <Ionicons name="location" size={16} color={colors.info} />
                  <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                    Sua localização atual será enviada para o proprietário
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: reportingLocation ? colors.textSecondary : colors.primary }
                  ]}
                  onPress={confirmSighting}
                  disabled={reportingLocation}
                >
                  {reportingLocation ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  )}
                  <Text style={styles.confirmButtonText}>
                    {reportingLocation ? 'Enviando...' : 'Confirmar Avistamento'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedList: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  feedHeader: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  feedTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  feedSubtitle: {
    fontSize: theme.fontSize.md,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  alertText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    lineHeight: 16,
  },
  vehicleCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  ownerPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerDetails: {
    marginLeft: theme.spacing.sm,
  },
  ownerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  postTime: {
    fontSize: theme.fontSize.sm,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    marginBottom: theme.spacing.md,
  },
  vehicleInfo: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  vehicleMainInfo: {
    marginBottom: theme.spacing.sm,
  },
  vehicleName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  vehiclePlate: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: 'monospace',
  },
  vehicleColor: {
    fontSize: theme.fontSize.sm,
  },
  vehicleDescription: {
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  lastSeenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  lastSeenText: {
    fontSize: theme.fontSize.sm,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.fontSize.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sightingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  sightingButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
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
  modalBody: {
    padding: theme.spacing.lg,
  },
  vehicleSummary: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F8F8F8',
  },
  vehicleSummaryText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  vehicleSummaryPlate: {
    fontSize: theme.fontSize.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.md,
    minHeight: 80,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  privacyText: {
    fontSize: theme.fontSize.sm,
    flex: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
