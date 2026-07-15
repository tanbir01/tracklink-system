import React, { useEffect, useState, useRef } from 'react';
import { useDevices } from '../hooks/useDevices';
import { getLocationHistory, exportLocationHistory } from '../api/locations';
import MapContainer from '../components/map/MapContainer';
import RoutePolyline from '../components/map/RoutePolyline';
import DateFilter from '../components/common/DateFilter';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Play, Pause, RotateCcw, Download, Navigation, MapPin, FastForward, Info, Compass } from 'lucide-react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';


// Calculate distance between coords in meters
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in meters
};

export default function LocationHistory() {
  const { devices, loading: devicesLoading } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [locations, setLocations] = useState([]);
  const [totalLocations, setTotalLocations] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterRange, setFilterRange] = useState({ start: new Date(new Date().setHours(0,0,0,0)), end: new Date() });

  // Playback state
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(400); // ms delay

  // Telemetry Stats
  const [stats, setStats] = useState({ distance: 0, avgSpeed: 0, maxSpeed: 0, totalStops: 0 });

  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  // Set default selected device
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  // Load history data when selected device or filters change
  const loadHistory = async () => {
    if (!selectedDeviceId) return;
    try {
      setLoadingHistory(true);
      setIsReplaying(false);
      setReplayIndex(0);

      const params = {
        start_time: filterRange.start.toISOString(),
        end_time: filterRange.end.toISOString(),
        limit: 5000 // Load sufficient history for paths
      };

      const data = await getLocationHistory(selectedDeviceId, params);
      const sorted = (data.locations || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setLocations(sorted);
      setTotalLocations(data.total || 0);

      // Compute statistics
      if (sorted.length > 0) {
        let distance = 0;
        let speedSum = 0;
        let maxSpeed = 0;
        let stops = 0;

        for (let i = 0; i < sorted.length; i++) {
          const current = sorted[i];
          const speedKmh = (current.speed || 0) * 3.6;
          speedSum += speedKmh;
          if (speedKmh > maxSpeed) maxSpeed = speedKmh;
          if (speedKmh <= 0.5) stops += 1;

          if (i > 0) {
            const prev = sorted[i - 1];
            distance += getDistance(prev.latitude, prev.longitude, current.latitude, current.longitude);
          }
        }

        setStats({
          distance: distance / 1000, // in km
          avgSpeed: speedSum / sorted.length,
          maxSpeed,
          totalStops: stops
        });
      } else {
        setStats({ distance: 0, avgSpeed: 0, maxSpeed: 0, totalStops: 0 });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedDeviceId, filterRange]);

  // Replay animation effect
  useEffect(() => {
    if (isReplaying) {
      intervalRef.current = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= locations.length - 1) {
            setIsReplaying(false);
            return prev;
          }
          const next = prev + 1;
          // Pan map to keep replay marker centered
          if (mapRef.current) {
            const nextLoc = locations[next];
            mapRef.current.setView([nextLoc.latitude, nextLoc.longitude], mapRef.current.getZoom());
          }
          return next;
        });
      }, playbackSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isReplaying, locations, playbackSpeed]);

  const handleExportCSV = async () => {
    if (!selectedDeviceId) return;
    try {
      const data = await exportLocationHistory(selectedDeviceId, {
        start_time: filterRange.start.toISOString(),
        end_time: filterRange.end.toISOString()
      });
      // Download blob
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `history_${selectedDeviceId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export location history.");
    }
  };

  if (devicesLoading) {
    return <LoadingSpinner message="Locating tracking nodes..." fullScreen />;
  }

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const currentReplayPoint = locations[replayIndex];

  // Replay marker custom icon
  const replayIcon = L.divIcon({
    className: 'replay-marker-icon',
    html: `
      <div class="relative h-8 w-8 rounded-full border-2 border-white bg-primary-500 flex items-center justify-center text-white shadow-lg transform rotate-${Math.round(currentReplayPoint?.heading || 0)}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const mapCenter = locations.length > 0 
    ? [locations[0].latitude, locations[0].longitude] 
    : [23.8103, 90.4125];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title & CSV Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Location History</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review, replay, and audit device movement logs.</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={locations.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download className="w-4 h-4" /> Export CSV Logs
        </button>
      </div>

      {/* Selector & Filters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold text-slate-400">Select Tracker Device</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
          >
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.model || 'Generic'})</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <DateFilter onChange={setFilterRange} />
        </div>
      </div>

      {/* Stats Summary Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Distance Covered</span>
          <span className="font-black text-2xl text-slate-800 dark:text-white mt-2 block">
            {stats.distance.toFixed(2)} km
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Average Speed</span>
          <span className="font-black text-2xl text-slate-800 dark:text-white mt-2 block">
            {Math.round(stats.avgSpeed)} km/h
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Max Velocity</span>
          <span className="font-black text-2xl text-slate-800 dark:text-white mt-2 block">
            {Math.round(stats.maxSpeed)} km/h
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none">Log Counts / Stops</span>
          <span className="font-black text-2xl text-slate-800 dark:text-white mt-2 block">
            {totalLocations} / {stats.totalStops}
          </span>
        </div>
      </div>

      {/* Map and Replay Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map view */}
        <div className="lg:col-span-2 flex flex-col h-[450px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Historical Route Visualization</h3>
          <div className="flex-1 rounded-2xl overflow-hidden min-h-0 relative">
            {loadingHistory ? (
              <LoadingSpinner message="Mapping history logs..." />
            ) : locations.length > 0 ? (
              <MapContainer center={mapCenter} zoom={14} mapRef={mapRef}>
                <RoutePolyline locations={locations} />
                
                {/* Replay marker */}
                {currentReplayPoint && (
                  <Marker position={[currentReplayPoint.latitude, currentReplayPoint.longitude]} icon={replayIcon}>
                    <Popup>
                      <div className="p-1 text-xs">
                        <p className="font-bold text-primary-500">Replay Position</p>
                        <p className="mt-1">Speed: {Math.round((currentReplayPoint.speed || 0) * 3.6)} km/h</p>
                        <p>Time: {new Date(currentReplayPoint.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400 dark:text-slate-600 rounded-2xl font-semibold">
                No route coordinates found for this range.
              </div>
            )}
          </div>
        </div>

        {/* Replay Controls / Timeline details */}
        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden h-[450px]">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <FastForward className="w-5 h-5 text-primary-500" /> Trip Movement Replay
          </h3>

          {locations.length > 0 ? (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Telemetry info during replay */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/20 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Replay Telemetry</span>
                  <span className="font-bold text-primary-500">Point {replayIndex + 1} of {locations.length}</span>
                </div>
                <div className="space-y-2.5 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> Instant Speed</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {currentReplayPoint ? `${Math.round((currentReplayPoint.speed || 0) * 3.6)} km/h` : '0 km/h'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Position Coords</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {currentReplayPoint ? `${currentReplayPoint.latitude.toFixed(5)}, ${currentReplayPoint.longitude.toFixed(5)}` : '0, 0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><FastForward className="w-3.5 h-3.5" /> Log Timestamp</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {currentReplayPoint ? new Date(currentReplayPoint.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Range Timeline Slider */}
              <div className="space-y-2 mt-4">
                <input
                  type="range"
                  min="0"
                  max={locations.length - 1}
                  value={replayIndex}
                  onChange={(e) => {
                    setIsReplaying(false);
                    setReplayIndex(Number(e.target.value));
                  }}
                  className="w-full accent-primary-500 cursor-pointer h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                  <span>Start</span>
                  <span>End</span>
                </div>
              </div>

              {/* Animation controllers */}
              <div className="flex flex-col gap-3 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                
                {/* Speed selector */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Playback Speed:</span>
                  <div className="flex bg-slate-50 dark:bg-slate-850 p-1 rounded-xl">
                    {[[400, '1x'], [200, '2x'], [80, '5x']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setPlaybackSpeed(val)}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                          playbackSpeed === val
                            ? 'bg-primary-500 text-white shadow-xs'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsReplaying(!isReplaying)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    {isReplaying ? (
                      <><Pause className="w-4 h-4" /> Pause</>
                    ) : (
                      <><Play className="w-4 h-4" /> Play Trip</>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsReplaying(false);
                      setReplayIndex(0);
                    }}
                    className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                    title="Reset Replay"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl p-6 text-center text-xs">
              <Info className="w-8 h-8 mb-2 text-slate-300 dark:text-slate-700" />
              <span>Perform history query on the map to unlock trip replay playback.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
