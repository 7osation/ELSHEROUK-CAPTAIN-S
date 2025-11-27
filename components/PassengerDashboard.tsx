import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Ride, RideStatus, Tariff } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Spinner } from './ui/Spinner';
import { getAddressFromCoordinates, searchPlaces, PlaceSearchResult, calculateRideDetails, getDriverETA, RideDetails } from '../services/geminiService';
import LocationPickerModal from './LocationPickerModal';
import Chat from './Chat';

const PassengerDashboard: React.FC = () => {
  const { currentUser, rides, setRides, drivers, tariff, sendMessage } = useAppContext();
  const [isRequesting, setIsRequesting] = useState(false);

  // New state for location management
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Search and input state
  const [pickupQuery, setPickupQuery] = useState('');
  const [pickupResults, setPickupResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [showPickupResults, setShowPickupResults] = useState(false);

  const [dropoffQuery, setDropoffQuery] = useState('');
  const [dropoffResults, setDropoffResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingDropoff, setIsSearchingDropoff] = useState(false);
  const [showDropoffResults, setShowDropoffResults] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationTypeToSet, setLocationTypeToSet] = useState<'pickup' | 'dropoff' | null>(null);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState<'pickup' | 'dropoff' | null>(null);
  
  // State for fare calculation
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [isCalculatingFare, setIsCalculatingFare] = useState(false);
  
  // Chat State
  const [openChatRideId, setOpenChatRideId] = useState<string | null>(null);

  const passengerRides = useMemo(() => {
    return rides
      .filter(ride => ride.passengerName === currentUser!.name)
      .sort((a, b) => b.requestTime.getTime() - a.requestTime.getTime());
  }, [rides, currentUser]);

  const hasActiveRide = useMemo(() => {
    return passengerRides.some(ride =>
      [RideStatus.PENDING, RideStatus.ASSIGNED, RideStatus.EN_ROUTE_TO_PICKUP, RideStatus.IN_PROGRESS, RideStatus.DRIVER_ARRIVED].includes(ride.status)
    );
  }, [passengerRides]);

  // Effect to fetch driver ETA for assigned rides
  useEffect(() => {
    passengerRides.forEach(ride => {
      if (ride.status === RideStatus.EN_ROUTE_TO_PICKUP && ride.driverId && ride.eta === undefined) {
        const driver = drivers.find(d => d.id === ride.driverId);
        if (driver) {
          const fetchETA = async () => {
            // Set ETA to null to prevent re-fetching
            setRides(prevRides => prevRides.map(r => r.id === ride.id ? { ...r, eta: null } : r));
            const eta = await getDriverETA(driver.location, ride.pickupCoords);
            setRides(prevRides => prevRides.map(r =>
                r.id === ride.id ? { ...r, eta: eta } : r
            ));
          };
          fetchETA();
        }
      }
    });
  }, [passengerRides, drivers, setRides]);


  const openMapPicker = (type: 'pickup' | 'dropoff') => {
    setLocationTypeToSet(type);
    setIsModalOpen(true);
  };
  
  const fetchAndSetAddress = async (coords: { lat: number, lng: number }, type: 'pickup' | 'dropoff') => {
    setIsFetchingAddress(type);
    if (type === 'pickup') {
      setPickupQuery('');
      setRideDetails(null);
    } else {
      setDropoffQuery('');
      setRideDetails(null);
    }
    
    try {
      const address = await getAddressFromCoordinates(coords);
      if (type === 'pickup') setPickupQuery(address);
      else setDropoffQuery(address);
    } catch (error) {
      console.error("Failed to fetch address", error);
      const fallbackAddress = `Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
      if (type === 'pickup') setPickupQuery(fallbackAddress);
      else setDropoffQuery(fallbackAddress);
    } finally {
      setIsFetchingAddress(null);
    }
  }
  
  const handleLocationSelectFromMap = (coords: { lat: number; lng: number }) => {
    if (locationTypeToSet === 'pickup') {
      setPickupCoords(coords);
      fetchAndSetAddress(coords, 'pickup');
    } else if (locationTypeToSet === 'dropoff') {
      setDropoffCoords(coords);
      fetchAndSetAddress(coords, 'dropoff');
    }
  };


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsFetchingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setPickupCoords(coords);
        fetchAndSetAddress(coords, 'pickup');
        setIsFetchingLocation(false);
      },
      (error) => {
        let message = "An unknown error occurred while fetching location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enable it in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information is currently unavailable.";
        }
        setLocationError(message);
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const debounce = (func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const handleSearch = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) {
      if (type === 'pickup') setPickupResults([]);
      else setDropoffResults([]);
      return;
    }

    if (type === 'pickup') setIsSearchingPickup(true);
    else setIsSearchingDropoff(true);

    const results = await searchPlaces(query);

    if (type === 'pickup') {
      setPickupResults(results);
      setIsSearchingPickup(false);
    } else {
      setDropoffResults(results);
      setIsSearchingDropoff(false);
    }
  };

  const debouncedSearch = useCallback(debounce(handleSearch, 500), []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pickup' | 'dropoff') => {
    const query = e.target.value;
    setRideDetails(null); // Reset fare details if location changes
    if (type === 'pickup') {
      setPickupQuery(query);
      setPickupCoords(null);
      setShowPickupResults(true);
    } else {
      setDropoffQuery(query);
      setDropoffCoords(null);
      setShowDropoffResults(true);
    }
    debouncedSearch(query, type);
  };

  const handleSelectResult = (result: PlaceSearchResult, type: 'pickup' | 'dropoff') => {
    setRideDetails(null);
    if (type === 'pickup') {
      setPickupQuery(result.name);
      setPickupCoords(result.location);
      setPickupResults([]);
      setShowPickupResults(false);
    } else {
      setDropoffQuery(result.name);
      setDropoffCoords(result.location);
      setDropoffResults([]);
      setShowDropoffResults(false);
    }
  };
  
  const handleCalculateFare = async () => {
    if (!pickupCoords || !dropoffCoords || !pickupQuery || !dropoffQuery) {
      alert("Please select valid pickup and dropoff locations first.");
      return;
    }
    setIsCalculatingFare(true);
    setRideDetails(null);
    try {
      const tempRide: Ride = {
        pickupCoords,
        dropoffCoords,
        pickupLocation: pickupQuery,
        dropoffLocation: dropoffQuery,
      } as Ride;
      const details = await calculateRideDetails(tempRide, tariff);
      setRideDetails(details);
    } catch (error) {
      console.error("Failed to calculate fare:", error);
      alert("Could not calculate the fare. Please try again.");
    } finally {
      setIsCalculatingFare(false);
    }
  };

  const handleRequestRide = () => {
    if (!pickupCoords || !dropoffCoords || !pickupQuery || !dropoffQuery || !rideDetails) {
      alert("Please calculate the fare before requesting a ride.");
      return;
    }
    setIsRequesting(true);

    const newRide: Ride = {
      id: `r${Date.now()}`,
      passengerName: currentUser!.name,
      pickupLocation: pickupQuery,
      dropoffLocation: dropoffQuery,
      pickupCoords: pickupCoords,
      dropoffCoords: dropoffCoords,
      status: RideStatus.PENDING,
      driverId: null,
      requestTime: new Date(),
      distance: rideDetails.distance,
      fare: rideDetails.fare,
      chatMessages: [],
    };

    setTimeout(() => {
      setRides(prevRides => [newRide, ...prevRides]);
      setIsRequesting(false);
      setPickupCoords(null);
      setPickupQuery('');
      setDropoffCoords(null);
      setDropoffQuery('');
      setLocationError(null);
      setRideDetails(null);
    }, 1000);
  };
  
  const handleCancelRide = (rideId: string) => {
    setRides(prevRides => prevRides.map(r => 
        r.id === rideId ? { ...r, status: RideStatus.CANCELLED } : r
    ));
  };


  const getStatusColor = (status: RideStatus) => {
    switch (status) {
      case RideStatus.PENDING: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case RideStatus.ASSIGNED: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case RideStatus.EN_ROUTE_TO_PICKUP: return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      case RideStatus.DRIVER_ARRIVED: return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      case RideStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case RideStatus.COMPLETED: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case RideStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Request a Ride</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasActiveRide ? (
                <div className="p-4 text-center bg-gray-100 dark:bg-gray-700 rounded-md">
                  <p className="font-semibold">You have an active ride.</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Please wait for your current ride to complete before requesting a new one.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pickup Location */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Location</label>
                    <div className="relative">
                       <input
                        type="text"
                        placeholder="Enter pickup location"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={isFetchingAddress === 'pickup' ? 'Getting address...' : pickupQuery}
                        onChange={(e) => handleQueryChange(e, 'pickup')}
                        onFocus={() => setShowPickupResults(true)}
                        onBlur={() => setTimeout(() => setShowPickupResults(false), 200)}
                        disabled={isFetchingAddress === 'pickup'}
                      />
                      {showPickupResults && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                           {isSearchingPickup ? (
                            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center"><Spinner /> Searching...</div>
                          ) : pickupResults.length > 0 ? (
                            pickupResults.map((result, index) => (
                              <div key={index} onMouseDown={() => handleSelectResult(result, 'pickup')} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <p className="font-semibold text-sm">{result.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{result.address}</p>
                              </div>
                            ))
                          ) : pickupQuery.length > 2 && !isSearchingPickup ? (
                            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">No results found.</div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Button onClick={() => openMapPicker('pickup')} variant="secondary" size="sm" className="w-full">Choose on Map</Button>
                      <Button onClick={handleGetLocation} disabled={isFetchingLocation} variant="secondary" size="sm" className="w-full">
                        {isFetchingLocation ? <Spinner/> : "Use My Location"}
                      </Button>
                    </div>
                    {locationError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{locationError}</p>}
                  </div>

                  {/* Dropoff Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dropoff Location</label>
                     <div className="relative">
                       <input
                        type="text"
                        placeholder="Enter dropoff destination"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={isFetchingAddress === 'dropoff' ? 'Getting address...' : dropoffQuery}
                        onChange={(e) => handleQueryChange(e, 'dropoff')}
                        onFocus={() => setShowDropoffResults(true)}
                        onBlur={() => setTimeout(() => setShowDropoffResults(false), 200)}
                        disabled={isFetchingAddress === 'dropoff'}
                      />
                      {showDropoffResults && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {isSearchingDropoff ? (
                            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center"><Spinner /> Searching...</div>
                          ) : dropoffResults.length > 0 ? (
                            dropoffResults.map((result, index) => (
                              <div key={index} onMouseDown={() => handleSelectResult(result, 'dropoff')} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <p className="font-semibold text-sm">{result.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{result.address}</p>
                              </div>
                            ))
                          ) : dropoffQuery.length > 2 && !isSearchingDropoff ? (
                            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">No results found.</div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 mt-2">
                       <Button onClick={() => openMapPicker('dropoff')} variant="secondary" size="sm" className="w-full">Choose on Map</Button>
                    </div>
                  </div>

                  {/* Fare and Request Button */}
                  {rideDetails && (
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Estimated Fare</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">EGP {rideDetails.fare.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">({rideDetails.distance} km)</p>
                    </div>
                  )}
                  
                  {!rideDetails ? (
                     <Button 
                        onClick={handleCalculateFare} 
                        disabled={isCalculatingFare || !pickupCoords || !dropoffCoords || !pickupQuery || !dropoffQuery} 
                        className="w-full"
                      >
                        {isCalculatingFare ? <Spinner /> : 'Calculate Fare'}
                      </Button>
                  ) : (
                    <Button 
                      onClick={handleRequestRide} 
                      disabled={isRequesting} 
                      className="w-full"
                    >
                      {isRequesting ? <Spinner /> : 'Confirm Ride Request'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Rides</CardTitle>
            </CardHeader>
            <CardContent>
              {passengerRides.length > 0 ? (
                <ul className="space-y-4">
                  {passengerRides.map(ride => {
                    const driver = drivers.find(d => d.id === ride.driverId);
                    const isEnRoute = ride.status === RideStatus.EN_ROUTE_TO_PICKUP || ride.status === RideStatus.DRIVER_ARRIVED;
                    
                    return (
                      <li key={ride.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-grow">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {ride.pickupLocation} <span className="font-sans font-bold text-indigo-500 mx-2">&rarr;</span> {ride.dropoffLocation}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{ride.requestTime.toLocaleString()}</p>
                            {driver && (
                                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-md">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Driver: <span className="font-semibold">{driver.name}</span> ({driver.vehicle})
                                      </p>
                                      {ride.status === RideStatus.ASSIGNED && (
                                         <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mt-1">
                                            Waiting for driver to accept...
                                        </p>
                                      )}
                                       {ride.status === RideStatus.EN_ROUTE_TO_PICKUP && (
                                         <p className="text-sm text-cyan-600 dark:text-cyan-400 font-semibold mt-1">
                                            Your driver is on the way! {ride.eta && `Arriving in ~${ride.eta} min`}
                                        </p>
                                      )}
                                      {ride.status === RideStatus.DRIVER_ARRIVED && (
                                          <p className="text-sm text-teal-600 dark:text-teal-400 font-semibold mt-1">Your driver has arrived!</p>
                                      )}
                                    </div>
                                    
                                    {/* Chat and Call Buttons */}
                                    {isEnRoute && (
                                      <div className="flex space-x-2">
                                        <a href={`tel:${driver.phoneNumber || '#'}`} className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors" title="Call Driver">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                          </svg>
                                        </a>
                                        <button 
                                          onClick={() => setOpenChatRideId(openChatRideId === ride.id ? null : ride.id)} 
                                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors relative" 
                                          title="Chat with Driver"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                          </svg>
                                          {ride.chatMessages && ride.chatMessages.length > 0 && (
                                            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                                              {ride.chatMessages.filter(m => m.senderId !== currentUser?.id).length}
                                            </span>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Chat Window */}
                                  {openChatRideId === ride.id && isEnRoute && (
                                    <div className="mt-4">
                                      <Chat
                                        messages={ride.chatMessages || []}
                                        currentUserId={currentUser!.id}
                                        onSendMessage={(text) => sendMessage(ride.id, text)}
                                        title="Chat with Captain"
                                        recipientName={driver.name}
                                        recipientPhone={driver.phoneNumber}
                                        onClose={() => setOpenChatRideId(null)}
                                      />
                                    </div>
                                  )}
                                </div>
                            )}
                          </div>
                          <div className="mt-3 sm:mt-0 flex-shrink-0 flex flex-col items-end space-y-2">
                            {ride.fare != null && (
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                EGP {ride.fare.toFixed(2)}
                                </p>
                            )}
                            <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(ride.status)}>{ride.status}</Badge>
                                {ride.status === RideStatus.PENDING && (
                                <Button size="sm" variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900" onClick={() => handleCancelRide(ride.id)}>Cancel</Button>
                                )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">You haven't requested any rides yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <LocationPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLocationSelect={handleLocationSelectFromMap}
      />
    </>
  );
};

export default PassengerDashboard;