// app/veiculosroubados.tsx - VERSÃO RESPONSIVA COMPLETA
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Header } from '../components/Header';
import { theme } from '../constants/theme';
import { usePublicSightings } from '../hooks/usePublicSightings';
import { useSightingNotifications } from '../hooks/useSightingNotifications';
import { useStolenVehicles } from '../hooks/useStolenVehicle';
import { useTheme } from '../hooks/useTheme';
import { auth } from '../services/firebase';
import { getCurrentLocation } from '../services/stolenVehicleService';
import { StolenVehicle } from '../types/stolenVehicle';
import { scaleFont, scaleHeight, scaleIcon, scaleModerate } from '../utils/responsive';

const StolenVehicleCard: React.FC<{
  vehicle: StolenVehicle;
  onReportSighting: (vehicle: StolenVehicle) => void;
}> = ({ vehicle, onReportSighting }) => {
  const { colors } = useTheme();
  const { sightings } = usePublicSightings(vehicle.id);
  
  const currentUser = auth.currentUser;
  const isOwnVehicle = currentUser && vehicle.userId === currentUser.uid;
  
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

  const styles = StyleSheet.create({
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
      flex: 1,
    },
    ownerPhoto: {
      width: scaleModerate(40),
      height: scaleModerate(40),
      borderRadius: scaleModerate(20),
    },
    ownerPhotoPlaceholder: {
      width: scaleModerate(40),
      height: scaleModerate(40),
      borderRadius: scaleModerate(20),
      justifyContent: 'center',
      alignItems: 'center',
    },
    ownerDetails: {
      marginLeft: theme.spacing.sm,
      flex: 1,
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
      minHeight: scaleHeight(24),
    },
    urgencyText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.bold,
    },
    vehicleImage: {
      width: '100%',
      height: scaleHeight(200),
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
      flexWrap: 'wrap',
    },
    colorDot: {
      width: scaleModerate(12),
      height: scaleModerate(12),
      borderRadius: scaleModerate(6),
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
      lineHeight: scaleFont(18),
      marginBottom: theme.spacing.sm,
    },
    sightingsSection: {
      marginBottom: theme.spacing.sm,
    },
    sightingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    sightingsText: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
      flex: 1,
    },
    publicDescriptions: {
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.1)',
    },
    publicDescriptionsTitle: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.medium,
      marginBottom: theme.spacing.xs,
      textTransform: 'uppercase',
    },
    publicDescriptionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    publicDescriptionText: {
      fontSize: theme.fontSize.sm,
      flex: 1,
      lineHeight: scaleFont(16),
      fontStyle: 'italic',
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
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      paddingTop: 0,
    },
    sightingButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.xs,
      minHeight: scaleHeight(44),
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
      minHeight: scaleHeight(44),
    },
    contactButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
    },
    ownVehicleMessage: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      gap: theme.spacing.xs,
      minHeight: scaleHeight(44),
    },
    ownVehicleMessageText: {
      fontSize: theme.fontSize.sm,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={[styles.vehicleCard, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={styles.ownerInfo}>
          {vehicle.ownerPhotoURL ? (
            <Image source={{ uri: vehicle.ownerPhotoURL }} style={styles.ownerPhoto} />
          ) : (
            <View style={[styles.ownerPhotoPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={scaleIcon(20)} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.ownerDetails}>
            <Text style={[styles.ownerName, { color: colors.text }]} numberOfLines={1}>{vehicle.ownerName}</Text>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>
              Roubado há {getTimeAgo(vehicle.stolenAt)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.urgencyBadge, { backgroundColor: colors.error }]}>
          <Ionicons name="warning" size={scaleIcon(14)} color="#FFFFFF" />
          <Text style={styles.urgencyText}>ROUBADO</Text>
        </View>
      </View>

      {vehicle.photoURL && (
        <Image source={{ uri: vehicle.photoURL }} style={styles.vehicleImage} />
      )}

      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleMainInfo}>
          <Text style={[styles.vehicleName, { color: colors.text }]} numberOfLines={1}>
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </Text>
          <View style={styles.plateContainer}>
            <View style={[styles.colorDot, { backgroundColor: vehicle.colorHex }]} />
            <Text style={[styles.vehiclePlate, { color: colors.text }]}>{vehicle.licensePlate}</Text>
            <Text style={[styles.vehicleColor, { color: colors.textSecondary }]}>• {vehicle.color}</Text>
          </View>
        </View>

        {vehicle.description && (
          <Text style={[styles.vehicleDescription, { color: colors.textSecondary }]} numberOfLines={3}>
            {vehicle.description}
          </Text>
        )}

        {sightings.count > 0 && (
          <View style={styles.sightingsSection}>
            <View style={styles.sightingsContainer}>
              <Ionicons name="eye" size={scaleIcon(16)} color={colors.primary} />
              <Text style={[styles.sightingsText, { color: colors.primary }]}>
                {sightings.count} {sightings.count === 1 ? 'relato sobre' : 'relatos sobre'} este veículo
              </Text>
            </View>
            
            {sightings.descriptions.length > 0 && (
              <View style={styles.publicDescriptions}>
                <Text style={[styles.publicDescriptionsTitle, { color: colors.textSecondary }]}>
                  Relatos da comunidade:
                </Text>
                {sightings.descriptions.map((description, index) => (
                  <View key={index} style={styles.publicDescriptionItem}>
                    <Ionicons name="chatbubble-ellipses" size={scaleIcon(12)} color={colors.textSecondary} />
                    <Text style={[styles.publicDescriptionText, { color: colors.text }]} numberOfLines={2}>
                      "{description}"
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {vehicle.lastSeenLocation && (
          <View style={styles.lastSeenContainer}>
            <Ionicons name="location" size={scaleIcon(16)} color={colors.warning} />
            <Text style={[styles.lastSeenText, { color: colors.textSecondary }]}>
              Última atividade reportada há {getTimeAgo(vehicle.lastSeenLocation.timestamp)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        {!isOwnVehicle && (
          <TouchableOpacity
            style={[styles.sightingButton, { backgroundColor: colors.primary }]}
            onPress={() => onReportSighting(vehicle)}
          >
            <Ionicons name="eye" size={scaleIcon(18)} color="#FFFFFF" />
            <Text style={styles.sightingButtonText}>Vi Este Carro!</Text>
          </TouchableOpacity>
        )}

        {vehicle.ownerPhone && !isOwnVehicle && (
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.success }]}
            onPress={handleContactOwner}
          >
            <Ionicons name="logo-whatsapp" size={scaleIcon(18)} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contatar</Text>
          </TouchableOpacity>
        )}

        {isOwnVehicle && (
          <View style={[styles.ownVehicleMessage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="information-circle" size={scaleIcon(16)} color={colors.textSecondary} />
            <Text style={[styles.ownVehicleMessageText, { color: colors.textSecondary }]}>
              Este é o seu veículo roubado
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function VeiculosRoubadosScreen() {
  const { colors } = useTheme();
  const { stolenVehicles, isLoading, refreshVehicles, reportVehicleSighting } = useStolenVehicles();
  const { unreadCount } = useSightingNotifications();
  
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
      const currentLocation = await getCurrentLocation();
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
      <Ionicons name="shield-checkmark" size={scaleIcon(80)} color={colors.success} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        🎉 Ótimas Notícias!
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Não há veículos roubados reportados no momento. Nossa comunidade está segura!
      </Text>
    </View>
  );

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
      fontSize: scaleFont(22),
      fontWeight: theme.fontWeight.bold,
      marginBottom: theme.spacing.xs,
    },
    feedSubtitle: {
      fontSize: theme.fontSize.md,
      lineHeight: scaleFont(20),
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
      lineHeight: scaleFont(16),
    },
    notificationsButton: {
      position: 'relative',
      padding: theme.spacing.xs,
    },
    notificationBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: scaleModerate(18),
      height: scaleModerate(18),
      borderRadius: scaleModerate(9),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.bold,
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
      lineHeight: scaleFont(22),
    },
    modalOverlay: {
      flex: 1,
    },
    keyboardAvoidingContainer: {
      flex: 1,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '85%',
      minHeight: '50%',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 0,
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
    },
    vehicleSummaryText: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    vehicleSummaryPlate: {
      fontSize: theme.fontSize.md,
    },
    publicWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    publicWarningText: {
      flex: 1,
      fontSize: theme.fontSize.sm,
      lineHeight: scaleFont(16),
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
      minHeight: scaleHeight(80),
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
      lineHeight: scaleFont(18),
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      minHeight: scaleHeight(52),
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Veículos Roubados" 
        showBackButton 
        rightComponent={
          <TouchableOpacity
            style={styles.notificationsButton}
            onPress={() => router.push('/notificacoes-roubados')}
          >
            <Ionicons name="notifications" size={scaleIcon(24)} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />
      
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
                🚨 Feed de Segurança{'\n'}Comunitária
              </Text>
              <Text style={[styles.feedSubtitle, { color: colors.textSecondary }]}>
                Ajude a comunidade reportando avistamentos de veículos roubados
              </Text>
              <View style={[styles.alertBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                <Ionicons name="information-circle" size={scaleIcon(16)} color={colors.warning} />
                <Text style={[styles.alertText, { color: colors.warning }]}>
                  Sua localização será compartilhada apenas com o proprietário do veículo
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      <Modal
        visible={showSightingModal}
        animationType="slide"
        transparent={true}
        presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'fullScreen'}
        onRequestClose={() => setShowSightingModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
            style={styles.keyboardAvoidingContainer}
          >
            <TouchableWithoutFeedback onPress={() => setShowSightingModal(false)}>
              <View style={styles.modalBackdrop}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <ScrollView
                      contentContainerStyle={styles.scrollContent}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                          🚗 Reportar Avistamento
                        </Text>
                        <TouchableOpacity onPress={() => setShowSightingModal(false)}>
                          <Ionicons name="close" size={scaleIcon(24)} color={colors.text} />
                        </TouchableOpacity>
                      </View>

                      {selectedVehicle && (
                        <View style={styles.modalBody}>
                          <View style={[styles.vehicleSummary, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.vehicleSummaryText, { color: colors.text }]}>
                              {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                            </Text>
                            <Text style={[styles.vehicleSummaryPlate, { color: colors.textSecondary }]}>
                              {selectedVehicle.licensePlate} • {selectedVehicle.color}
                            </Text>
                          </View>

                          <View style={[styles.publicWarning, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                            <Ionicons name="warning" size={scaleIcon(16)} color={colors.warning} />
                            <Text style={[styles.publicWarningText, { color: colors.warning }]}>
                              Sua descrição será pública para ajudar a comunidade. Não inclua informações pessoais.
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
                            placeholderTextColor={colors.placeholder}
                            multiline
                            numberOfLines={3}
                            maxLength={200}
                            textAlignVertical="top"
                            returnKeyType="done"
                            blurOnSubmit
                          />

                          <View style={styles.privacyNote}>
                            <Ionicons name="location" size={scaleIcon(16)} color={colors.info} />
                            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                              Sua localização exata será enviada apenas para o proprietário
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.confirmButton,
                              { backgroundColor: reportingLocation ? colors.textSecondary : colors.primary }
                            ]}
                            onPress={confirmSighting}
                            disabled={reportingLocation}
                            activeOpacity={0.9}
                          >
                            {reportingLocation ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Ionicons name="send" size={scaleIcon(18)} color="#FFFFFF" />
                            )}
                            <Text style={styles.confirmButtonText}>
                              {reportingLocation ? 'Enviando...' : 'Confirmar Avistamento'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
