import api from './axios';

export async function getDevices() {
  const { data } = await api.get('/devices');
  return data;
}

export async function getDevice(id) {
  const { data } = await api.get(`/devices/${id}`);
  return data;
}

export async function createDevice(deviceData) {
  const { data } = await api.post('/devices', deviceData);
  return data;
}

export async function updateDevice(id, deviceData) {
  const { data } = await api.put(`/devices/${id}`, deviceData);
  return data;
}

export async function deleteDevice(id) {
  const { data } = await api.delete(`/devices/${id}`);
  return data;
}

export async function getDeviceStats() {
  const { data } = await api.get('/devices/stats');
  return data;
}
