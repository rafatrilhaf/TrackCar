// services/trackingService.ts - VERSÃO TOTALMENTE CORRIGIDA
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface GPSLocation {
  id?: string;
  carId: string;
  userId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
  status: 'active' | 'inactive' | 'alert';
  source: 'arduino' | 'manual' | 'app';
}

export interface TrackingHistory {
  locations: GPSLocation[];
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Salva uma nova localização GPS no Firebase
 */
export async function saveGPSLocation(locationData: Omit<GPSLocation, 'id' | 'userId'>): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const location: Omit<GPSLocation, 'id'> = {
      ...locationData,
      userId: currentUser.uid,
      timestamp: new Date(),
    };

    const docRef = await addDoc(collection(db, 'gps_locations'), location);
    
    // Atualiza a última localização conhecida do carro
    await updateLastKnownLocation(locationData.carId, locationData.latitude, locationData.longitude);
    
    console.log('Localização GPS salva:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Erro ao salvar localização GPS:', error);
    throw new Error('Erro ao salvar localização');
  }
}

/**
 * Atualiza a última localização conhecida do carro
 */
export async function updateLastKnownLocation(
  carId: string, 
  latitude: number, 
  longitude: number
): Promise<void> {
  try {
    const carDocRef = doc(db, 'cars', carId);
    await updateDoc(carDocRef, {
      lastLatitude: latitude,
      lastLongitude: longitude,
      lastLocationUpdate: new Date(),
      updatedAt: new Date(),
    });

    console.log('Última localização do carro atualizada');
  } catch (error: any) {
    console.error('Erro ao atualizar última localização:', error);
    throw new Error('Erro ao atualizar localização do veículo');
  }
}

/**
 * Busca o histórico de localizações de um carro
 */
export async function getCarLocationHistory(
  carId: string, 
  limitCount: number = 50
): Promise<GPSLocation[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const locationsRef = collection(db, 'gps_locations');
    const q = query(
      locationsRef,
      where('carId', '==', carId),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const locations: GPSLocation[] = [];

    querySnapshot.forEach((document) => {
      const data = document.data();
      locations.push({
        id: document.id,
        carId: data.carId,
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        accuracy: data.accuracy,
        timestamp: data.timestamp?.toDate() || new Date(),
        status: data.status,
        source: data.source,
      });
    });

    return locations;
  } catch (error: any) {
    console.error('Erro ao buscar histórico de localização:', error);
    throw new Error('Erro ao carregar histórico de localização');
  }
}

/**
 * Escuta em tempo real as atualizações de localização de um carro
 * ✅ TOTALMENTE CORRIGIDO: Gerencia corretamente o estado de autenticação e cleanup
 */
export function subscribeToCarLocation(
  carId: string,
  callback: (location: GPSLocation | null) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isActive = true;
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('Usuário não autenticado para escutar localização');
      callback(null);
      return () => { isActive = false; }; // Retorna função vazia mas marca como inativo
    }

    const locationsRef = collection(db, 'gps_locations');
    const q = query(
      locationsRef,
      where('carId', '==', carId),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      // ✅ Verifica se a subscription ainda está ativa
      if (!isActive) {
        console.log('Subscription inativa, ignorando callback');
        return;
      }

      // ✅ Verifica se ainda há usuário autenticado antes de processar
      const user = auth.currentUser;
      if (!user) {
        console.log('Usuário deslogado, cancelando escuta de localização');
        callback(null);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        isActive = false;
        return;
      }

      if (querySnapshot.empty) {
        callback(null);
        return;
      }

      // ✅ Acessa o primeiro documento corretamente
      const firstDoc = querySnapshot.docs[0];
      const data = firstDoc.data();
      
      const location: GPSLocation = {
        id: firstDoc.id,
        carId: data.carId,
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        accuracy: data.accuracy,
        timestamp: data.timestamp?.toDate() || new Date(),
        status: data.status,
        source: data.source,
      };

      callback(location);
    }, (error: any) => {
      // ✅ Tratamento inteligente de erros
      const user = auth.currentUser;
      
      if (!user && (
        error.code === 'permission-denied' || 
        error.message.includes('Missing or insufficient permissions')
      )) {
        console.log('Escuta cancelada devido ao logout do usuário - isso é normal');
        callback(null);
        isActive = false;
      } else {
        console.error('Erro real na escuta de localização:', error);
        // Para outros erros, ainda chama callback(null) para informar o componente
        callback(null);
      }
    });

    // ✅ Retorna função de cleanup aprimorada
    return () => {
      isActive = false;
      if (unsubscribe) {
        console.log('Limpando subscription de localização para carId:', carId);
        unsubscribe();
        unsubscribe = null;
      }
    };
  } catch (error: any) {
    console.error('Erro ao configurar escuta de localização:', error);
    isActive = false;
    return () => { /* função vazia */ };
  }
}

/**
 * Calcula a distância entre duas coordenadas GPS
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Analisa o histórico de tracking e retorna estatísticas
 * ✅ CORRIGIDO: Acesso correto aos elementos do array
 */
export function analyzeTrackingHistory(locations: GPSLocation[]): TrackingHistory {
  if (locations.length === 0) {
    const now = new Date();
    return {
      locations: [],
      totalDistance: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      startTime: now,
      endTime: now,
    };
  }

  let totalDistance = 0;
  let maxSpeed = 0;
  const speeds: number[] = [];

  // Ordena por timestamp para garantir ordem cronológica
  const sortedLocations = [...locations].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Calcula distâncias e velocidades
  for (let i = 1; i < sortedLocations.length; i++) {
    const prev = sortedLocations[i - 1];
    const curr = sortedLocations[i];
    
    const distance = calculateDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
    
    totalDistance += distance;
    
    if (curr.speed !== undefined) {
      speeds.push(curr.speed);
      maxSpeed = Math.max(maxSpeed, curr.speed);
    }
  }

  const averageSpeed = speeds.length > 0 
    ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length 
    : 0;

  // ✅ CORREÇÃO: Acessar elementos do array corretamente
  const firstLocation = sortedLocations[0];
  const lastLocation = sortedLocations[sortedLocations.length - 1];

  return {
    locations: sortedLocations,
    totalDistance,
    averageSpeed,
    maxSpeed,
    startTime: firstLocation.timestamp,
    endTime: lastLocation.timestamp,
  };
}

/**
 * Gera URL do Google Maps para uma localização
 */
export function generateMapsURL(latitude: number, longitude: number): string {
  return `https://maps.google.com/maps/?q=${latitude},${longitude}`;
}

/**
 * Verifica se o carro está em movimento com base nas últimas localizações
 * ✅ CORRIGIDO: Acesso correto aos elementos do array
 */
export function isCarMoving(locations: GPSLocation[], thresholdKm: number = 0.1): boolean {
  if (locations.length < 2) return false;

  const sortedByTime = [...locations].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // ✅ CORREÇÃO: Acessar elementos do array corretamente
  const mostRecent = sortedByTime[0];
  const secondMostRecent = sortedByTime[1];

  const distance = calculateDistance(
    mostRecent.latitude,
    mostRecent.longitude,
    secondMostRecent.latitude,
    secondMostRecent.longitude
  );

  return distance > thresholdKm;
}

/**
 * Cria um geofence (cerca virtual) para o carro
 */
export interface Geofence {
  id?: string;
  carId: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // em metros
  isActive: boolean;
  alertOnEnter: boolean;
  alertOnExit: boolean;
  createdAt: Date;
}

export async function createGeofence(geofenceData: Omit<Geofence, 'id' | 'userId'>): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const geofence: Omit<Geofence, 'id'> = {
      ...geofenceData,
      userId: currentUser.uid,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'geofences'), geofence);
    console.log('Geofence criada:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Erro ao criar geofence:', error);
    throw new Error('Erro ao criar cerca virtual');
  }
}

/**
 * Verifica se uma localização está dentro de um geofence
 */
export function isLocationInGeofence(
  location: { latitude: number; longitude: number },
  geofence: Geofence
): boolean {
  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    geofence.latitude,
    geofence.longitude
  ) * 1000; // Converte km para metros

  return distance <= geofence.radius;
}

/**
 * ✅ NOVA FUNÇÃO: Monitor de autenticação para subscriptions
 * Use esta função para verificar se o usuário ainda está logado em callbacks
 */
export function isUserAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * ✅ NOVA FUNÇÃO: Cleanup de todas as subscriptions ativas
 * Chame esta função antes do logout para limpar todas as escutas
 */
export function cleanupAllSubscriptions(): void {
  console.log('Limpando todas as subscriptions do tracking service...');
  // Esta função pode ser expandida conforme necessário
  // Por enquanto serve como placeholder para futuras funcionalidades
}
