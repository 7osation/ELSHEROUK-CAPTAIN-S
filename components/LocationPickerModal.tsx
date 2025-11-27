import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/Button';

// Assert the type of the global 'L' object from the CDN
declare global {
  var L: any;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coords: { lat: number, lng: number }) => void;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);

  const defaultCenter: [number, number] = [30.0444, 31.2357]; // Cairo center
  const defaultZoom = 12; // City-level zoom

  useEffect(() => {
    // Initialize map on first open
    if (isOpen && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView(defaultCenter, defaultZoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      map.on('move', () => {
        setSelectedCoords(map.getCenter());
      });
      
      setSelectedCoords(map.getCenter());
      mapRef.current = map;
    }
    
    // Adjust view and size when modal is opened
    if (isOpen && mapRef.current) {
       setTimeout(() => {
        mapRef.current.invalidateSize();
        mapRef.current.setView(defaultCenter, defaultZoom);
       }, 100); // Small delay to ensure modal is rendered
    }

  }, [isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleConfirm = () => {
    if(selectedCoords) {
      onLocationSelect(selectedCoords);
      onClose();
    } else if (mapRef.current) {
      // Fallback in case state hasn't updated from the 'move' event
      onLocationSelect(mapRef.current.getCenter());
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        <h2 className="text-xl font-bold p-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">Choose a location</h2>
        <div className="relative flex-grow">
          <div ref={mapContainerRef} className="h-full w-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-red-600 drop-shadow-lg">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 005.16-4.242 12.082 12.082 0 003.06-7.29A7.5 7.5 0 0012 4.5a7.5 7.5 0 00-7.5 7.5c0 2.703 1.006 5.176 3.06 7.29a16.975 16.975 0 005.16 4.242zM12 12a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm Location</Button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;