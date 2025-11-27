import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Driver, DriverStatus, Ride, RideStatus } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import Map from './Map';
import Chat from './Chat';

const DriverDashboard: React.FC = () => {
  const { currentUser, drivers, setDrivers, rides, setRides, tariff, sendMessage } = useAppContext();
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  const currentDriver = drivers.find(d => d.id === currentUser!.id) as Driver;

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setLocationError(null);
      setDrivers(prevDrivers => 
        prevDrivers.map(d => 
          d.id === currentUser!.id 
            ? { ...d, location: { lat: latitude, lng: longitude } } 
            : d
        )
      );
    };

    const handleError = (error: GeolocationPositionError) => {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          setLocationError("Location access denied. Please enable location permissions.");
          break;
        case error.POSITION_UNAVAILABLE:
          setLocationError("Location information is unavailable.");
          break;
        case error.TIMEOUT:
          setLocationError("The request to get user location timed out.");
          break;
        default:
          setLocationError("An unknown error occurred while fetching location.");
          break;
      }
    };

    if (!currentDriver.isBlocked) {
      watchId.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [currentUser, setDrivers, currentDriver.isBlocked]);


  const toggleStatus = () => {
    const newStatus = currentDriver.status === DriverStatus.OFFLINE ? DriverStatus.ONLINE : DriverStatus.OFFLINE;
    setDrivers(drivers.map(d => d.id === currentUser!.id ? { ...d, status: newStatus } : d));
  };
  
  const handleRideAction = (ride: Ride, newStatus: RideStatus) => {
    setRides(prevRides => prevRides.map(r => (r.id === ride.id ? { ...r, status: newStatus } : r)));
  
    if (newStatus === RideStatus.COMPLETED || newStatus === RideStatus.CANCELLED) {
      const isCompleted = newStatus === RideStatus.COMPLETED;
      setDrivers(prevDrivers => prevDrivers.map(d => {
        if (d.id === currentUser!.id) {
          const fare = ride.fare || 0;
          const commission = fare * tariff.commissionRate;
          const earningsUpdate = isCompleted ? fare - commission : 0;
          return { ...d, status: DriverStatus.ONLINE, earnings: d.earnings + earningsUpdate };
        }
        return d;
      }));
      setShowChat(false);
    } else if (newStatus === RideStatus.IN_PROGRESS || newStatus === RideStatus.DRIVER_ARRIVED) {
        setDrivers(prevDrivers => prevDrivers.map(d => (d.id === currentUser!.id ? { ...d, status: DriverStatus.BUSY } : d)));
    }
  };
  
  const handleAcceptRide = (ride: Ride) => {
    setRides(prevRides => prevRides.map(r => 
        r.id === ride.id ? { ...r, status: RideStatus.EN_ROUTE_TO_PICKUP } : r
    ));
    // Driver status is already BUSY from assignment, so no change needed.
  };

  const handleRejectRide = (ride: Ride) => {
    // Revert ride to PENDING and unassign driver
    setRides(prevRides => prevRides.map(r => 
        r.id === ride.id ? { ...r, status: RideStatus.PENDING, driverId: null } : r
    ));
    // Set driver back to ONLINE
    setDrivers(prevDrivers => prevDrivers.map(d => 
        d.id === currentUser!.id ? { ...d, status: DriverStatus.ONLINE } : d
    ));
  };


  const rideRequest = rides.find(r => r.driverId === currentUser!.id && r.status === RideStatus.ASSIGNED);
  const activeRide = rides.find(r => r.driverId === currentUser!.id && [RideStatus.EN_ROUTE_TO_PICKUP, RideStatus.DRIVER_ARRIVED, RideStatus.IN_PROGRESS].includes(r.status));
  
  const statusConfig = {
    [DriverStatus.OFFLINE]: { text: 'Go Online', color: 'bg-green-600 hover:bg-green-700' },
    [DriverStatus.ONLINE]: { text: 'Go Offline', color: 'bg-red-600 hover:bg-red-700' },
    [DriverStatus.BUSY]: { text: 'Busy', color: 'bg-yellow-500', disabled: true },
  };

  if (currentDriver.isBlocked) {
    return (
      <Card className="border-red-500 border bg-red-50 dark:bg-red-900/50">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200">Account Blocked</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 dark:text-red-200">
            Your account has been blocked by an administrator. Please contact support to resolve this issue. You cannot go online or accept rides.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Status</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
              <p className="text-lg">You are <span className="font-bold">{currentDriver.status}</span></p>
              <Button
                onClick={toggleStatus}
                className={`${statusConfig[currentDriver.status].color} text-white`}
                disabled={currentDriver.status === DriverStatus.BUSY || currentDriver.isBlocked}
              >
                {statusConfig[currentDriver.status].text}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {rideRequest && (
            <Card className="border-indigo-500 border-2 bg-indigo-50 dark:bg-indigo-900/50">
                <CardHeader>
                    <CardTitle className="text-indigo-800 dark:text-indigo-200">New Ride Request!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Passenger</p>
                        <p className="font-semibold">{rideRequest.passengerName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">From</p>
                        <p className="font-semibold">{rideRequest.pickupLocation}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">To</p>
                        <p className="font-semibold">{rideRequest.dropoffLocation}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Fare</p>
                        <p className="font-bold text-lg">EGP {rideRequest.fare?.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button onClick={() => handleAcceptRide(rideRequest)} className="w-full bg-green-600 hover:bg-green-700 text-white">Accept</Button>
                        <Button onClick={() => handleRejectRide(rideRequest)} className="w-full bg-red-600 hover:bg-red-700 text-white">Reject</Button>
                    </div>
                </CardContent>
            </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Your Active Ride</CardTitle>
          </CardHeader>
          <CardContent>
            {activeRide ? (
                <div key={activeRide.id} className="space-y-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p className="font-bold text-xl">{activeRide.passengerName}</p>
                    <p className="text-md text-gray-700 dark:text-gray-300 mt-1">
                      <span className="font-semibold">From:</span> {activeRide.pickupLocation}
                    </p>
                    <p className="text-md text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">To:</span> {activeRide.dropoffLocation}
                    </p>
                    
                    {/* Contact Buttons */}
                    <div className="flex space-x-3 mt-4 mb-2">
                      <Button onClick={() => setShowChat(!showChat)} size="sm" variant="secondary" className="flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                         </svg>
                         {showChat ? 'Hide Chat' : 'Chat'}
                         {activeRide.chatMessages && activeRide.chatMessages.filter(m => m.senderId !== currentUser?.id).length > 0 && !showChat && (
                            <span className="ml-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                              {activeRide.chatMessages.filter(m => m.senderId !== currentUser?.id).length}
                            </span>
                         )}
                      </Button>
                       <a 
                          href="tel:01000000000" 
                          className="inline-flex items-center justify-center rounded-md font-semibold text-sm px-4 py-2 bg-green-600 text-white hover:bg-green-700"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                         </svg>
                         Call
                       </a>
                    </div>
                  </div>

                   {/* Chat Component */}
                  {showChat && (
                    <Chat
                      messages={activeRide.chatMessages || []}
                      currentUserId={currentUser!.id}
                      onSendMessage={(text) => sendMessage(activeRide.id, text)}
                      title="Chat with Passenger"
                      recipientName={activeRide.passengerName}
                    />
                  )}

                  <div className="mt-4 flex flex-col space-y-2">
                    {activeRide.status === RideStatus.EN_ROUTE_TO_PICKUP && (
                      <Button onClick={() => handleRideAction(activeRide, RideStatus.DRIVER_ARRIVED)}>I've Arrived at Pickup</Button>
                    )}
                    {activeRide.status === RideStatus.DRIVER_ARRIVED && (
                      <Button onClick={() => handleRideAction(activeRide, RideStatus.IN_PROGRESS)}>Start Ride</Button>
                    )}
                    {activeRide.status === RideStatus.IN_PROGRESS && (
                      <Button onClick={() => handleRideAction(activeRide, RideStatus.COMPLETED)} className="bg-green-600 hover:bg-green-700 text-white">Complete Ride</Button>
                    )}
                  </div>
                </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No active ride. You are ready for requests.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
           <CardHeader>
            <CardTitle>Live Map</CardTitle>
          </CardHeader>
          <CardContent>
            {locationError ? (
              <p className="text-red-500 text-center p-4">{locationError}</p>
            ) : currentDriver.location ? (
              <div className="h-96 w-full rounded-lg overflow-hidden">
                <Map 
                  center={[currentDriver.location.lat, currentDriver.location.lng]} 
                  markerPosition={[currentDriver.location.lat, currentDriver.location.lng]} 
                  destinationPosition={
                    activeRide?.status === RideStatus.EN_ROUTE_TO_PICKUP ? [activeRide.pickupCoords.lat, activeRide.pickupCoords.lng] :
                    activeRide?.status === RideStatus.IN_PROGRESS ? [activeRide.dropoffCoords.lat, activeRide.dropoffCoords.lng] :
                    undefined
                  }
                  zoom={15}
                />
              </div>
            ) : (
               <div className="h-96 w-full flex items-center justify-center">
                 <p className="text-gray-500">Fetching location...</p>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;