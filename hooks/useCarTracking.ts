// hooks/useCarTracking.ts - Hook para gerenciar tracking do carro
import { useEffect, useState } from 'react';
import { subscribeToIgnitionState } from '../services/carService';
import { GPSLocation, subscribeToCarLocation } from '../services/tkService';
import { Car } from '../types/car';

interface UseCarTrackingReturn {
  currentLocation: GPSLocation | null;
  ignitionState: 'on' | 'off' | 'unknown';
  isOnline: boolean;
  lastUpdate: Date | null;
}

export function useCarTracking(car: Car | null): UseCarTrackingReturn {
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [ignitionState, setIgnitionState] = useState<'on' | 'off' | 'unknown'>(
    car?.ignitionState || 'unknown'
  );
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!car?.id) return;

    // Subscreve para atualizações de localização
    const unsubscribeLocation = subscribeToCarLocation(car.id, (location) => {
      setCurrentLocation(location);
      setIsOnline(!!location);
      
      if (location) {
        setLastUpdate(location.timestamp);
      }
    });

    // Subscreve para atualizações de ignição
    const unsubscribeIgnition = subscribeToIgnitionState(car.id, (state) => {
      setIgnitionState(state.ignitionState);
      
      if (state.lastUpdate) {
        setLastUpdate(state.lastUpdate);
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeIgnition();
    };
  }, [car?.id]);

  return {
    currentLocation,
    ignitionState,
    isOnline,
    lastUpdate,
  };
}
