import React, { useEffect, useState } from 'react';
import { useMapEvents, Marker, Circle } from 'react-leaflet';
import { getGeofences, createGeofence, updateGeofence, deleteGeofence } from '../api/geofences';
import MapContainer from '../components/map/MapContainer';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Plus, Trash2, Edit3, Map, Check, X, ShieldAlert, CircleDot } from 'lucide-react';
import L from 'leaflet';

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

export default function Geofence() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState(23.8103);
  const [longitude, setLongitude] = useState(90.4125);
  const [radius, setRadius] = useState(500); // meters

  const [mapClicked, setMapClicked] = useState(false);

  const fetchFences = async () => {
    try {
      setLoading(true);
      const data = await getGeofences();
      setGeofences(data.geofences || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFences();
  }, []);

  const handleMapClick = (latlng) => {
    setLatitude(latlng.lat);
    setLongitude(latlng.lng);
    setMapClicked(true);
    // Open modal directly on click to streamline geofence creation!
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createGeofence({
        name,
        latitude,
        longitude,
        radius_meters: Number(radius)
      });
      setIsAddOpen(false);
      setName('');
      setMapClicked(false);
      fetchFences();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create geofence.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (fence) => {
    try {
      // In the backend PATCH /api/geofences/{id}/toggle is mapped to toggling
      await updateGeofence(fence.id, { is_enabled: !fence.is_enabled });
      // update state locally
      setGeofences(prev => prev.map(f => f.id === fence.id ? { ...f, is_enabled: !f.is_enabled } : f));
    } catch (err) {
      console.error(err);
      // fallback toggle route: backend uses PUT /api/geofences/{id}/toggle or update endpoint
      try {
        await updateGeofence(fence.id, { ...fence, is_enabled: !fence.is_enabled });
        setGeofences(prev => prev.map(f => f.id === fence.id ? { ...f, is_enabled: !f.is_enabled } : f));
      } catch (e) {
        alert("Failed to toggle geofence.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this geofence? Connected alert logs will remain, but boundaries will be destroyed.")) {
      try {
        await deleteGeofence(id);
        setGeofences(prev => prev.filter(f => f.id !== id));
      } catch (err) {
        alert("Failed to delete geofence.");
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Plotting geofence coordinates..." fullScreen />;
  }

  // Set default pin icon
  const pinIcon = L.divIcon({
    className: 'pin-marker-icon',
    html: `<div class="h-6 w-6 rounded-full border-2 border-white bg-primary-500 shadow-md"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const mapCenter = geofences.length > 0 
    ? [geofences[0].latitude, geofences[0].longitude] 
    : [23.8103, 90.4125];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title block */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Geofences Safezones</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Set geographic boundaries and configure custom access alarm rules.</p>
      </div>

      {/* Grid: Map & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Map interface */}
        <div className="lg:col-span-2 flex flex-col h-[480px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Boundary Map Configuration</h3>
            <span className="text-[10px] uppercase font-bold text-primary-500 bg-primary-500/10 px-3 py-1 rounded-xl">
              Click anywhere on the map to set a geofence
            </span>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden min-h-0 relative">
            <MapContainer center={mapCenter} zoom={12}>
              {/* Click listener */}
              <MapClickHandler onClick={handleMapClick} />

              {/* Render existing fences */}
              {geofences.map(fence => (
                fence.is_enabled && (
                  <Circle
                    key={fence.id}
                    center={[fence.latitude, fence.longitude]}
                    radius={fence.radius_meters}
                    pathOptions={{ color: '#3B82F6', fillColor: '#93C5FD', fillOpacity: 0.2, weight: 2 }}
                  />
                )
              ))}

              {/* Temp creation marker */}
              {mapClicked && (
                <>
                  <Marker position={[latitude, longitude]} icon={pinIcon} />
                  <Circle
                    center={[latitude, longitude]}
                    radius={radius}
                    pathOptions={{ color: '#F59E0B', fillColor: '#FDE68A', fillOpacity: 0.25, weight: 2, dashArray: '5,5' }}
                  />
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Geofences list */}
        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[480px] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CircleDot className="w-5 h-5 text-primary-500" /> Geofences ({geofences.length})
            </h3>
            <button
              onClick={() => { setMapClicked(false); setIsAddOpen(true); }}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-xs transition-all duration-200"
              title="Add Geofence"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {geofences.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl p-6">
                <Map className="w-8 h-8 mx-auto mb-2 text-slate-350" />
                <span>No geofences established yet. Click on the map to define your boundaries.</span>
              </div>
            ) : (
              geofences.map(fence => (
                <div key={fence.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/20 text-xs">
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-800 dark:text-white">{fence.name}</h5>
                    <p className="text-[10px] text-slate-400">Radius: {fence.radius_meters}m</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Toggle status */}
                    <button
                      onClick={() => handleToggle(fence)}
                      className={`h-5 w-9 rounded-full relative transition-all duration-300 ${
                        fence.is_enabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all duration-300 ${
                        fence.is_enabled ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>

                    {/* Delete action */}
                    <button
                      onClick={() => handleDelete(fence.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add Geofence Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Establish New Geofence">
        <form onSubmit={handleAddSubmit} className="space-y-4 font-sans text-xs">
          {error && (
            <p className="text-xs text-rose-500 font-semibold bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-slate-400">Safezone Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home Safezone"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] uppercase font-bold text-slate-400 font-sans">Radius (meters): {radius}m</label>
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-primary-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all"
            >
              {submitting ? 'Creating...' : 'Establish Geofence'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
