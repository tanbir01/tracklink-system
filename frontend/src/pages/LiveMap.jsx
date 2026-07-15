import React, { useEffect, useState, useRef } from 'react';
import { useDevices } from '../hooks/useDevices';
import { useWebSocket } from '../hooks/useWebSocket';
import { getGeofences } from '../api/geofences';
import MapContainer from '../components/map/MapContainer';
import DeviceMarker from '../components/map/DeviceMarker';
import GeofenceCircle from '../components/map/GeofenceCircle';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Crosshair, Navigation, Battery, RefreshCw, Layers, Radio } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export default function LiveMap() {
  const { devices, loading: devicesLoading, fetchDevices } = useDevices();
  const { lastMessage, deviceLocations: wsLocations } = useWebSocket();
  
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceLocations, setDeviceLocations] = useState({});
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [geofences, setGeofences] = useState([]);
  const [followDevice, setFollowDevice] = useState(true);
  
  const mapRef = useRef(null);

  useEffect(() => {
    const loadGeofences = async () => {
      try {
        const data = await getGeofences();
        setGeofences(data.geofences || []);
      } catch (err) {
        console.error("Failed to load geofences", err);
      }
    };
    loadGeofences();
  }, []);

  // Update selected device's coordinates when locations are updated
  useEffect(() => {
    if (!selectedDeviceId || !followDevice || !mapRef.current) return;

    const loc = wsLocations[selectedDeviceId] || deviceLocations[selectedDeviceId];
    if (loc) {
      mapRef.current.setView([loc.latitude, loc.longitude], mapRef.current.getZoom());
    }
  }, [wsLocations, deviceLocations, selectedDeviceId, followDevice]);

  // Handle incoming websocket status/location updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'location_update') {
      const loc = lastMessage.data;
      setDeviceLocations(prev => ({ ...prev, [loc.device_id]: loc }));
    } else if (lastMessage.type === 'device_status') {
      const stat = lastMessage.data;
      setDeviceStatuses(prev => ({ ...prev, [stat.device_id]: stat }));
    }
  }, [lastMessage]);

  // Set default selected device once loaded
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const handleCenterDevice = () => {
    if (!selectedDeviceId) return;
    const loc = wsLocations[selectedDeviceId] || deviceLocations[selectedDeviceId];
    if (loc && mapRef.current) {
      mapRef.current.setView([loc.latitude, loc.longitude], 15);
    }
  };

  if (devicesLoading) {
    return <LoadingSpinner message="Plotting locations..." fullScreen />;
  }

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const selectedLocation = selectedDevice ? (wsLocations[selectedDevice.id] || deviceLocations[selectedDevice.id]) : null;
  const selectedStatus = selectedDevice ? deviceStatuses[selectedDevice.id] : null;

  // Compute map center
  const activeLocationsList = Object.values({ ...deviceLocations, ...wsLocations });
  const mapCenter = activeLocationsList.length > 0 
    ? [activeLocationsList[0].latitude, activeLocationsList[0].longitude] 
    : [23.8103, 90.4125];

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full rounded-3xl overflow-hidden font-sans border border-slate-200 dark:border-slate-800 shadow-sm">
      
      {/* Leaflet Map */}
      <MapContainer center={mapCenter} zoom={12} mapRef={mapRef}>
        {devices.map(device => {
          const loc = wsLocations[device.id] || deviceLocations[device.id];
          const status = deviceStatuses[device.id];
          return (
            <DeviceMarker 
              key={device.id} 
              device={device} 
              location={loc} 
              status={status} 
            />
          );
        })}
        {geofences.map(fence => (
          <GeofenceCircle key={fence.id} geofence={fence} />
        ))}
      </MapContainer>

      {/* Floating Control Panel Card */}
      <div className="absolute top-4 left-4 z-10 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
        
        {/* Device selector */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold text-slate-400">Select Tracked Unit</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => {
              setSelectedDeviceId(e.target.value);
              setFollowDevice(true);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.model || 'Generic'})</option>
            ))}
          </select>
        </div>

        {/* Selected device detail state */}
        {selectedDevice && (
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-200">{selectedDevice.name}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                selectedDevice.is_online
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
              }`}>
                {selectedDevice.is_online ? 'Online' : 'Offline'}
              </span>
            </div>

            {selectedLocation ? (
              <div className="space-y-2 text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Battery className="w-3.5 h-3.5" /> Battery</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{selectedStatus?.battery_percent ?? 100}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5" /> Speed</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{Math.round((selectedLocation.speed || 0) * 3.6)} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Radio className="w-3.5 h-3.5" /> Connection</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{selectedStatus?.connection_type || 'Cellular'}</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-2">
                  <p className="text-[10px] text-slate-400">Coords: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}</p>
                  <p className="text-[10px] text-slate-400">Last Seen: {formatDateTime(selectedLocation.timestamp)}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 py-2">No location telemetry available yet.</p>
            )}
          </div>
        )}

        {/* Map quick controls */}
        <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            onClick={handleCenterDevice}
            disabled={!selectedLocation}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all shadow-sm shadow-primary-500/10 active:scale-95"
          >
            <Crosshair className="w-3.5 h-3.5" /> Center
          </button>
          <button
            onClick={() => setFollowDevice(!followDevice)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 border ${
              followDevice
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            {followDevice ? 'Following' : 'Follow Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
