export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  IDLE: 'idle',
};

export const ALERT_TYPES = {
  GEOFENCE_ENTER: 'geofence_enter',
  GEOFENCE_EXIT: 'geofence_exit',
  LOW_BATTERY: 'low_battery',
  SPEED_LIMIT: 'speed_limit',
  SOS: 'sos',
  DEVICE_OFFLINE: 'device_offline',
};

export const ALERT_TYPE_LABELS = {
  geofence_enter: 'Geofence Entry',
  geofence_exit: 'Geofence Exit',
  low_battery: 'Low Battery',
  speed_limit: 'Speed Limit Exceeded',
  sos: 'SOS Alert',
  device_offline: 'Device Offline',
};

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const MAP_CONFIG = {
  defaultCenter: [23.8103, 90.4125],
  defaultZoom: 13,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  darkTileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/map', label: 'Live Map', icon: 'Map' },
  { path: '/devices', label: 'Devices', icon: 'Smartphone' },
  { path: '/history', label: 'History', icon: 'History' },
  { path: '/geofences', label: 'Geofences', icon: 'Circle' },
  { path: '/alerts', label: 'Alerts', icon: 'Bell' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];

export const CHART_COLORS = {
  primary: '#3B82F6',
  primaryLight: '#93C5FD',
  success: '#22C55E',
  warning: '#EAB308',
  danger: '#EF4444',
  info: '#06B6D4',
  gray: '#94A3B8',
};
