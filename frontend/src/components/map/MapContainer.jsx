import React, { useEffect, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapProvider } from './MapProvider';

// Fix default marker icon issues in Leaflet + Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapContainer({ center = [23.8103, 90.4125], zoom = 12, children, mapRef }) {
  const { provider } = useMapProvider();
  const internalMapRef = useRef(null);

  useEffect(() => {
    if (mapRef && internalMapRef.current) {
      mapRef.current = internalMapRef.current;
    }
  }, [mapRef, internalMapRef]);

  if (provider === 'googlemaps') {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-center p-6">
          <h4 className="font-bold text-slate-800 dark:text-white mb-2">Google Maps Enabled</h4>
          <p className="text-sm text-slate-400">Google Maps support is defined for future modular activation. OpenStreetMap is active by default.</p>
        </div>
      </div>
    );
  }

  // OpenStreetMap Default Map Container
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative">
      <LeafletMap
        center={center}
        zoom={zoom}
        zoomControl={false}
        className="h-full w-full z-0"
        ref={internalMapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // We can use a dark-themed tile provider for dark mode if desired, e.g., CartoDB.DarkMatter:
          // url={document.documentElement.classList.contains('dark') 
          //   ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          //   : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />
        <ZoomControl position="bottomright" />
        {children}
      </LeafletMap>
    </div>
  );
}
