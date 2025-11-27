import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Ride, RideStatus, DriverStatus, Tariff } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { getRankedDriverAssignments, calculateRideDetails, getTariffRecommendation, RideDetails, RankedDriver } from '../services/geminiService';

interface AssignmentModalState {
  ride: Ride;
  rankedDrivers: RankedDriver[];
}

const AdminDashboard: React.FC = () => {
  const { drivers, rides, setRides, setDrivers, tariff, setTariff } = useAppContext();
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});
  const [assignmentModal, setAssignmentModal] = useState<AssignmentModalState | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isRecommendingTariff, setIsRecommendingTariff] = useState(false);
  const [newTariff, setNewTariff] = useState<Tariff>(tariff);

  useEffect(() => {
    rides.forEach(ride => {
      if (ride.status === RideStatus.PENDING && !ride.distance) {
        handleCalculateDetails(ride.id);
      }
    });
  }, [rides]);

  useEffect(() => {
    setNewTariff(tariff);
  }, [tariff]);

  const handleCalculateDetails = async (rideId: string) => {
    const ride = rides.find(r => r.id === rideId);
    if (!ride) return;

    setLoadingState(prev => ({ ...prev, [`details-${rideId}`]: true }));
    try {
      const details: RideDetails = await calculateRideDetails(ride, tariff);
      setRides(prevRides => prevRides.map(r => 
        r.id === rideId ? { ...r, distance: details.distance, fare: details.fare } : r
      ));
    } catch (error) {
      console.error("Failed to calculate ride details:", error);
    } finally {
      setLoadingState(prev => ({ ...prev, [`details-${rideId}`]: false }));
    }
  };
  
  const openAssignmentModal = async (ride: Ride) => {
    setLoadingState(prev => ({ ...prev, [`assign-${ride.id}`]: true }));
    try {
      const rankedDrivers = await getRankedDriverAssignments(ride, drivers);
      if (rankedDrivers.length > 0) {
        setAssignmentModal({ ride, rankedDrivers });
        setSelectedDriverId(rankedDrivers[0].driverId); // Pre-select the best option
      } else {
        alert("No drivers are currently online and available.");
      }
    } catch (error) {
       console.error("Failed to get driver rankings:", error);
       alert("Could not retrieve driver rankings. Please try again.");
    } finally {
      setLoadingState(prev => ({ ...prev, [`assign-${ride.id}`]: false }));
    }
  };

  const handleConfirmAssignment = () => {
    if (!assignmentModal || !selectedDriverId) return;
    
    const { ride } = assignmentModal;

    setRides(prevRides => prevRides.map(r => 
      r.id === ride.id ? { ...r, status: RideStatus.ASSIGNED, driverId: selectedDriverId } : r
    ));

    setDrivers(prevDrivers => prevDrivers.map(d => 
      d.id === selectedDriverId ? { ...d, status: DriverStatus.BUSY } : d
    ));

    closeAssignmentModal();
  };
  
  const closeAssignmentModal = () => {
    setAssignmentModal(null);
    setSelectedDriverId(null);
  };
  
  const handleGetTariffRecommendation = async () => {
    setIsRecommendingTariff(true);
    try {
      const recommendedTariff = await getTariffRecommendation();
      setNewTariff(prev => ({ ...prev, baseFare: recommendedTariff.baseFare, perKmRate: recommendedTariff.perKmRate }));
    } catch (error) {
      console.error("Failed to get tariff recommendation:", error);
      alert("Could not retrieve a tariff recommendation. Please try again.");
    } finally {
      setIsRecommendingTariff(false);
    }
  };

  const handleUpdateTariff = () => {
    if (newTariff.baseFare > 0 && newTariff.perKmRate > 0 && newTariff.commissionRate >= 0 && newTariff.commissionRate <= 1) {
      setTariff(newTariff);
      
      setRides(prevRides =>
        prevRides.map(ride => {
          if ((ride.status === RideStatus.PENDING || ride.status === RideStatus.ASSIGNED) && typeof ride.distance === 'number') {
            const newFare = newTariff.baseFare + ride.distance * newTariff.perKmRate;
            return { ...ride, fare: newFare };
          }
          return ride;
        })
      );

      alert("Tariff updated successfully! Fares for active rides have been recalculated.");
    } else {
      alert("Please enter valid positive numbers for fares and a commission rate between 0 and 100%.");
    }
  };
  
  const handleToggleBlock = (driverId: string) => {
    setDrivers(prevDrivers => prevDrivers.map(d => 
      d.id === driverId ? { ...d, isBlocked: !d.isBlocked } : d
    ));
  };


  const getStatusColor = (status: DriverStatus | RideStatus) => {
    switch (status) {
      case DriverStatus.ONLINE: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case DriverStatus.OFFLINE: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case DriverStatus.BUSY: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case RideStatus.PENDING: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case RideStatus.ASSIGNED: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case RideStatus.EN_ROUTE_TO_PICKUP: return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      case RideStatus.DRIVER_ARRIVED: return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      case RideStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case RideStatus.COMPLETED: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case RideStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Tariff Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <label htmlFor="baseFare" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Fare (EGP)</label>
                  <input
                    type="number"
                    id="baseFare"
                    step="0.01"
                    min="0"
                    value={newTariff.baseFare}
                    onChange={(e) => setNewTariff({ ...newTariff, baseFare: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="perKmRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rate per km (EGP)</label>
                  <input
                    type="number"
                    id="perKmRate"
                    step="0.01"
                    min="0"
                    value={newTariff.perKmRate}
                    onChange={(e) => setNewTariff({ ...newTariff, perKmRate: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                 <div>
                  <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Commission Rate (%)</label>
                  <input
                    type="number"
                    id="commissionRate"
                    step="1"
                    min="0"
                    max="100"
                    value={newTariff.commissionRate * 100}
                    onChange={(e) => setNewTariff({ ...newTariff, commissionRate: (parseFloat(e.target.value) || 0) / 100 })}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleGetTariffRecommendation} disabled={isRecommendingTariff} variant="secondary" className="w-full">
                  {isRecommendingTariff ? <Spinner /> : 'Get Recommendation'}
                </Button>
                <Button onClick={handleUpdateTariff} className="w-full">Update Tariff</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {drivers.map(driver => (
                  <li key={driver.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{driver.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{driver.vehicle}</p>
                      </div>
                       <Badge className={driver.isBlocked ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : getStatusColor(driver.status)}>
                        {driver.isBlocked ? 'BLOCKED' : driver.status}
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm space-y-2">
                       <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Total Earnings:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">EGP {driver.earnings.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Amount Owed ({tariff.commissionRate * 100}%):</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">EGP {(driver.earnings * tariff.commissionRate).toFixed(2)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className={`w-full mt-4 ${driver.isBlocked ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'}`}
                      onClick={() => handleToggleBlock(driver.id)}
                    >
                      {driver.isBlocked ? 'Unblock Driver' : 'Block Driver'}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ride Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {rides.map(ride => (
                  <li key={ride.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-grow">
                        <p className="font-bold text-lg">{ride.passengerName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {ride.pickupLocation} <span className="font-sans font-bold text-indigo-500 mx-2">&rarr;</span> {ride.dropoffLocation}
                        </p>
                        <div className="text-sm text-gray-500 mt-2 flex items-center space-x-4">
                          {loadingState[`details-${ride.id}`] ? <Spinner /> : ride.distance ? (
                            <>
                              <span>Dist: <strong>{ride.distance} km</strong></span>
                              <span>Fare: <strong>EGP {ride.fare?.toFixed(2)}</strong></span>
                            </>
                          ) : null }
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 flex-shrink-0 flex items-center space-x-4">
                        <Badge className={getStatusColor(ride.status)}>{ride.status}</Badge>
                        {ride.status === RideStatus.PENDING && (
                          <Button size="sm" onClick={() => openAssignmentModal(ride)} disabled={loadingState[`assign-${ride.id}`] || !ride.distance}>
                            {loadingState[`assign-${ride.id}`] ? <Spinner /> : 'Assign'}
                          </Button>
                        )}
                      </div>
                    </div>
                     {ride.driverId && <p className="text-sm mt-2 text-gray-500 dark:text-gray-300">Driver: {drivers.find(d => d.id === ride.driverId)?.name}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {assignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Assign Driver for {assignmentModal.ride.passengerName}'s Ride</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select a driver below. The list is ranked by proximity to the pickup location.</p>
              <div className="space-y-2">
                {assignmentModal.rankedDrivers.map((driver, index) => (
                  <label key={driver.driverId} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${selectedDriverId === driver.driverId ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/50 dark:border-indigo-500' : 'bg-gray-50 dark:bg-gray-700'}`}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="driver-assignment"
                        value={driver.driverId}
                        checked={selectedDriverId === driver.driverId}
                        onChange={() => setSelectedDriverId(driver.driverId)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3">
                        <span className="font-semibold text-gray-900 dark:text-white">{driver.name}</span>
                        {index === 0 && <Badge className="ml-2 bg-green-100 text-green-800">Recommended</Badge>}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{driver.distanceToPickup} km away</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={closeAssignmentModal}>Cancel</Button>
                <Button onClick={handleConfirmAssignment}>Confirm Assignment</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
