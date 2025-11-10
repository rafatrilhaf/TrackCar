import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { SightingNotification, StolenVehicle, VehicleSighting } from '../types/stolenVehicle';

export interface SightingWithDetails extends SightingNotification {
  sightingDetails?: VehicleSighting;
  vehicleDetails?: Pick<StolenVehicle, 'brand' | 'model' | 'licensePlate' | 'photoURL'>;
}

export function useSightingNotifications() {
  const [notifications, setNotifications] = useState<SightingWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return () => {};
      }

      console.log(`📬 Carregando notificações de avistamentos para usuário: ${currentUser.uid}...`);
      setIsLoading(true);
      setError(null);

      // Query para buscar notificações do usuário
      const notificationsQuery = query(
        collection(db, 'sighting_notifications'),
        where('vehicleOwnerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      console.log(`📬 Buscando notificações para usuário: ${currentUser.uid}`);

      // Listener em tempo real
      const unsubscribe = onSnapshot(
        notificationsQuery,
        async (snapshot) => {
          console.log(`📬 ${snapshot.docs.length} notificações encontradas para ${currentUser.uid}`);
          
          const notificationsWithDetails: SightingWithDetails[] = [];
          let unreadCounter = 0;

          for (const docSnap of snapshot.docs) {
            const notificationData = docSnap.data() as any;
            
            console.log(`📬 Processando notificação: ${docSnap.id}`, {
              vehicleOwnerId: notificationData.vehicleOwnerId,
              stolenVehicleId: notificationData.stolenVehicleId,
              isRead: notificationData.isRead,
            });
            
            const notification: SightingWithDetails = {
              id: docSnap.id,
              vehicleOwnerId: notificationData.vehicleOwnerId,
              stolenVehicleId: notificationData.stolenVehicleId,
              sightingId: notificationData.sightingId,
              reportedBy: notificationData.reportedBy,
              message: notificationData.message,
              isRead: notificationData.isRead || false,
              // ✅ CORRIGIDO: Verificar se é Timestamp do Firestore ou Date
              createdAt: notificationData.createdAt?.toDate ? 
                notificationData.createdAt.toDate() : 
                notificationData.createdAt instanceof Date ? 
                  notificationData.createdAt : 
                  new Date(),
            };

            // Conta não lidas
            if (!notification.isRead) {
              unreadCounter++;
            }

            try {
              // Busca detalhes do avistamento
              const sightingDoc = await getDoc(doc(db, 'vehicle_sightings', notification.sightingId));
              
              if (sightingDoc.exists()) {
                const sightingData = sightingDoc.data() as any;
                notification.sightingDetails = {
                  id: sightingDoc.id,
                  stolenVehicleId: sightingData.stolenVehicleId,
                  reportedBy: sightingData.reportedBy,
                  location: sightingData.location,
                  description: sightingData.description,
                  isVerified: sightingData.isVerified || false,
                  // ✅ CORRIGIDO: Verificar se é Timestamp do Firestore ou Date
                  timestamp: sightingData.timestamp?.toDate ? 
                    sightingData.timestamp.toDate() : 
                    sightingData.timestamp instanceof Date ? 
                      sightingData.timestamp : 
                      new Date(),
                };
                console.log(`✅ Detalhes do avistamento carregados: ${sightingDoc.id}`);
              }

              // Busca detalhes do veículo
              const stolenVehicleDoc = await getDoc(doc(db, 'stolen_cars', notification.stolenVehicleId));
              
              if (stolenVehicleDoc.exists()) {
                const stolenData = stolenVehicleDoc.data();
                console.log(`✅ Dados stolen_cars encontrados:`, stolenData);
                
                // Busca dados do carro
                if (stolenData.carId) {
                  const carDoc = await getDoc(doc(db, 'cars', stolenData.carId));
                  
                  if (carDoc.exists()) {
                    const carData = carDoc.data();
                    notification.vehicleDetails = {
                      brand: carData.brand,
                      model: carData.model,
                      licensePlate: carData.licensePlate,
                      photoURL: carData.photoURL,
                    };
                    console.log(`✅ Dados do veículo carregados:`, notification.vehicleDetails);
                  }
                }
              } else {
                // Tenta buscar diretamente em cars se não encontrou em stolen_cars
                const carDoc = await getDoc(doc(db, 'cars', notification.stolenVehicleId));
                
                if (carDoc.exists()) {
                  const carData = carDoc.data();
                  notification.vehicleDetails = {
                    brand: carData.brand,
                    model: carData.model,
                    licensePlate: carData.licensePlate,
                    photoURL: carData.photoURL,
                  };
                  console.log(`✅ Dados do veículo carregados diretamente de cars:`, notification.vehicleDetails);
                }
              }
            } catch (detailsError) {
              console.warn('⚠️ Erro ao buscar detalhes da notificação:', detailsError);
            }

            notificationsWithDetails.push(notification);
          }

          setNotifications(notificationsWithDetails);
          setUnreadCount(unreadCounter);
          setIsLoading(false);
          
          console.log(`✅ ${notificationsWithDetails.length} notificações processadas (${unreadCounter} não lidas) para usuário ${currentUser.uid}`);
        },
        (error) => {
          console.error('❌ Erro no listener de notificações:', error);
          setError('Erro ao carregar notificações');
          setIsLoading(false);
        }
      );

      return unsubscribe;
    } catch (error: any) {
      console.error('❌ Erro ao configurar notificações:', error);
      setError(error.message || 'Erro desconhecido');
      setIsLoading(false);
      return () => {};
    }
  }, []);

  // Marca notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'sighting_notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: new Date(),
      });
      console.log(`✅ Notificação ${notificationId} marcada como lida`);
    } catch (error: any) {
      console.error('❌ Erro ao marcar como lida:', error);
      throw new Error('Erro ao marcar notificação como lida');
    }
  }, []);

  // Marca todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      const updatePromises = unreadNotifications.map(notification => {
        if (notification.id) {
          return markAsRead(notification.id);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      console.log(`✅ ${unreadNotifications.length} notificações marcadas como lidas`);
    } catch (error: any) {
      console.error('❌ Erro ao marcar todas como lidas:', error);
      throw new Error('Erro ao marcar notificações como lidas');
    }
  }, [notifications, markAsRead]);

  // ✅ CORRIGIDO: Função refresh separada para evitar problema com useEffect
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Força recarregamento
      const unsubscribe = await loadNotifications();
      return unsubscribe;
    } catch (error: any) {
      console.error('❌ Erro no refresh:', error);
      setError(error.message || 'Erro ao atualizar');
      setIsLoading(false);
      return () => {};
    }
  }, [loadNotifications]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // ✅ CORRIGIDO: Gerenciamento melhor do useEffect
    const setupListener = async () => {
      const unsubscribeFunction = await loadNotifications();
      unsubscribe = unsubscribeFunction;
    };

    setupListener();
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
