// hooks/useVehicleLocation.ts
import { useEffect, useState } from 'react';
import { Car, CarLocation, CarStatus, VehicleLocationData } from '../types/car';

interface UseVehicleLocationReturn {
  locationData: VehicleLocationData | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  updateStolenStatus: (carId: string, isStolen: boolean) => Promise<void>;
}

export function useVehicleLocation(car: Car | null): UseVehicleLocationReturn {
  const [locationData, setLocationData] = useState<VehicleLocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLocation = async () => {
    if (!car?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Aqui será integrado com a API real
      // const response = await fetch(`/api/vehicles/${car.id}/location`);
      // const data = await response.json();

      // Dados mockados por enquanto
      const mockLocation: CarLocation = {
        latitude: -23.5505 + Math.random() * 0.1,
        longitude: -46.6333 + Math.random() * 0.1,
        timestamp: new Date(),
        accuracy: 5,
        address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200'
      };

      const mockStatus: CarStatus = {
        ignitionState: Math.random() > 0.5 ? 'on' : 'off',
        isOnline: Math.random() > 0.3,
        batteryLevel: Math.floor(Math.random() * 100),
        gsmSignal: Math.floor(Math.random() * 100),
        lastLocationUpdate: new Date(),
        isStolen: false
      };

      setLocationData({
        car,
        location: mockLocation,
        status: mockStatus,
        lastUpdate: new Date()
      });

    } catch (err) {
      setError('Erro ao carregar localização do veículo');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStolenStatus = async (carId: string, isStolen: boolean) => {
    try {
      // Aqui será integrado com a API real
      // await fetch(`/api/vehicles/${carId}/stolen-status`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ isStolen })
      // });

      if (locationData) {
        setLocationData(prev => prev ? {
          ...prev,
          status: { ...prev.status, isStolen }
        } : null);
      }

    } catch (err) {
      throw new Error('Erro ao atualizar status de roubo');
    }
  };

  useEffect(() => {
    if (car) {
      refreshLocation();
    }
  }, [car]);

  return {
    locationData,
    isLoading,
    error,
    refreshLocation,
    updateStolenStatus
  };
}
