export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  return { valid: true, message: '' };
}

export function validateRequired(value, fieldName = 'Field') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: '' };
}

export function validateLatitude(lat) {
  const num = parseFloat(lat);
  if (isNaN(num) || num < -90 || num > 90) {
    return { valid: false, message: 'Latitude must be between -90 and 90' };
  }
  return { valid: true, message: '' };
}

export function validateLongitude(lng) {
  const num = parseFloat(lng);
  if (isNaN(num) || num < -180 || num > 180) {
    return { valid: false, message: 'Longitude must be between -180 and 180' };
  }
  return { valid: true, message: '' };
}

export function validateRadius(radius) {
  const num = parseFloat(radius);
  if (isNaN(num) || num <= 0) {
    return { valid: false, message: 'Radius must be a positive number' };
  }
  return { valid: true, message: '' };
}
