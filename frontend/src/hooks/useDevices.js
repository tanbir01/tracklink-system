import { useState, useEffect, useCallback } from 'react';
import { getDevices, getDevice, createDevice, updateDevice, deleteDevice } from '../api/devices';

export function useDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDevices();
      setDevices(Array.isArray(data) ? data : data.devices || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const addDevice = useCallback(async (deviceData) => {
    const newDevice = await createDevice(deviceData);
    setDevices((prev) => [...prev, newDevice]);
    return newDevice;
  }, []);

  const editDevice = useCallback(async (id, deviceData) => {
    const updated = await updateDevice(id, deviceData);
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  }, []);

  const removeDevice = useCallback(async (id) => {
    await deleteDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return {
    devices,
    loading,
    error,
    fetchDevices,
    addDevice,
    editDevice,
    removeDevice,
  };
}

export function useDevice(id) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevice = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDevice(id);
      setDevice(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch device');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  return { device, loading, error, refetch: fetchDevice };
}
