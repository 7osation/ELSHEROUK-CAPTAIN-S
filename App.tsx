import React, { useState, useMemo } from 'react';
import { AppProvider, initialDrivers, initialRides, initialTariff, usePersistentUser } from './context/AppContext';
import { User, Role } from './types';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import PassengerDashboard from './components/PassengerDashboard';
import Header from './components/Header';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  // Use custom hook for persistent user state
  const { currentUser, setCurrentUser } = usePersistentUser();
  const [showLogin, setShowLogin] = useState(false);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [rides, setRides] = useState(initialRides);
  const [tariff, setTariff] = useState(initialTariff);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(false); // Reset to landing page on logout
  };

  const handleSendMessage = (rideId: string, text: string) => {
    if (!currentUser) return;
    
    setRides(prevRides => prevRides.map(ride => {
      if (ride.id === rideId) {
        return {
          ...ride,
          chatMessages: [
            ...(ride.chatMessages || []),
            {
              id: Date.now().toString(),
              senderId: currentUser.id,
              text,
              timestamp: new Date()
            }
          ]
        };
      }
      return ride;
    }));
  };

  const appContextValue = useMemo(() => ({
    currentUser,
    drivers,
    setDrivers,
    rides,
    setRides,
    tariff,
    setTariff,
    login: handleLogin,
    logout: handleLogout,
    sendMessage: handleSendMessage,
  }), [currentUser, drivers, rides, tariff]);

  const renderDashboard = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case Role.ADMIN:
        return <AdminDashboard />;
      case Role.DRIVER:
        return <DriverDashboard />;
      case Role.PASSENGER:
        return <PassengerDashboard />;
      default:
        return <div>Invalid user role.</div>;
    }
  };

  return (
    <AppProvider value={appContextValue}>
      {!currentUser ? (
        showLogin ? (
          <LoginScreen onBack={() => setShowLogin(false)} />
        ) : (
          <LandingPage onLoginClick={() => setShowLogin(true)} />
        )
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">
            {renderDashboard()}
          </main>
        </div>
      )}
    </AppProvider>
  );
};

export default App;