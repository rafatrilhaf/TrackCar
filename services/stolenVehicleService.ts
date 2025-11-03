import * as Location from 'expo-location';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { SightingNotification, StolenVehicle, VehicleSighting } from '../types/stolenVehicle';
import { auth, db } from './firebase';

/**
 * ✅ FUNÇÃO PRINCIPAL: Busca todos os veículos roubados ativos
 */
export async function getStolenVehicles(): Promise<StolenVehicle[]> {
  try {
    console.log('🔍 Buscando veículos roubados...');
    
    // Busca na coleção cars por isStolen = true
    const carsRef = collection(db, 'cars');
    const carsQuery = query(
      carsRef,
      where('isStolen', '==', true),
      where('isActive', '==', true)
    );

    const carsSnapshot = await getDocs(carsQuery);
    console.log(`📊 Encontrados ${carsSnapshot.docs.length} carros marcados como roubados`);
    
    const vehicles: StolenVehicle[] = [];

    for (const carDocSnapshot of carsSnapshot.docs) {
      const carData = carDocSnapshot.data();
      console.log(`🚗 Processando carro roubado: ${carDocSnapshot.id}`, {
        brand: carData.brand,
        model: carData.model,
        licensePlate: carData.licensePlate,
        isStolen: carData.isStolen
      });
      
      try {
        // ✅ VERIFICAÇÃO DUPLA: Confirma que ainda está roubado
        if (carData.isStolen !== true) {
          console.log(`⚠️ Carro ${carDocSnapshot.id} não está mais roubado - ignorando`);
          continue;
        }

        // Busca dados do proprietário
        const ownerDocRef = doc(db, 'users', carData.userId);
        const ownerDoc = await getDoc(ownerDocRef);
        
        let ownerData = null;
        if (ownerDoc.exists()) {
          ownerData = ownerDoc.data();
          console.log(`👤 Proprietário encontrado: ${ownerData?.name || ownerData?.displayName}`);
        } else {
          console.warn(`⚠️ Proprietário não encontrado para userId: ${carData.userId}`);
          
          // FALLBACK: Tenta buscar por query
          const userQuery = query(collection(db, 'users'), where('uid', '==', carData.userId));
          const userQuerySnapshot = await getDocs(userQuery);
          
          if (!userQuerySnapshot.empty) {
            ownerData = userQuerySnapshot.docs[0].data();
            console.log(`👤 Proprietário encontrado via query: ${ownerData?.name || ownerData?.displayName}`);
          }
        }
        
        // Busca dados adicionais do roubo na coleção stolen_cars (se existir)
        const stolenCarsQuery = query(
          collection(db, 'stolen_cars'),
          where('carId', '==', carDocSnapshot.id),
          where('isActive', '==', true)
        );
        const stolenCarsSnapshot = await getDocs(stolenCarsQuery);
        
        let stolenData = null;
        if (!stolenCarsSnapshot.empty) {
          stolenData = stolenCarsSnapshot.docs[0].data();
          console.log(`📋 Dados do roubo encontrados: ${stolenCarsSnapshot.docs[0].id}`);
        }
        
        const vehicle: StolenVehicle = {
          id: stolenCarsSnapshot.empty ? carDocSnapshot.id : stolenCarsSnapshot.docs[0].id,
          carId: carDocSnapshot.id,
          userId: carData.userId,
          ownerName: ownerData?.name || ownerData?.displayName || 'Proprietário',
          ownerPhone: ownerData?.phone || ownerData?.phoneNumber,
          ownerPhotoURL: ownerData?.photoURL || ownerData?.avatar,
          
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
          stolenAt: carData.stolenReportedAt?.toDate() || stolenData?.stolenAt?.toDate() || new Date(),
          lastSeenLocation: stolenData?.lastSeenLocation ? {
            ...stolenData.lastSeenLocation,
            timestamp: stolenData.lastSeenLocation.timestamp?.toDate()
          } : undefined,
          
          sightingsCount: stolenData?.sightingsCount || 0,
          isActive: true,
          createdAt: carData.createdAt?.toDate() || new Date(),
          updatedAt: carData.updatedAt?.toDate(),
        };

        vehicles.push(vehicle);
        console.log(`✅ Veículo adicionado: ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar carro roubado ${carDocSnapshot.id}:`, error);
      }
    }

    console.log(`🎯 Total de veículos roubados válidos: ${vehicles.length}`);
    return vehicles;
  } catch (error: any) {
    console.error('❌ Erro ao buscar veículos roubados:', error);
    throw new Error(`Erro ao carregar veículos roubados: ${error.message}`);
  }
}

/**
 * ✅ Escuta atualizações de veículos roubados em tempo real
 */
export function subscribeToStolenVehicles(
  callback: (vehicles: StolenVehicle[]) => void
): () => void {
  try {
    console.log('🔄 Iniciando subscription para veículos roubados...');
    
    const carsRef = collection(db, 'cars');
    const q = query(
      carsRef,
      where('isStolen', '==', true),
      where('isActive', '==', true)
    );

    return onSnapshot(q, async (querySnapshot) => {
      console.log(`🔔 Subscription ativada: ${querySnapshot.docs.length} carros roubados`);
      const vehicles: StolenVehicle[] = [];

      for (const carDocSnapshot of querySnapshot.docs) {
        const carData = carDocSnapshot.data();
        
        try {
          // Verifica se ainda está roubado
          if (carData.isStolen !== true) {
            console.log(`⚠️ Carro ${carDocSnapshot.id} não está mais roubado - ignorando`);
            continue;
          }

          // Busca dados do proprietário
          const ownerDocRef = doc(db, 'users', carData.userId);
          const ownerDoc = await getDoc(ownerDocRef);
          
          let ownerData = null;
          if (ownerDoc.exists()) {
            ownerData = ownerDoc.data();
          } else {
            const userQuery = query(collection(db, 'users'), where('uid', '==', carData.userId));
            const userQuerySnapshot = await getDocs(userQuery);
            
            if (!userQuerySnapshot.empty) {
              ownerData = userQuerySnapshot.docs[0].data();
            }
          }
          
          // Busca dados adicionais do roubo
          const stolenCarsQuery = query(
            collection(db, 'stolen_cars'),
            where('carId', '==', carDocSnapshot.id),
            where('isActive', '==', true)
          );
          const stolenCarsSnapshot = await getDocs(stolenCarsQuery);
          
          let stolenData = null;
          if (!stolenCarsSnapshot.empty) {
            stolenData = stolenCarsSnapshot.docs[0].data();
          }
          
          vehicles.push({
            id: stolenCarsSnapshot.empty ? carDocSnapshot.id : stolenCarsSnapshot.docs[0].id,
            carId: carDocSnapshot.id,
            userId: carData.userId,
            ownerName: ownerData?.name || ownerData?.displayName || 'Proprietário',
            ownerPhone: ownerData?.phone || ownerData?.phoneNumber,
            ownerPhotoURL: ownerData?.photoURL || ownerData?.avatar,
            
            brand: carData.brand,
            model: carData.model,
            year: carData.year,
            licensePlate: carData.licensePlate,
            color: carData.color,
            colorHex: carData.colorHex,
            photoURL: carData.photoURL,
            description: carData.description,
            
            stolenAt: carData.stolenReportedAt?.toDate() || stolenData?.stolenAt?.toDate() || new Date(),
            lastSeenLocation: stolenData?.lastSeenLocation ? {
              ...stolenData.lastSeenLocation,
              timestamp: stolenData.lastSeenLocation.timestamp?.toDate()
            } : undefined,
            
            sightingsCount: stolenData?.sightingsCount || 0,
            isActive: true,
            createdAt: carData.createdAt?.toDate() || new Date(),
            updatedAt: carData.updatedAt?.toDate(),
          });
        } catch (error) {
          console.warn('⚠️ Erro ao processar veículo na subscription:', error);
        }
      }

      console.log(`🎯 Subscription processada: ${vehicles.length} veículos roubados válidos`);
      callback(vehicles);
    }, (error) => {
      console.error('❌ Erro na subscription:', error);
      callback([]); // Retorna lista vazia em caso de erro
    });
  } catch (error: any) {
    console.error('❌ Erro ao configurar listener de veículos roubados:', error);
    return () => {};
  }
}

/**
 * ✅ Marca veículo como encontrado
 */
export async function markVehicleAsFound(carId: string): Promise<void> {
  try {
    console.log(`🔍 Marcando veículo ${carId} como encontrado...`);
    
    // Atualiza na coleção cars
    const carRef = doc(db, 'cars', carId);
    await updateDoc(carRef, {
      isStolen: false,
      foundAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`✅ Carro ${carId} marcado como não roubado na coleção cars`);
    
    // Desativa registros na coleção stolen_cars (se existir)
    const stolenCarsQuery = query(
      collection(db, 'stolen_cars'),
      where('carId', '==', carId)
    );
    const stolenCarsSnapshot = await getDocs(stolenCarsQuery);
    
    for (const docSnapshot of stolenCarsSnapshot.docs) {
      await updateDoc(docSnapshot.ref, {
        isActive: false,
        foundAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Registro ${docSnapshot.id} desativado na coleção stolen_cars`);
    }
    
    console.log(`✅ Veículo ${carId} marcado como encontrado com sucesso`);
  } catch (error: any) {
    console.error('❌ Erro ao marcar veículo como encontrado:', error);
    throw new Error(`Erro ao marcar veículo como encontrado: ${error.message}`);
  }
}

/**
 * ✅ Marca veículo como roubado
 */
export async function markVehicleAsStolen(
  carId: string, 
  description?: string,
  policeReportNumber?: string
): Promise<string> {
  try {
    console.log(`🚨 Marcando veículo ${carId} como roubado...`);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }
    
    // Atualiza na coleção cars
    const carRef = doc(db, 'cars', carId);
    await updateDoc(carRef, {
      isStolen: true,
      stolenReportedAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`✅ Carro ${carId} marcado como roubado na coleção cars`);
    
    // Cria registro na coleção stolen_cars
    const stolenCarData = {
      carId,
      userId: currentUser.uid,
      stolenAt: new Date(),
      description,
      policeReportNumber,
      sightingsCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const stolenCarRef = await addDoc(collection(db, 'stolen_cars'), stolenCarData);
    
    console.log(`✅ Veículo ${carId} marcado como roubado - Registro: ${stolenCarRef.id}`);
    return stolenCarRef.id;
  } catch (error: any) {
    console.error('❌ Erro ao marcar veículo como roubado:', error);
    throw new Error(`Erro ao reportar veículo como roubado: ${error.message}`);
  }
}

// ✅ Mantém as outras funções existentes...

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

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    let userData = null;
    if (userDoc.exists()) {
      userData = userDoc.data();
    } else {
      const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      const userQuerySnapshot = await getDocs(userQuery);
      
      if (!userQuerySnapshot.empty) {
        userData = userQuerySnapshot.docs[0].data();
      }
    }

    const sighting: Omit<VehicleSighting, 'id'> = {
      stolenVehicleId,
      reportedBy: {
        userId: currentUser.uid,
        name: userData?.name || userData?.displayName || 'Usuário Anônimo',
        photoURL: userData?.photoURL || userData?.avatar,
      },
      location,
      description,
      timestamp: new Date(),
      isVerified: false,
    };

    const docRef = await addDoc(collection(db, 'vehicle_sightings'), sighting);

    // Atualiza contadores em stolen_cars
    const stolenVehicleDocRef = doc(db, 'stolen_cars', stolenVehicleId);
    const stolenVehicleDoc = await getDoc(stolenVehicleDocRef);

    if (stolenVehicleDoc.exists()) {
      const stolenData = stolenVehicleDoc.data();
      
      await updateDoc(stolenVehicleDocRef, {
        sightingsCount: increment(1),
        lastSeenLocation: {
          ...location,
          timestamp: new Date(),
        },
        updatedAt: new Date(),
      });
      
      // Atualiza também na coleção cars
      const carRef = doc(db, 'cars', stolenData.carId);
      await updateDoc(carRef, {
        lastSeenLocation: {
          ...location,
          timestamp: new Date(),
        },
        updatedAt: new Date(),
      });
      
      // Cria notificação
      const notification: Omit<SightingNotification, 'id'> = {
        vehicleOwnerId: stolenData.userId,
        stolenVehicleId,
        sightingId: docRef.id,
        reportedBy: {
          userId: currentUser.uid,
          name: userData?.name || userData?.displayName || 'Usuário Anônimo',
        },
        message: `Seu veículo foi avistado em ${location.address}`,
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

export async function getCurrentLocation(): Promise<{ 
  latitude: number; 
  longitude: number; 
  address: string;
  accuracy?: number;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permissão de localização negada');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

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
