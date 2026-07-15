import React from 'react';
import { Circle, Popup } from 'react-leaflet';

export default function GeofenceCircle({ geofence }) {
  if (!geofence || !geofence.is_enabled) return null;

  const colorOptions = {
    color: '#3B82F6',       // Blue outline
    fillColor: '#93C5FD',   // Light blue fill
    fillOpacity: 0.25,
    weight: 2
  };

  return (
    <Circle
      center={[geofence.latitude, geofence.longitude]}
      radius={geofence.radius_meters}
      pathOptions={colorOptions}
    >
      <Popup className="rounded-xl overflow-hidden shadow-md">
        <div className="p-2">
          <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">{geofence.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Radius: {geofence.radius_meters}m</p>
        </div>
      </Popup>
    </Circle>
  );
}
