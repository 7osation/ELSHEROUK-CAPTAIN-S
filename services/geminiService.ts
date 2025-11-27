
import { Driver, Ride, DriverStatus, Tariff } from '../types';

// ============================================================================
// SERVICES: OPEN STREET MAP & LOCAL COMPUTATION
// ============================================================================
// This service uses the free OpenStreetMap (Nominatim) API for real-world data.
// Distance and Fare calculations are performed locally using the Haversine formula.
// ============================================================================

export interface RideDetails {
  distance: number;
  fare: number;
}

export interface RankedDriver {
  driverId: string;
  name: string;
  distanceToPickup: number;
}

export interface PlaceSearchResult {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

// --- Math Utilities ---

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

/**
 * Calculates the distance between two coordinates in Kilometers.
 * Uses the Haversine formula.
 */
const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  
  // Road Factor: Real roads aren't straight lines. We multiply by ~1.3 to account for turns.
  return parseFloat((d * 1.3).toFixed(1)); 
};

// --- Real API Functions (OpenStreetMap) ---

/**
 * Search for places using the free Nominatim API.
 * Bounded to Egypt to ensure relevant results.
 */
export const searchPlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  if (!query || query.length < 3) return [];

  try {
    // We add 'viewbox' to prioritize/bound results to the Cairo/Egypt region roughly
    // &countrycodes=eg limits to Egypt
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=5&addressdetails=1`
    );

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    return data.map((item: any) => ({
      name: item.name || item.display_name.split(',')[0],
      address: item.display_name,
      location: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      },
    }));
  } catch (error) {
    console.error("OSM Search Error:", error);
    return []; // Return empty on failure to prevent crash
  }
};

/**
 * Get the address name from coordinates using Nominatim Reverse Geocoding.
 */
export const getAddressFromCoordinates = async (coords: { lat: number; lng: number }): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`
    );

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    
    // Construct a readable address from parts
    const addr = data.address;
    const mainName = addr.road || addr.suburb || addr.city_district || addr.village || "Unknown Road";
    const city = addr.city || addr.state || "";
    
    return `${mainName}, ${city}`;
  } catch (error) {
    console.error("OSM Reverse Geocoding Error:", error);
    return `Pinned Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
  }
};

// --- Logic Functions ---

export const calculateRideDetails = async (ride: Ride, tariff: Tariff): Promise<RideDetails> => {
  const distance = calculateDistanceKm(
    ride.pickupCoords.lat, 
    ride.pickupCoords.lng, 
    ride.dropoffCoords.lat, 
    ride.dropoffCoords.lng
  );

  // Calculate Fare
  const fare = tariff.baseFare + (distance * tariff.perKmRate);

  return {
    distance,
    fare: parseFloat(fare.toFixed(2))
  };
};

export const getDriverETA = async (
  driverLocation: { lat: number, lng: number },
  pickupLocation: { lat: number, lng: number }
): Promise<number> => {
  const dist = calculateDistanceKm(driverLocation.lat, driverLocation.lng, pickupLocation.lat, pickupLocation.lng);
  const avgSpeedKmH = 30; // Average city speed in Cairo
  const timeHours = dist / avgSpeedKmH;
  const timeMinutes = Math.ceil(timeHours * 60) + 2; // +2 mins buffer for parking/traffic

  return timeMinutes;
};

export const getTariffRecommendation = async (): Promise<Tariff> => {
  // Dynamic pricing based on time of day
  const hour = new Date().getHours();
  const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 19);

  if (isRushHour) {
    return { baseFare: 6.00, perKmRate: 3.00, commissionRate: 0.20 };
  } else {
    return { baseFare: 4.00, perKmRate: 2.00, commissionRate: 0.20 };
  }
};

export const getRankedDriverAssignments = async (ride: Ride, drivers: Driver[]): Promise<RankedDriver[]> => {
  const availableDrivers = drivers.filter(d => d.status === DriverStatus.ONLINE);

  if (availableDrivers.length === 0) {
    return [];
  }

  // Sort drivers by real-time distance calculation
  const ranked = availableDrivers.map(driver => {
    const dist = calculateDistanceKm(
      driver.location.lat,
      driver.location.lng,
      ride.pickupCoords.lat,
      ride.pickupCoords.lng
    );
    return {
      driverId: driver.id,
      name: driver.name,
      distanceToPickup: dist
    };
  });

  return ranked.sort((a, b) => a.distanceToPickup - b.distanceToPickup);
};
