import { useCallback, useEffect, useState } from 'react';
import {
  getStolenVehicles,
  markVehicleAsFound,
  markVehicleAsStolen,
  reportSighting,
  subscribeToStolenVehicles
} from '../services/stolenVehicleService';
import { StolenVehicle } from '../types/stolenVehicle';

export function useStolenVehicles() {
  const [stolenVehicles, setStolenVehicles] = useState<StolenVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ CORRIGIDO: Carrega veículos roubados usando apenas getStolenVehicles
  const loadStolenVehicles = useCallback(async () => {
    try {
      console.log('🔄 Carregando veículos roubados...');
      setIsLoading(true);
      setError(null);
      
      const vehicles = await getStolenVehicles();
      console.log(`✅ Carregados ${vehicles.length} veículos roubados`);
      
      setStolenVehicles(vehicles);
    } catch (error: any) {
      console.error('❌ Erro ao carregar veículos roubados:', error);
      setError(error.message || 'Erro ao carregar veículos roubados');
      setStolenVehicles([]); // Limpa a lista em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ CORRIGIDO: Função de refresh simplificada
  const refreshVehicles = useCallback(async () => {
    try {
      console.log('🔄 Fazendo refresh dos veículos roubados...');
      await loadStolenVehicles();
    } catch (error: any) {
      console.error('❌ Erro no refresh:', error);
      setError(error.message || 'Erro ao atualizar lista');
    }
  }, [loadStolenVehicles]);

  // Reporta avistamento
  const reportVehicleSighting = useCallback(async (
    vehicleId: string,
    location: { latitude: number; longitude: number; address: string },
    description?: string
  ) => {
    try {
      console.log(`📍 Reportando avistamento do veículo ${vehicleId}...`);
      const sightingId = await reportSighting(vehicleId, location, description);
      console.log(`✅ Avistamento reportado: ${sightingId}`);
      
      // Recarrega a lista para atualizar contadores
      await loadStolenVehicles();
      
      return sightingId;
    } catch (error: any) {
      console.error('❌ Erro ao reportar avistamento:', error);
      throw error;
    }
  }, [loadStolenVehicles]);

  // ✅ NOVA: Marca como encontrado
  const markAsFound = useCallback(async (carId: string) => {
    try {
      console.log(`🔍 Marcando veículo ${carId} como encontrado...`);
      await markVehicleAsFound(carId);
      console.log(`✅ Veículo ${carId} marcado como encontrado`);
      
      // Recarrega a lista para remover o veículo
      await loadStolenVehicles();
    } catch (error: any) {
      console.error('❌ Erro ao marcar como encontrado:', error);
      throw error;
    }
  }, [loadStolenVehicles]);

  // ✅ NOVA: Marca como roubado
  const markAsStolen = useCallback(async (
    carId: string, 
    description?: string,
    policeReportNumber?: string
  ) => {
    try {
      console.log(`🚨 Marcando veículo ${carId} como roubado...`);
      const stolenId = await markVehicleAsStolen(carId, description, policeReportNumber);
      console.log(`✅ Veículo ${carId} marcado como roubado: ${stolenId}`);
      
      // Recarrega a lista para incluir o veículo
      await loadStolenVehicles();
      
      return stolenId;
    } catch (error: any) {
      console.error('❌ Erro ao marcar como roubado:', error);
      throw error;
    }
  }, [loadStolenVehicles]);

  // ✅ CORRIGIDO: Effect simplificado
  useEffect(() => {
    console.log('📡 Configurando hook de veículos roubados...');
    
    // Carregamento inicial
    loadStolenVehicles();

    // Configura listener em tempo real
    const unsubscribe = subscribeToStolenVehicles((vehicles) => {
      console.log(`🔄 Recebidos ${vehicles.length} veículos via subscription`);
      setStolenVehicles(vehicles);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      console.log('🔌 Desconectando listener de veículos roubados');
      unsubscribe();
    };
  }, [loadStolenVehicles]);

  return {
    stolenVehicles,
    isLoading,
    error,                    // ✅ NOVO: Estado de erro
    refreshVehicles,
    reportVehicleSighting,
    markAsFound,
    markAsStolen,
    loadStolenVehicles,       // ✅ NOVO: Função de carregamento manual
  };
}
