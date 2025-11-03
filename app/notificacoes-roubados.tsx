import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Header } from '../components/Header';
import { theme } from '../constants/theme';
import { SightingWithDetails, useSightingNotifications } from '../hooks/useSightingNotifications';
import { useTheme } from '../hooks/useTheme';

const SightingNotificationCard: React.FC<{
  notification: SightingWithDetails;
  onMarkAsRead: (id: string) => void;
  onViewLocation: (notification: SightingWithDetails) => void;
}> = ({ notification, onMarkAsRead, onViewLocation }) => {
  const { colors } = useTheme();

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora mesmo';
  };

  return (
    <View style={[
      styles.notificationCard, 
      { backgroundColor: colors.surface },
      !notification.isRead && { borderLeftColor: colors.primary, borderLeftWidth: 4 }
    ]}>
      {/* Header da Notificação */}
      <View style={styles.notificationHeader}>
        <View style={styles.vehicleInfo}>
          {notification.vehicleDetails?.photoURL ? (
            <Image 
              source={{ uri: notification.vehicleDetails.photoURL }} 
              style={styles.vehiclePhoto} 
            />
          ) : (
            <View style={[styles.vehiclePhotoPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="car" size={20} color={colors.textSecondary} />
            </View>
          )}
          
          <View style={styles.vehicleDetails}>
            <Text style={[styles.vehicleName, { color: colors.text }]}>
              {notification.vehicleDetails?.brand} {notification.vehicleDetails?.model}
            </Text>
            <Text style={[styles.vehiclePlate, { color: colors.textSecondary }]}>
              {notification.vehicleDetails?.licensePlate}
            </Text>
          </View>
        </View>

        <View style={styles.notificationMeta}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {getTimeAgo(notification.createdAt)}
          </Text>
          {!notification.isRead && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} />
          )}
        </View>
      </View>

      {/* Informações do Avistamento */}
      <View style={styles.sightingInfo}>
        <View style={styles.reporterInfo}>
          <Ionicons name="person" size={16} color={colors.textSecondary} />
          <Text style={[styles.reporterName, { color: colors.text }]}>
            {notification.reportedBy.name}
          </Text>
          <Text style={[styles.reportedText, { color: colors.textSecondary }]}>
            reportou um avistamento
          </Text>
        </View>

        {notification.sightingDetails?.location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color={colors.warning} />
            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={2}>
              {notification.sightingDetails.location.address}
            </Text>
          </View>
        )}

        {notification.sightingDetails?.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>
              Descrição:
            </Text>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {notification.sightingDetails.description}
            </Text>
          </View>
        )}
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.viewLocationButton, { backgroundColor: colors.primary }]}
          onPress={() => onViewLocation(notification)}
        >
          <Ionicons name="map" size={16} color="#FFFFFF" />
          <Text style={styles.viewLocationText}>Ver no Mapa</Text>
        </TouchableOpacity>

        {!notification.isRead && (
          <TouchableOpacity
            style={[styles.markReadButton, { borderColor: colors.border }]}
            onPress={() => notification.id && onMarkAsRead(notification.id)}
          >
            <Ionicons name="checkmark" size={16} color={colors.textSecondary} />
            <Text style={[styles.markReadText, { color: colors.textSecondary }]}>
              Marcar como lida
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const LocationModal: React.FC<{
  visible: boolean;
  notification: SightingWithDetails | null;
  onClose: () => void;
}> = ({ visible, notification, onClose }) => {
  const { colors } = useTheme();

  if (!visible || !notification?.sightingDetails?.location) return null;

  const location = notification.sightingDetails.location;

  return (
    <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
      <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            📍 Localização do Avistamento
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Avistamento reportado"
              description={location.address}
            >
              <View style={[styles.markerContainer, { backgroundColor: colors.error }]}>
                <Ionicons name="eye" size={16} color="#FFFFFF" />
              </View>
            </Marker>
          </MapView>

          <View style={styles.locationDetails}>
            <Text style={[styles.addressText, { color: colors.text }]}>
              {location.address}
            </Text>
            <Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            {location.accuracy && (
              <Text style={[styles.accuracyText, { color: colors.textSecondary }]}>
                Precisão: ~{Math.round(location.accuracy)}m
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default function NotificacoesRoubadosScreen() {
  const { colors } = useTheme();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    refresh 
  } = useSightingNotifications();

  const [selectedNotification, setSelectedNotification] = useState<SightingWithDetails | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      Alert.alert('✅ Sucesso', 'Todas as notificações foram marcadas como lidas');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleViewLocation = (notification: SightingWithDetails) => {
    setSelectedNotification(notification);
    setShowLocationModal(true);
    
    // Marca como lida ao visualizar
    if (!notification.isRead && notification.id) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error('Erro no refresh:', error);
    }
    setIsRefreshing(false);
  };

  const renderNotificationCard = ({ item }: { item: SightingWithDetails }) => (
    <SightingNotificationCard
      notification={item}
      onMarkAsRead={handleMarkAsRead}
      onViewLocation={handleViewLocation}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Nenhuma Notificação
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Você não possui veículos roubados com avistamentos reportados no momento.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.headerStats}>
        <Text style={[styles.statsText, { color: colors.text }]}>
          {notifications.length === 0 
            ? 'Nenhuma notificação' 
            : `${notifications.length} ${notifications.length === 1 ? 'notificação' : 'notificações'}`}
        </Text>
        {unreadCount > 0 && (
          <Text style={[styles.unreadStats, { color: colors.primary }]}>
            ({unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'})
          </Text>
        )}
      </View>
      
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllButton, { borderColor: colors.primary }]}
          onPress={handleMarkAllAsRead}
        >
          <Text style={[styles.markAllText, { color: colors.primary }]}>
            Marcar Todas como Lidas
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Notificações de Avistamentos" 
        showBackButton
        rightComponent={
          unreadCount > 0 ? (
            <View style={[styles.headerBadge, { backgroundColor: colors.error }]}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          ) : null
        }
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationCard}
          keyExtractor={(item) => item.id || ''}
          style={styles.notificationsList}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          ListHeaderComponent={notifications.length > 0 ? renderHeader : null}
        />
      )}

      {isLoading && notifications.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando notificações...
          </Text>
        </View>
      )}

      <LocationModal
        visible={showLocationModal}
        notification={selectedNotification}
        onClose={() => {
          setShowLocationModal(false);
          setSelectedNotification(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notificationsList: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  listHeader: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statsText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  unreadStats: {
    fontSize: theme.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  markAllButton: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  markAllText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  notificationCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehiclePhoto: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
  },
  vehiclePhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleDetails: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  vehicleName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  vehiclePlate: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'monospace',
  },
  notificationMeta: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: theme.fontSize.xs,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: theme.spacing.xs,
  },
  sightingInfo: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  reporterName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  reportedText: {
    fontSize: theme.fontSize.sm,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  locationText: {
    fontSize: theme.fontSize.sm,
    flex: 1,
    lineHeight: 18,
  },
  descriptionContainer: {
    marginBottom: theme.spacing.sm,
  },
  descriptionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  descriptionText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  viewLocationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  viewLocationText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  markReadText: {
    fontSize: theme.fontSize.xs,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  retryButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },

  // Modal de Localização
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
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
    flex: 1,
  },
  map: {
    width: '100%',
    height: 300,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  locationDetails: {
    padding: theme.spacing.lg,
  },
  addressText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  coordinatesText: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
  accuracyText: {
    fontSize: theme.fontSize.sm,
  },
});
