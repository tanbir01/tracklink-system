import api from './axios';

export async function getLocationHistory(deviceId, params = {}) {
  const { data } = await api.get(`/locations/device/${deviceId}/history`, { params });
  return data;
}

export async function getLatestLocation(deviceId) {
  const { data } = await api.get(`/locations/device/${deviceId}/latest`);
  return data;
}

export async function getAllLatestLocations() {
  const { data } = await api.get('/locations/latest');
  return data;
}

export async function exportLocationHistory(deviceId, params = {}) {
  const { data } = await api.get(`/locations/device/${deviceId}/export`, {
    params,
    responseType: 'blob',
  });
  return data;
}

