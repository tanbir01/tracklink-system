import React from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatDateTime } from '../../utils/formatters';

export default function RoutePolyline({ locations }) {
  if (!locations || locations.length === 0) return null;

  const positions = locations.map(loc => [loc.latitude, loc.longitude]);

  // Style options for route trail line
  const polylineOptions = {
    color: '#3B82F6',
    weight: 4,
    opacity: 0.8,
    lineJoin: 'round',
    dashArray: '10, 5'  // Dashed lines look professional
  };

  // Start & End marker icons
  const startIcon = L.divIcon({
    className: 'start-marker-icon',
    html: `
      <div class="h-6 w-6 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md">
        S
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const endIcon = L.divIcon({
    className: 'end-marker-icon',
    html: `
      <div class="h-6 w-6 rounded-full border-2 border-white bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md animate-pulse">
        E
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const startLoc = locations[0];
  const endLoc = locations[locations.length - 1];

  return (
    <>
      {/* Draw route line */}
      <Polyline positions={positions} pathOptions={polylineOptions} />

      {/* Start Marker */}
      <Marker position={[startLoc.latitude, startLoc.longitude]} icon={startIcon}>
        <Popup>
          <div className="p-1">
            <h5 className="font-bold text-xs text-slate-800">Trip Start</h5>
            <p className="text-[10px] text-slate-500">{formatDateTime(startLoc.timestamp)}</p>
          </div>
        </Popup>
      </Marker>

      {/* End Marker */}
      <Marker position={[endLoc.latitude, endLoc.longitude]} icon={endIcon}>
        <Popup>
          <div className="p-1">
            <h5 className="font-bold text-xs text-slate-800">Trip End / Latest</h5>
            <p className="text-[10px] text-slate-500">{formatDateTime(endLoc.timestamp)}</p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
