import api from './axios';

export async function getGeofences() {
  const { data } = await api.get('/geofences');
  return data;
}

export async function getGeofence(id) {
  const { data } = await api.get(`/geofences/${id}`);
  return data;
}

export async function createGeofence(geofenceData) {
  const { data } = await api.post('/geofences', geofenceData);
  return data;
}

export async function updateGeofence(id, geofenceData) {
  const { data } = await api.put(`/geofences/${id}`, geofenceData);
  return data;
}

export async function deleteGeofence(id) {
  const { data } = await api.delete(`/geofences/${id}`);
  return data;
}
