// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Car {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  colorHex: string;
  licensePlate: string;
  deviceId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StolenCar {
  id: string;
  carId: string;
  userId: string;
  brand: string;
  model: string;
  color: string;
  colorHex: string;
  licensePlate: string;
  lastKnownLocation: Location;
  reportedAt: Date;
  isRecovered: boolean;
  description?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: Date;
  address?: string;
}

export interface CarLocation {
  id: string;
  carId: string;
  location: Location;
  speed?: number;
  heading?: number;
}
