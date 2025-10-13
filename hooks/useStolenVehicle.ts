// hooks/useStolenVehicles.ts
import { useEffect, useState } from 'react';
import {
    getStolenVehicles,
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
      const vehicles = await getStolenVehicles();
      setStolenVehicles(vehicles);
    } catch (err: any) {
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
    refreshVehicles();
    
    // Subscreve para atualizações em tempo real
    const unsubscribe = subscribeToStolenVehicles((vehicles) => {
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
