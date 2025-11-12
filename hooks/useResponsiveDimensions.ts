// hooks/useResponsiveDimensions.ts
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { deviceInfo } from '../utils/responsive';

export function useResponsiveDimensions() {
  const [dimensions, setDimensions] = useState(deviceInfo);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      // Atualizar dimensões se necessário
      setDimensions(deviceInfo);
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
}
