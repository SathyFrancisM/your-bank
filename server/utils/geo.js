export const geoDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
};

export const isWithinOfficeHours = (hour, startHour = 9, endHour = 18) => hour >= startHour && hour < endHour;

export const isPrivateIp = (ipAddress = '') => {
  const value = String(ipAddress);
  return value.startsWith('10.') || value.startsWith('127.') || value.startsWith('192.168.') || value.startsWith('172.16.') || value.startsWith('::1');
};
