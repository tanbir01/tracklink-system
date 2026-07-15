import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Battery, Wifi, Activity } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export default function DeviceMarker({ device, location, status }) {
  if (!location) return null;

  const isOnline = device.is_online;
  const batteryPct = status?.battery_percent ?? 100;
  
  // Decide marker color: green=online, yellow=low battery + online, red=offline
  let color = 'green';
  if (!isOnline) {
    color = 'red';
  } else if (batteryPct <= 20) {
    color = 'orange';
  }

  // Create custom HTML icon using Leaflet DivIcon for premium styling
  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-${color === 'green' ? 'emerald' : color === 'orange' ? 'amber' : 'rose'}-400 opacity-75"></span>
        <div class="relative h-10 w-10 rounded-full border-2 border-white bg-${color === 'green' ? 'emerald' : color === 'orange' ? 'amber' : 'rose'}-500 flex items-center justify-center text-white shadow-lg transform rotate-${Math.round(location.heading || 0)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

  return (
    <Marker position={[location.latitude, location.longitude]} icon={customIcon}>
      <Popup className="custom-popup rounded-2xl overflow-hidden shadow-lg p-0">
        <div className="bg-slate-900 text-white p-4 w-64 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <h4 className="font-bold text-base leading-none text-slate-100">{device.name}</h4>
            <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Battery className="w-3.5 h-3.5" /> Battery</span>
              <span className="font-semibold text-slate-100">{batteryPct}% {status?.is_charging ? '(Charging)' : ''}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Speed</span>
              <span className="font-semibold text-slate-100">{Math.round((location.speed || 0) * 3.6)} km/h</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> Network</span>
              <span className="font-semibold text-slate-100">{status?.connection_type || 'Unknown'}</span>
            </div>

            <div className="border-t border-slate-800 pt-2 mt-2">
              <p className="text-[10px] text-slate-400">Accuracy: {Math.round(location.accuracy || 0)}m</p>
              <p className="text-[10px] text-slate-400">Last Update: {formatDateTime(location.timestamp)}</p>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
