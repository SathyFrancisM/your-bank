export const officeDistanceKm = (office, current) => {
  if (!office || !current) return null;
  const earth = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(current.latitude - office.latitude);
  const dLon = toRad(current.longitude - office.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(office.latitude)) * Math.cos(toRad(current.latitude)) * Math.sin(dLon / 2) ** 2;
  return Number((2 * earth * Math.asin(Math.sqrt(a))).toFixed(2));
};
