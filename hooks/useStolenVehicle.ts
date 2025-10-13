// hooks/useStolenVehicles.ts - VERSÃO CORRIGIDA
import { useEffect, useState } from 'react';
import {
    getStolenVehicles,
    getStolenVehiclesFromCars,
    reportSighting,
    subscribeToStolenVehicles
} from '../services/stolenVehicleService';
import { StolenVehicle } from '../types/stolenVehicle';

interface UseStolenVehiclesReturn {
  stolenVehicles: StolenVehicle[];
  isLoading: boolean;
  error: string | null;
  refreshVehicles: () => Promise<void>;
  reportVehicleSighting: (vehicleId: string, location: any, description?: string) => Promise<void>;
}

export function useStolenVehicles(): UseStolenVehiclesReturn {
  const [stolenVehicles, setStolenVehicles] = useState<StolenVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshVehicles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Iniciando refresh de veículos roubados...');
      
      // Tenta primeiro a coleção stolen_cars
      let vehicles = await getStolenVehicles();
      console.log(`📊 Veículos da coleção stolen_cars: ${vehicles.length}`);
      
      // Se não encontrou nada, tenta pela coleção cars com isStolen=true
      if (vehicles.length === 0) {
        console.log('🔍 Tentando buscar carros marcados como roubados...');
        vehicles = await getStolenVehiclesFromCars();
        console.log(`📊 Veículos encontrados nos carros: ${vehicles.length}`);
      }
      
      setStolenVehicles(vehicles);
      console.log(`✅ Total de veículos carregados: ${vehicles.length}`);
      
      if (vehicles.length > 0) {
        console.log('👥 Primeiros proprietários encontrados:', vehicles.map(v => ({
          id: v.id,
          ownerName: v.ownerName,
          ownerPhone: v.ownerPhone,
          ownerPhotoURL: v.ownerPhotoURL
        })));
      }
    } catch (err: any) {
      console.error('❌ Erro no refresh:', err);
      setError('Erro ao carregar veículos roubados');
    } finally {
      setIsLoading(false);
    }
  };

  const reportVehicleSighting = async (
    vehicleId: string, 
    location: any, 
    description?: string
  ) => {
    try {
      await reportSighting(vehicleId, location, description);
      await refreshVehicles(); // Atualiza a lista
    } catch (err: any) {
      throw new Error('Erro ao reportar avistamento');
    }
  };

  useEffect(() => {
    console.log('🚀 Inicializando useStolenVehicles...');
    refreshVehicles();
    
    // Subscreve para atualizações em tempo real
    const unsubscribe = subscribeToStolenVehicles((vehicles) => {
      console.log(`🔔 Atualização em tempo real: ${vehicles.length} veículos`);
      setStolenVehicles(vehicles);
    });

    return unsubscribe;
  }, []);

  return {
    stolenVehicles,
    isLoading,
    error,
    refreshVehicles,
    reportVehicleSighting,
  };
}
