// types/stolenVehicle.ts
export interface StolenVehicle {
  id: string;
  carId: string;
  userId: string;
  ownerName: string;
  ownerPhone?: string;
  ownerPhotoURL?: string;
  
  // Dados do veículo
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  colorHex: string;
  photoURL?: string;
  description?: string;
  
  // Dados do roubo
  stolenAt: Date;
  lastSeenLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: Date;
  };
  
  // Interações
  sightingsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface VehicleSighting {
  id?: string;
  stolenVehicleId: string;
  reportedBy: {
    userId: string;
    name: string;
    photoURL?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
    accuracy?: number;
  };
  description?: string;
  timestamp: Date;
  isVerified: boolean;
}

export interface SightingNotification {
  id?: string;
  vehicleOwnerId: string;
  stolenVehicleId: string;
  sightingId: string;
  reportedBy: {
    userId: string;
    name: string;
  };
  message: string;
  isRead: boolean;
  createdAt: Date;
}
