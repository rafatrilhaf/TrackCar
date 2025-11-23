// app/notificacoes-roubados.tsx - VERSÃO RESPONSIVA COMPLETA
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Header } from '../components/Header';
import { theme } from '../constants/theme';
import { SightingWithDetails, useSightingNotifications } from '../hooks/useSightingNotifications';
import { useTheme } from '../hooks/useTheme';
import { scaleFont, scaleHeight, scaleIcon, scaleModerate } from '../utils/responsive';

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

  const styles = StyleSheet.create({
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
      width: scaleModerate(40),
      height: scaleModerate(40),
      borderRadius: theme.borderRadius.md,
    },
    vehiclePhotoPlaceholder: {
      width: scaleModerate(40),
      height: scaleModerate(40),
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
      width: scaleModerate(8),
      height: scaleModerate(8),
      borderRadius: scaleModerate(4),
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
      flexWrap: 'wrap',
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
      lineHeight: scaleFont(18),
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
      lineHeight: scaleFont(18),
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
      minHeight: scaleHeight(40),
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
      minHeight: scaleHeight(40),
    },
    markReadText: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.medium,
    },
  });

  return (
    <View style={[
      styles.notificationCard, 
      { backgroundColor: colors.surface },
      !notification.isRead && { borderLeftColor: colors.primary, borderLeftWidth: 4 }
    ]}>
      <View style={styles.notificationHeader}>
        <View style={styles.vehicleInfo}>
          {notification.vehicleDetails?.photoURL ? (
            <Image 
              source={{ uri: notification.vehicleDetails.photoURL }} 
              style={styles.vehiclePhoto} 
            />
          ) : (
            <View style={[styles.vehiclePhotoPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="car" size={scaleIcon(20)} color={colors.textSecondary} />
            </View>
          )}
          
          <View style={styles.vehicleDetails}>
            <Text style={[styles.vehicleName, { color: colors.text }]} numberOfLines={1}>
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

      <View style={styles.sightingInfo}>
        <View style={styles.reporterInfo}>
          <Ionicons name="person" size={scaleIcon(16)} color={colors.textSecondary} />
          <Text style={[styles.reporterName, { color: colors.text }]}>
            {notification.reportedBy.name}
          </Text>
          <Text style={[styles.reportedText, { color: colors.textSecondary }]}>
            reportou um avistamento
          </Text>
        </View>

        {notification.sightingDetails?.location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={scaleIcon(16)} color={colors.warning} />
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
            <Text style={[styles.descriptionText, { color: colors.text }]} numberOfLines={3}>
              {notification.sightingDetails.description}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.viewLocationButton, { backgroundColor: colors.primary }]}
          onPress={() => onViewLocation(notification)}
        >
          <Ionicons name="map" size={scaleIcon(16)} color="#FFFFFF" />
          <Text style={styles.viewLocationText}>Ver no Google Maps</Text>
        </TouchableOpacity>

        {!notification.isRead && (
          <TouchableOpacity
            style={[styles.markReadButton, { borderColor: colors.border }]}
            onPress={() => notification.id && onMarkAsRead(notification.id)}
          >
            <Ionicons name="checkmark" size={scaleIcon(16)} color={colors.textSecondary} />
            <Text style={[styles.markReadText, { color: colors.textSecondary }]}>
              Marcar como lida
            </Text>
          </TouchableOpacity>
        )}
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
    if (!notification.sightingDetails?.location) {
      Alert.alert('Erro', 'Localização não disponível');
      return;
    }

    const { latitude, longitude, address } = notification.sightingDetails.location;
    
    const googleMapsUrl = Platform.select({
      ios: `maps:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(address)})`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(address)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    });

    Linking.canOpenURL(googleMapsUrl!).then(supported => {
      if (supported) {
        Linking.openURL(googleMapsUrl!);
        
        if (!notification.isRead && notification.id) {
          handleMarkAsRead(notification.id);
        }
      } else {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(webUrl);
        
        if (!notification.isRead && notification.id) {
          handleMarkAsRead(notification.id);
        }
      }
    });
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
      <Ionicons name="notifications-off" size={scaleIcon(80)} color={colors.textSecondary} />
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
      flexWrap: 'wrap',
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
      minHeight: scaleHeight(36),
      justifyContent: 'center',
    },
    markAllText: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
    },
    headerBadge: {
      minWidth: scaleModerate(20),
      height: scaleModerate(20),
      borderRadius: scaleModerate(10),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    headerBadgeText: {
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
      minHeight: scaleHeight(44),
      justifyContent: 'center',
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
    },
  });

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
          <Ionicons name="warning" size={scaleIcon(48)} color={colors.error} />
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
    </View>
  );
}
  