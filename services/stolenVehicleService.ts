// services/stolenVehicleService.ts
import * as Location from 'expo-location';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    increment,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { SightingNotification, StolenVehicle, VehicleSighting } from '../types/stolenVehicle';
import { auth, db } from './firebase';

/**
 * Busca todos os veículos roubados ativos
 */
export async function getStolenVehicles(): Promise<StolenVehicle[]> {
  try {
    const stolenCarsRef = collection(db, 'stolen_cars');
    const q = query(
      stolenCarsRef,
      where('isActive', '==', true),
      orderBy('stolenAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const vehicles: StolenVehicle[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Busca dados do carro
      const carDoc = await getDocs(query(
        collection(db, 'cars'),
        where('__name__', '==', data.carId)
      ));
      
      if (!carDoc.empty) {
        const carData = carDoc.docs[0].data();
        
        // Busca dados do proprietário
        const ownerDoc = await getDocs(query(
          collection(db, 'users'),
          where('uid', '==', data.userId)
        ));
        
        const ownerData = ownerDoc.empty ? null : ownerDoc.docs[0].data();
        
        vehicles.push({
          id: docSnapshot.id,
          carId: data.carId,
          userId: data.userId,
          ownerName: ownerData?.name || 'Usuário',
          ownerPhone: ownerData?.phone,
          ownerPhotoURL: ownerData?.photoURL,
          
          // Dados do veículo
          brand: carData.brand,
          model: carData.model,
          year: carData.year,
          licensePlate: carData.licensePlate,
          color: carData.color,
          colorHex: carData.colorHex,
          photoURL: carData.photoURL,
          description: carData.description,
          
          // Dados do roubo
          stolenAt: data.stolenAt?.toDate() || new Date(),
          lastSeenLocation: data.lastSeenLocation ? {
            ...data.lastSeenLocation,
            timestamp: data.lastSeenLocation.timestamp?.toDate()
          } : undefined,
          
          sightingsCount: data.sightingsCount || 0,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        });
      }
    }

    return vehicles;
  } catch (error: any) {
    console.error('Erro ao buscar veículos roubados:', error);
    throw new Error('Erro ao carregar veículos roubados');
  }
}

/**
 * Reporta avistamento de um veículo roubado
 */
export async function reportSighting(
  stolenVehicleId: string,
  location: { latitude: number; longitude: number; address: string },
  description?: string
): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Busca dados do usuário atual
    const userDoc = await getDocs(query(
      collection(db, 'users'),
      where('uid', '==', currentUser.uid)
    ));

    const userData = userDoc.empty ? null : userDoc.docs[0].data();

    // Cria o avistamento
    const sighting: Omit<VehicleSighting, 'id'> = {
      stolenVehicleId,
      reportedBy: {
        userId: currentUser.uid,
        name: userData?.name || 'Usuário Anônimo',
        photoURL: userData?.photoURL,
      },
      location,
      description,
      timestamp: new Date(),
      isVerified: false,
    };

    const docRef = await addDoc(collection(db, 'vehicle_sightings'), sighting);

    // Atualiza contador de avistamentos
    await updateDoc(doc(db, 'stolen_cars', stolenVehicleId), {
      sightingsCount: increment(1),
      lastSeenLocation: {
        ...location,
        timestamp: new Date(),
      },
      updatedAt: new Date(),
    });

    // Busca dados do veículo roubado para notificação
    const stolenVehicleDoc = await getDocs(query(
      collection(db, 'stolen_cars'),
      where('__name__', '==', stolenVehicleId)
    ));

    if (!stolenVehicleDoc.empty) {
      const stolenData = stolenVehicleDoc.docs[0].data();
      
      // Cria notificação para o proprietário
      const notification: Omit<SightingNotification, 'id'> = {
        vehicleOwnerId: stolenData.userId,
        stolenVehicleId,
        sightingId: docRef.id,
        reportedBy: {
          userId: currentUser.uid,
          name: userData?.name || 'Usuário Anônimo',
        },
        message: `Seu ${stolenData.brand || 'veículo'} foi avistado em ${location.address}`,
        isRead: false,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'sighting_notifications'), notification);
    }

    return docRef.id;
  } catch (error: any) {
    console.error('Erro ao reportar avistamento:', error);
    throw new Error('Erro ao reportar avistamento');
  }
}

/**
 * Escuta atualizações de veículos roubados em tempo real
 */
export function subscribeToStolenVehicles(
  callback: (vehicles: StolenVehicle[]) => void
): () => void {
  try {
    const stolenCarsRef = collection(db, 'stolen_cars');
    const q = query(
      stolenCarsRef,
      where('isActive', '==', true),
      orderBy('stolenAt', 'desc')
    );

    return onSnapshot(q, async (querySnapshot) => {
      const vehicles: StolenVehicle[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        
        // Busca dados do carro e proprietário (implementação similar à getStolenVehicles)
        try {
          const carDoc = await getDocs(query(
            collection(db, 'cars'),
            where('__name__', '==', data.carId)
          ));
          
          if (!carDoc.empty) {
            const carData = carDoc.docs[0].data();
            
            const ownerDoc = await getDocs(query(
              collection(db, 'users'),
              where('uid', '==', data.userId)
            ));
            
            const ownerData = ownerDoc.empty ? null : ownerDoc.docs[0].data();
            
            vehicles.push({
              id: docSnapshot.id,
              carId: data.carId,
              userId: data.userId,
              ownerName: ownerData?.name || 'Usuário',
              ownerPhone: ownerData?.phone,
              ownerPhotoURL: ownerData?.photoURL,
              
              brand: carData.brand,
              model: carData.model,
              year: carData.year,
              licensePlate: carData.licensePlate,
              color: carData.color,
              colorHex: carData.colorHex,
              photoURL: carData.photoURL,
              description: carData.description,
              
              stolenAt: data.stolenAt?.toDate() || new Date(),
              lastSeenLocation: data.lastSeenLocation ? {
                ...data.lastSeenLocation,
                timestamp: data.lastSeenLocation.timestamp?.toDate()
              } : undefined,
              
              sightingsCount: data.sightingsCount || 0,
              isActive: data.isActive,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate(),
            });
          }
        } catch (error) {
          console.warn('Erro ao buscar dados do veículo:', error);
        }
      }

      callback(vehicles);
    });
  } catch (error: any) {
    console.error('Erro ao configurar listener de veículos roubados:', error);
    return () => {};
  }
}

/**
 * Obtém localização atual do usuário
 */
export async function getCurrentLocation(): Promise<{ 
  latitude: number; 
  longitude: number; 
  address: string;
  accuracy?: number;
}> {
  try {
    // Solicita permissões
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permissão de localização negada');
    }

    // Obtém localização atual
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Converte coordenadas em endereço
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    let address = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
    
    if (reverseGeocode.length > 0) {
      const addr = reverseGeocode[0];
      address = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.district || ''}, ${addr.city || ''} - ${addr.region || ''}`.trim();
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
      accuracy: location.coords.accuracy || undefined,
    };
  } catch (error: any) {
    console.error('Erro ao obter localização:', error);
    throw new Error('Erro ao obter localização atual');
  }
}
