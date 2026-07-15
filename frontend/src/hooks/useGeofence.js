import { useState, useEffect, useCallback } from 'react';
import { getGeofences, createGeofence, updateGeofence, deleteGeofence } from '../api/geofences';

export function useGeofences() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGeofences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGeofences();
      setGeofences(Array.isArray(data) ? data : data.geofences || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch geofences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  const addGeofence = useCallback(async (geofenceData) => {
    const newGeofence = await createGeofence(geofenceData);
    setGeofences((prev) => [...prev, newGeofence]);
    return newGeofence;
  }, []);

  const editGeofence = useCallback(async (id, geofenceData) => {
    const updated = await updateGeofence(id, geofenceData);
    setGeofences((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  const removeGeofence = useCallback(async (id) => {
    await deleteGeofence(id);
    setGeofences((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return {
    geofences,
    loading,
    error,
    fetchGeofences,
    addGeofence,
    editGeofence,
    removeGeofence,
  };
}
