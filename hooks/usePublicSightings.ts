import { useCallback, useEffect, useState } from 'react';
import { getPublicSightings } from '../services/stolenVehicleService';

export function usePublicSightings(stolenVehicleId: string) {
  const [sightings, setSightings] = useState<{
    count: number;
    descriptions: string[];
  }>({ count: 0, descriptions: [] });
  const [isLoading, setIsLoading] = useState(false);

  const loadSightings = useCallback(async () => {
    if (!stolenVehicleId) return;
    
    try {
      setIsLoading(true);
      const data = await getPublicSightings(stolenVehicleId);
      setSightings(data);
    } catch (error) {
      console.error('Erro ao carregar avistamentos públicos:', error);
      setSightings({ count: 0, descriptions: [] });
    } finally {
      setIsLoading(false);
    }
  }, [stolenVehicleId]);

  useEffect(() => {
    loadSightings();
  }, [loadSightings]);

  return {
    sightings,
    isLoading,
    refresh: loadSightings,
  };
}
