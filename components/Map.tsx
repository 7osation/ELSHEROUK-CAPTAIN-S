import React, { useEffect, useRef } from 'react';

// Since we're using a CDN, we need to assert the type of the global 'L' object.
declare global {
  var L: any;
}

interface MapProps {
  center: [number, number];
  markerPosition: [number, number];
  destinationPosition?: [number, number];
  zoom: number;
}

const Map: React.FC<MapProps> = ({ center, markerPosition, destinationPosition, zoom }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const destinationLayers = useRef<any[]>([]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      mapRef.current = map;

      markerRef.current = L.marker(markerPosition).addTo(map);
    }
  }, []); // Only runs on initial mount

  useEffect(() => {
    if (mapRef.current) {
      // Update driver position
      markerRef.current.setLatLng(markerPosition);
      
      // Clear previous destination layers
      destinationLayers.current.forEach(layer => mapRef.current.removeLayer(layer));
      destinationLayers.current = [];

      if (destinationPosition) {
        // Add new destination layers
        const destMarker = L.marker(destinationPosition).addTo(mapRef.current);
        const routeLine = L.polyline([markerPosition, destinationPosition], { color: '#3388ff', weight: 5, opacity: 0.8 }).addTo(mapRef.current);
        
        destinationLayers.current.push(destMarker, routeLine);

        // Fit map to show both points
        mapRef.current.fitBounds(L.latLngBounds(markerPosition, destinationPosition), { padding: [50, 50] });
      } else {
        // Center back on the driver if no destination
        mapRef.current.setView(center, zoom);
      }
    }
  }, [center, markerPosition, destinationPosition, zoom]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default Map;
