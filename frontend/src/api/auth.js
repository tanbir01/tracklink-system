import api from './axios';

export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const { data } = await api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

export async function register(userData) {
  const { data } = await api.post('/auth/register', userData);
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

export async function refreshToken(refresh_token) {
  const { data } = await api.post('/auth/refresh', { refresh_token });
  return data;
}

export async function getProfile() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function updateProfile(profileData) {
  const { data } = await api.put('/auth/me', profileData);
  return data;
}
