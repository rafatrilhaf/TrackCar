// services/stolenVehicleService.ts - VERSÃO CORRIGIDA PARA BUSCAR DADOS DO PROPRIETÁRIO
import * as Location from 'expo-location';
import {
    addDoc,
    collection,
    doc,
    getDoc,
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
 * Busca todos os veículos roubados ativos - VERSÃO CORRIGIDA
 */
export async function getStolenVehicles(): Promise<StolenVehicle[]> {
  try {
    console.log('🔍 Buscando veículos roubados...');
    
    const stolenCarsRef = collection(db, 'stolen_cars');
    const q = query(
      stolenCarsRef,
      where('isActive', '==', true),
      orderBy('stolenAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    console.log(`📊 Encontrados ${querySnapshot.docs.length} veículos roubados na coleção`);
    
    const vehicles: StolenVehicle[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      console.log(`🚗 Processando veículo: ${docSnapshot.id}`, data);
      
      try {
        // CORRIGIDO: Busca o documento do carro diretamente por ID
        const carDocRef = doc(db, 'cars', data.carId);
        const carDoc = await getDoc(carDocRef);
        
        if (carDoc.exists()) {
          const carData = carDoc.data();
          console.log(`✅ Dados do carro encontrados:`, carData);
          
          // CORRIGIDO: Busca o proprietário por documento direto
          const ownerDocRef = doc(db, 'users', data.userId);
          const ownerDoc = await getDoc(ownerDocRef);
          
          let ownerData = null;
          if (ownerDoc.exists()) {
            ownerData = ownerDoc.data();
            console.log(`👤 Dados do proprietário encontrados:`, ownerData);
          } else {
            console.warn(`⚠️ Proprietário não encontrado para userId: ${data.userId}`);
            
            // FALLBACK: Tenta buscar por query se não encontrou pelo documento direto
            const userQuery = query(collection(db, 'users'), where('uid', '==', data.userId));
            const userQuerySnapshot = await getDocs(userQuery);
            
            if (!userQuerySnapshot.empty) {
              ownerData = userQuerySnapshot.docs[0].data();
              console.log(`👤 Proprietário encontrado via query:`, ownerData);
            }
          }
          
          vehicles.push({
            id: docSnapshot.id,
            carId: data.carId,
            userId: data.userId,
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
        } else {
          console.warn(`⚠️ Carro não encontrado para carId: ${data.carId}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar veículo ${docSnapshot.id}:`, error);
      }
    }

    console.log(`🎯 Total de veículos processados com sucesso: ${vehicles.length}`);
    return vehicles;
  } catch (error: any) {
    console.error('❌ Erro ao buscar veículos roubados:', error);
    throw new Error('Erro ao carregar veículos roubados');
  }
}

/**
 * NOVA FUNÇÃO: Busca veículos roubados a partir da coleção cars
 */
export async function getStolenVehiclesFromCars(): Promise<StolenVehicle[]> {
  try {
    console.log('🔍 Buscando carros marcados como roubados...');
    
    const carsRef = collection(db, 'cars');
    const q = query(
      carsRef,
      where('isStolen', '==', true),
      where('isActive', '==', true),
      orderBy('stolenReportedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    console.log(`📊 Encontrados ${querySnapshot.docs.length} carros marcados como roubados`);
    
    const vehicles: StolenVehicle[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const carData = docSnapshot.data();
      console.log(`🚗 Processando carro roubado: ${docSnapshot.id}`, carData);
      
      try {
        // Busca dados do proprietário
        const ownerDocRef = doc(db, 'users', carData.userId);
        const ownerDoc = await getDoc(ownerDocRef);
        
        let ownerData = null;
        if (ownerDoc.exists()) {
          ownerData = ownerDoc.data();
          console.log(`👤 Dados do proprietário encontrados:`, ownerData);
        } else {
          console.warn(`⚠️ Proprietário não encontrado para userId: ${carData.userId}`);
          
          // FALLBACK: Tenta buscar por query
          const userQuery = query(collection(db, 'users'), where('uid', '==', carData.userId));
          const userQuerySnapshot = await getDocs(userQuery);
          
          if (!userQuerySnapshot.empty) {
            ownerData = userQuerySnapshot.docs[0].data();
            console.log(`👤 Proprietário encontrado via query:`, ownerData);
          }
        }
        
        // Verifica se existe registro na coleção stolen_cars
        const stolenCarsQuery = query(
          collection(db, 'stolen_cars'),
          where('carId', '==', docSnapshot.id)
        );
        const stolenCarsSnapshot = await getDocs(stolenCarsQuery);
        
        let stolenData = null;
        if (!stolenCarsSnapshot.empty) {
          stolenData = stolenCarsSnapshot.docs[0].data();
        }
        
        vehicles.push({
          id: stolenCarsSnapshot.empty ? docSnapshot.id : stolenCarsSnapshot.docs[0].id,
          carId: docSnapshot.id,
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
        });
      } catch (error) {
        console.error(`❌ Erro ao processar carro roubado ${docSnapshot.id}:`, error);
      }
    }

    console.log(`🎯 Total de carros roubados encontrados: ${vehicles.length}`);
    return vehicles;
  } catch (error: any) {
    console.error('❌ Erro ao buscar carros roubados:', error);
    throw new Error('Erro ao carregar veículos roubados');
  }
}

/**
 * Reporta avistamento de um veículo roubado - VERSÃO CORRIGIDA
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

    // CORRIGIDO: Busca dados do usuário atual por documento direto
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    let userData = null;
    if (userDoc.exists()) {
      userData = userDoc.data();
    } else {
      // FALLBACK: Tenta buscar por query
      const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      const userQuerySnapshot = await getDocs(userQuery);
      
      if (!userQuerySnapshot.empty) {
        userData = userQuerySnapshot.docs[0].data();
      }
    }

    // Cria o avistamento
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

    // Atualiza contador de avistamentos
    await updateDoc(doc(db, 'stolen_cars', stolenVehicleId), {
      sightingsCount: increment(1),
      lastSeenLocation: {
        ...location,
        timestamp: new Date(),
      },
      updatedAt: new Date(),
    });

    // CORRIGIDO: Busca dados do veículo roubado para notificação
    const stolenVehicleDocRef = doc(db, 'stolen_cars', stolenVehicleId);
    const stolenVehicleDoc = await getDoc(stolenVehicleDocRef);

    if (stolenVehicleDoc.exists()) {
      const stolenData = stolenVehicleDoc.data();
      
      // Cria notificação para o proprietário
      const notification: Omit<SightingNotification, 'id'> = {
        vehicleOwnerId: stolenData.userId,
        stolenVehicleId,
        sightingId: docRef.id,
        reportedBy: {
          userId: currentUser.uid,
          name: userData?.name || userData?.displayName || 'Usuário Anônimo',
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
 * Escuta atualizações de veículos roubados em tempo real - VERSÃO CORRIGIDA
 */
export function subscribeToStolenVehicles(
  callback: (vehicles: StolenVehicle[]) => void
): () => void {
  try {
    console.log('🔄 Iniciando subscription para veículos roubados...');
    
    const stolenCarsRef = collection(db, 'stolen_cars');
    const q = query(
      stolenCarsRef,
      where('isActive', '==', true),
      orderBy('stolenAt', 'desc')
    );

    return onSnapshot(q, async (querySnapshot) => {
      console.log(`🔔 Subscription ativada: ${querySnapshot.docs.length} documentos`);
      const vehicles: StolenVehicle[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        
        try {
          // CORRIGIDO: Busca o carro por documento direto
          const carDocRef = doc(db, 'cars', data.carId);
          const carDoc = await getDoc(carDocRef);
          
          if (carDoc.exists()) {
            const carData = carDoc.data();
            
            // CORRIGIDO: Busca o proprietário por documento direto
            const ownerDocRef = doc(db, 'users', data.userId);
            const ownerDoc = await getDoc(ownerDocRef);
            
            let ownerData = null;
            if (ownerDoc.exists()) {
              ownerData = ownerDoc.data();
            } else {
              // FALLBACK: Tenta buscar por query
              const userQuery = query(collection(db, 'users'), where('uid', '==', data.userId));
              const userQuerySnapshot = await getDocs(userQuery);
              
              if (!userQuerySnapshot.empty) {
                ownerData = userQuerySnapshot.docs[0].data();
              }
            }
            
            vehicles.push({
              id: docSnapshot.id,
              carId: data.carId,
              userId: data.userId,
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
          console.warn('⚠️ Erro ao processar veículo na subscription:', error);
        }
      }

      console.log(`🎯 Subscription processada: ${vehicles.length} veículos válidos`);
      callback(vehicles);
    }, (error) => {
      console.error('❌ Erro na subscription:', error);
    });
  } catch (error: any) {
    console.error('❌ Erro ao configurar listener de veículos roubados:', error);
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
