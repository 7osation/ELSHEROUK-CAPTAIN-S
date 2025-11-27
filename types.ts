export enum Role {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER',
}

export enum DriverStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
}

export enum RideStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE_TO_PICKUP = 'EN_ROUTE_TO_PICKUP',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  phoneNumber?: string;
}

export interface Driver extends User {
  role: Role.DRIVER;
  status: DriverStatus;
  location: {
    lat: number;
    lng: number;
  };
  vehicle: string;
  earnings: number;
  isBlocked: boolean;
}

export interface Ride {
  id: string;
  passengerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupCoords: { lat: number; lng: number };
  dropoffCoords: { lat: number; lng: number };
  status: RideStatus;
  driverId: string | null;
  requestTime: Date;
  distance?: number; // in km
  fare?: number; // in currency
  eta?: number; // ETA in minutes for driver arrival
  chatMessages: ChatMessage[];
}

export interface Tariff {
  baseFare: number;
  perKmRate: number;
  commissionRate: number; // e.g., 0.20 for 20%
}