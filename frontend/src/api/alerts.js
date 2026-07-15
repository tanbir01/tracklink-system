import api from './axios';

export async function getAlerts(params = {}) {
  const { data } = await api.get('/alerts', { params });
  return data;
}

export async function getAlert(id) {
  const { data } = await api.get(`/alerts/${id}`);
  return data;
}

export async function markAlertRead(id) {
  const { data } = await api.patch('/alerts/read', { alert_ids: [id] });
  return data;
}

export async function markAllAlertsRead() {
  const { data } = await api.patch('/alerts/read-all');
  return data;
}

export async function deleteAlert(id) {
  const { data } = await api.delete(`/alerts/${id}`);
  return data;
}

export async function deleteReadAlerts() {
  const { data } = await api.delete('/alerts');
  return data;
}

