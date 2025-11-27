import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Driver, Ride, Role, DriverStatus, RideStatus, Tariff } from '../types';

interface AppContextType {
  currentUser: User | null;
  drivers: Driver[];
  rides: Ride[];
  tariff: Tariff;
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  setRides: React.Dispatch<React.SetStateAction<Ride[]>>;
  setTariff: React.Dispatch<React.SetStateAction<Tariff>>;
  login: (user: User) => void;
  logout: () => void;
  sendMessage: (rideId: string, text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Coordinates are now centered around Cairo, Egypt.
export const initialDrivers: Driver[] = [
  { id: 'd1', name: 'John Doe', role: Role.DRIVER, status: DriverStatus.OFFLINE, location: { lat: 30.0626, lng: 31.2263 }, vehicle: 'Toyota Prius', earnings: 8.30, isBlocked: false, phoneNumber: '+201000000001' }, // Zamalek
  { id: 'd2', name: 'Jane Smith', role: Role.DRIVER, status: DriverStatus.OFFLINE, location: { lat: 30.0444, lng: 31.2357 }, vehicle: 'Honda Civic', earnings: 0, isBlocked: false, phoneNumber: '+201000000002' }, // Tahrir Square
  { id: 'd3', name: 'Sam Wilson', role: Role.DRIVER, status: DriverStatus.OFFLINE, location: { lat: 29.9753, lng: 31.2403 }, vehicle: 'Ford Fusion', earnings: 0, isBlocked: true, phoneNumber: '+201000000003' }, // Maadi
];

export const initialPassengers: User[] = [
  { id: 'p1', name: 'Karim', role: Role.PASSENGER, phoneNumber: '+201200000001' },
  { id: 'p2', name: 'Layla', role: Role.PASSENGER, phoneNumber: '+201200000002' },
];

export const initialRides: Ride[] = [
  { id: 'r1', passengerName: 'Hossam', pickupLocation: 'AUC Tahrir Square', dropoffLocation: 'Khan el-Khalili', pickupCoords: { lat: 30.0449, lng: 31.2360 }, dropoffCoords: { lat: 30.0478, lng: 31.2623 }, status: RideStatus.PENDING, driverId: null, requestTime: new Date(), chatMessages: [] },
  { id: 'r2', passengerName: 'Fatima', pickupLocation: 'Cairo Tower', dropoffLocation: 'City Stars Mall', pickupCoords: { lat: 30.0459, lng: 31.2243 }, dropoffCoords: { lat: 30.0732, lng: 31.3413 }, status: RideStatus.PENDING, driverId: null, requestTime: new Date(Date.now() - 5 * 60000), chatMessages: [] },
  { id: 'r3', passengerName: 'Ali', pickupLocation: 'Maadi Grand Mall', dropoffLocation: 'Cairo Festival City Mall', pickupCoords: { lat: 29.9622, lng: 31.2497 }, dropoffCoords: { lat: 30.0271, lng: 31.4085 }, status: RideStatus.COMPLETED, driverId: 'd1', requestTime: new Date(Date.now() - 2 * 60 * 60000), distance: 18.5, fare: 30.75, chatMessages: [] },
];

export const initialTariff: Tariff = {
  baseFare: 2.00,
  perKmRate: 1.50,
  commissionRate: 0.20, // 20% commission
};

export const AppProvider = AppContext.Provider;

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppContextProvider: React.FC<{ children: React.ReactNode, value: Omit<AppContextType, 'currentUser' | 'login' | 'logout'> & { login: (u: User) => void, logout: () => void, currentUser: User | null } }> = ({ children, value }) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook to manage persistent user state
export const usePersistentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('rideShareUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from local storage", error);
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rideShareUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('rideShareUser');
    }
  }, [currentUser]);

  return { currentUser, setCurrentUser };
};
