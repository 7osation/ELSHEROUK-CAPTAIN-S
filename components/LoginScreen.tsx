import React, { useState } from 'react';
import { useAppContext, initialDrivers, initialPassengers } from '../context/AppContext';
import { Role, User } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

const adminUser: User = { id: 'admin', name: 'Admin', role: Role.ADMIN };

interface LoginScreenProps {
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack }) => {
  const { login } = useAppContext();
  const [selectedDriverId, setSelectedDriverId] = useState(initialDrivers[0].id);
  const [selectedPassengerId, setSelectedPassengerId] = useState(initialPassengers[0].id);

  const handleDriverLogin = () => {
    const driver = initialDrivers.find(d => d.id === selectedDriverId);
    if (driver) {
      login(driver);
    }
  };
  
  const handlePassengerLogin = () => {
    const passenger = initialPassengers.find(p => p.id === selectedPassengerId);
    if (passenger) {
      login(passenger);
    }
  };

  const handleAdminLogin = () => {
    login(adminUser);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 relative">
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </button>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <svg className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">El Sherouk Captain's</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Select a role to continue</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Passenger Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={selectedPassengerId}
                onChange={(e) => setSelectedPassengerId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {initialPassengers.map(passenger => (
                  <option key={passenger.id} value={passenger.id}>{passenger.name}</option>
                ))}
              </select>
              <Button onClick={handlePassengerLogin} className="w-full">Login as Passenger</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Driver Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {initialDrivers.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
              <Button onClick={handleDriverLogin} className="w-full">Login as Driver</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAdminLogin} className="w-full" variant="secondary">Login as Admin</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
