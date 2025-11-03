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
import { Alert } from 'react-native';
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
          
          sightingsCount: stolenData?.sightingsCount || carData.sightingsCount || 0,
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
            
            sightingsCount: stolenData?.sightingsCount || carData.sightingsCount || 0,
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

/**
 * ✅ NOVO: Busca avistamentos públicos para exibir nos cards
 */
export async function getPublicSightings(stolenVehicleId: string): Promise<{
  count: number;
  descriptions: string[];
}> {
  try {
    console.log(`📊 Buscando avistamentos públicos para ${stolenVehicleId}...`);
    
    // Busca avistamentos do veículo
    const sightingsQuery = query(
      collection(db, 'vehicle_sightings'),
      where('stolenVehicleId', '==', stolenVehicleId),
      orderBy('timestamp', 'desc')
    );
    
    const sightingsSnapshot = await getDocs(sightingsQuery);
    const descriptions: string[] = [];
    
    sightingsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.description && data.description.trim()) {
        descriptions.push(data.description.trim());
      }
    });
    
    return {
      count: sightingsSnapshot.docs.length,
      descriptions: descriptions.slice(0, 3), // Máximo 3 descrições públicas
    };
  } catch (error: any) {
    console.error('❌ Erro ao buscar avistamentos públicos:', error);
    return { count: 0, descriptions: [] };
  }
}

/**
 * ✅ CORRIGIDO: Reporta avistamento com lógica de ID corrigida
 */
export async function reportSighting(
  vehicleId: string, // Este pode ser tanto carId quanto stolenCarId
  location: { latitude: number; longitude: number; address: string },
  description?: string
): Promise<string> {
  try {
    console.log(`📍 Reportando avistamento do veículo ${vehicleId}...`);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Você precisa estar logado para reportar um avistamento');
    }

    // ✅ CORRIGIDO: Busca dados do usuário
    let userData = null;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        userData = userDoc.data();
        console.log(`👤 Dados do usuário encontrados: ${userData?.name || userData?.displayName}`);
      } else {
        console.log(`⚠️ Documento do usuário não encontrado, tentando query...`);
        const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
        const userQuerySnapshot = await getDocs(userQuery);
        
        if (!userQuerySnapshot.empty) {
          userData = userQuerySnapshot.docs[0].data();
          console.log(`👤 Dados do usuário encontrados via query: ${userData?.name || userData?.displayName}`);
        }
      }
    } catch (userError) {
      console.warn('⚠️ Erro ao buscar dados do usuário, continuando sem dados:', userError);
    }

    // ✅ CORRIGIDO: Determina o stolenVehicleId correto
    let stolenVehicleId = vehicleId;
    let stolenData = null;
    let vehicleOwnerId = null;
    
    console.log(`🔍 Determinando ID correto para veículo: ${vehicleId}`);
    
    // Primeiro, tenta encontrar na coleção stolen_cars
    const stolenVehicleDocRef = doc(db, 'stolen_cars', vehicleId);
    const stolenVehicleDoc = await getDoc(stolenVehicleDocRef);

    if (stolenVehicleDoc.exists()) {
      // O ID passado é de stolen_cars
      stolenData = stolenVehicleDoc.data();
      stolenVehicleId = vehicleId;
      vehicleOwnerId = stolenData.userId;
      console.log(`📊 Encontrado stolen_cars direto: ${stolenVehicleId} - Owner: ${vehicleOwnerId}`);
    } else {
      // Se não encontrou, pode ser um carId - busca na stolen_cars por carId
      console.log(`⚠️ Não encontrado em stolen_cars, buscando por carId...`);
      const stolenCarsQuery = query(
        collection(db, 'stolen_cars'),
        where('carId', '==', vehicleId),
        where('isActive', '==', true)
      );
      const stolenCarsSnapshot = await getDocs(stolenCarsQuery);
      
      if (!stolenCarsSnapshot.empty) {
        const stolenDoc = stolenCarsSnapshot.docs[0];
        stolenData = stolenDoc.data();
        stolenVehicleId = stolenDoc.id;
        vehicleOwnerId = stolenData.userId;
        console.log(`📊 Encontrado stolen_cars por carId: ${stolenVehicleId} - Owner: ${vehicleOwnerId}`);
      } else {
        // Se ainda não encontrou, busca diretamente na cars
        console.log(`⚠️ Não encontrado stolen_cars, buscando em cars...`);
        const carRef = doc(db, 'cars', vehicleId);
        const carDoc = await getDoc(carRef);
        
        if (carDoc.exists()) {
          const carData = carDoc.data();
          vehicleOwnerId = carData.userId;
          // Mantém vehicleId como carId se não há stolen_cars
          stolenVehicleId = vehicleId;
          console.log(`📊 Encontrado cars: ${vehicleId} - Owner: ${vehicleOwnerId}`);
        } else {
          throw new Error('Veículo não encontrado');
        }
      }
    }

    if (!vehicleOwnerId) {
      throw new Error('Proprietário do veículo não encontrado');
    }

    // ✅ DEBUG: Adicione antes de criar a notificação
    console.log('🔍 DEBUG - Dados para notificação:', {
      vehicleOwnerId,
      stolenVehicleId,
      currentUserId: currentUser.uid,
      vehicleId,
    });

    // ✅ CORRIGIDO: Cria o avistamento com o ID correto
    const sighting: Omit<VehicleSighting, 'id'> = {
      stolenVehicleId, // ← ID correto determinado acima
      reportedBy: {
        userId: currentUser.uid,
        name: userData?.name || userData?.displayName || currentUser.displayName || 'Usuário Anônimo',
        photoURL: userData?.photoURL || userData?.avatar || currentUser.photoURL,
      },
      location,
      description: description || undefined,
      timestamp: new Date(),
      isVerified: false,
    };

    console.log('📝 Criando documento de avistamento...');
    const docRef = await addDoc(collection(db, 'vehicle_sightings'), sighting);
    console.log(`✅ Avistamento criado com ID: ${docRef.id}`);

    // ✅ CORRIGIDO: Atualiza contadores
    try {
      if (stolenData) {
        console.log(`🔄 Atualizando contadores em stolen_cars: ${stolenVehicleId}...`);
        
        // Atualiza contadores em stolen_cars
        await updateDoc(doc(db, 'stolen_cars', stolenVehicleId), {
          sightingsCount: increment(1),
          lastSeenLocation: {
            ...location,
            timestamp: new Date(),
          },
          updatedAt: new Date(),
        });
        console.log('✅ Contadores atualizados em stolen_cars');
        
        // Atualiza também na coleção cars se existir carId
        if (stolenData.carId) {
          const carRef = doc(db, 'cars', stolenData.carId);
          await updateDoc(carRef, {
            lastSeenLocation: {
              ...location,
              timestamp: new Date(),
            },
            sightingsCount: increment(1),
            updatedAt: new Date(),
          });
          console.log('✅ Localização e contador atualizados em cars');
        }
      } else {
        // Atualiza diretamente no cars se não há stolen_cars
        console.log(`🔄 Atualizando contadores em cars: ${vehicleId}...`);
        const carRef = doc(db, 'cars', vehicleId);
        await updateDoc(carRef, {
          lastSeenLocation: {
            ...location,
            timestamp: new Date(),
          },
          sightingsCount: increment(1),
          updatedAt: new Date(),
        });
        console.log('✅ Contadores atualizados em cars');
      }
    } catch (updateError) {
      console.warn('⚠️ Erro ao atualizar contadores (avistamento ainda foi salvo):', updateError);
    }

    // ✅ CORRIGIDO: Cria notificação para o proprietário
    try {
      console.log(`📬 Criando notificação para o proprietário: ${vehicleOwnerId}`);
      
      const notification: Omit<SightingNotification, 'id'> = {
        vehicleOwnerId, // ← ID correto do proprietário
        stolenVehicleId, // ← ID correto do veículo
        sightingId: docRef.id,
        reportedBy: {
          userId: currentUser.uid,
          name: userData?.name || userData?.displayName || currentUser.displayName || 'Usuário Anônimo',
        },
        message: `Seu veículo foi avistado em ${location.address}`,
        isRead: false,
        createdAt: new Date(),
      };

      console.log('🔍 DEBUG - Notification object:', notification);

      const notificationRef = await addDoc(collection(db, 'sighting_notifications'), notification);
      console.log(`✅ Notificação criada: ${notificationRef.id} para proprietário: ${vehicleOwnerId}`);
    } catch (notificationError) {
      console.error('❌ Erro ao criar notificação:', notificationError);
      // Não falha o avistamento por causa da notificação
    }

    console.log(`🎯 Avistamento reportado com sucesso: ${docRef.id}`);
    return docRef.id;
    
  } catch (error: any) {
    console.error('❌ Erro ao reportar avistamento:', error);
    
    // Mensagens de erro mais específicas
    if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
      throw new Error('Sem permissão para reportar avistamentos. Verifique se você está logado e tente novamente.');
    } else if (error.code === 'network-request-failed') {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    } else if (error.message?.includes('não autenticado')) {
      throw new Error('Você precisa estar logado para reportar um avistamento.');
    } else {
      throw new Error(`Erro ao reportar avistamento: ${error.message || 'Erro desconhecido'}`);
    }
  }
}

/**
 * ✅ CORRIGIDO: Obter localização atual com melhor UX
 */
export async function getCurrentLocation(): Promise<{ 
  latitude: number; 
  longitude: number; 
  address: string;
  accuracy?: number;
}> {
  try {
    console.log('📍 Solicitando permissão de localização...');
    
    // ✅ CORRIGIDO: Mensagem personalizada para permissão
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      // ✅ CORRIGIDO: Alert personalizado em vez de erro genérico
      Alert.alert(
        '📍 Permissão de Localização',
        'Para reportar um avistamento, precisamos acessar sua localização atual. Isso nos ajuda a informar ao proprietário onde o veículo foi visto.\n\nVá em Configurações > Privacidade > Localização e permita o acesso para o TrackCar.',
        [
          { text: 'Mais Tarde', style: 'cancel' },
          { 
            text: 'Abrir Configurações', 
            onPress: () => {
              // No Expo, não temos acesso direto às configurações
              // Mas o usuário pode ir manualmente
            }
          }
        ]
      );
      throw new Error('Permissão de localização é necessária para reportar avistamentos');
    }

    console.log('📍 Obtendo localização atual...');
    
    // ✅ CORRIGIDO: Removido timeout que não existe no tipo LocationOptions
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    console.log(`📍 Localização obtida: ${location.coords.latitude}, ${location.coords.longitude}`);

    // ✅ CORRIGIDO: Melhor tratamento do endereço
    let address = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
    
    try {
      console.log('🗺️ Buscando endereço...');
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const addressParts = [
          addr.streetNumber,
          addr.street,
          addr.district,
          addr.city,
          addr.region
        ].filter(part => part && part.trim() !== '').join(', ');
        
        if (addressParts) {
          address = addressParts;
          console.log(`🗺️ Endereço encontrado: ${address}`);
        }
      }
    } catch (geocodeError) {
      console.warn('⚠️ Erro ao obter endereço, usando coordenadas:', geocodeError);
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
      accuracy: location.coords.accuracy || undefined,
    };
    
  } catch (error: any) {
    console.error('❌ Erro ao obter localização:', error);
    
    // ✅ CORRIGIDO: Mensagens de erro mais específicas para localização
    if (error.message?.includes('Permission')) {
      throw new Error('Permissão de localização é necessária para reportar avistamentos');
    } else if (error.message?.includes('network')) {
      throw new Error('Erro de conexão ao obter localização. Verifique sua internet.');
    } else {
      throw new Error(`Erro ao obter localização: ${error.message || 'Erro desconhecido'}`);
    }
  }
}
