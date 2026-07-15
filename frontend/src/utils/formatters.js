export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export function formatDistance(meters) {
  if (meters == null) return 'N/A';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatSpeed(speedKmh) {
  if (speedKmh == null) return 'N/A';
  return `${Math.round(speedKmh)} km/h`;
}

export function formatBattery(level) {
  if (level == null) return 'N/A';
  return `${Math.round(level)}%`;
}

export function formatCoordinate(lat, lng) {
  if (lat == null || lng == null) return 'N/A';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function getBatteryColor(level) {
  if (level == null) return 'text-dark-400';
  if (level > 60) return 'text-green-500';
  if (level > 30) return 'text-yellow-500';
  return 'text-red-500';
}

export function getBatteryBgColor(level) {
  if (level == null) return 'bg-dark-400';
  if (level > 60) return 'bg-green-500';
  if (level > 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getStatusColor(status) {
  switch (status) {
    case 'online': return 'text-green-500';
    case 'offline': return 'text-red-500';
    case 'idle': return 'text-yellow-500';
    default: return 'text-dark-400';
  }
}

export function getStatusBgColor(status) {
  switch (status) {
    case 'online': return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'offline': return 'bg-red-500/10 text-red-600 dark:text-red-400';
    case 'idle': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    default: return 'bg-dark-500/10 text-dark-600 dark:text-dark-400';
  }
}

export function truncate(str, maxLen = 30) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}
