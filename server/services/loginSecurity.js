import { env } from '../config/env.js';
import { demoMode } from '../config/db.js';
import { geoDistanceKm, isPrivateIp, isWithinOfficeHours } from '../utils/geo.js';

export const evaluateLoginSecurity = ({ employee, device, browser, ipAddress, location, timestamp, timezone, vpnDetected = false }) => {
  const currentDate = new Date(timestamp || Date.now());
  const currentHour = currentDate.getHours();
  const officeLatitude = employee.officeLocation?.latitude ?? env.OFFICE_LATITUDE;
  const officeLongitude = employee.officeLocation?.longitude ?? env.OFFICE_LONGITUDE;
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
  const distanceKm = hasLocation ? geoDistanceKm(officeLatitude, officeLongitude, latitude, longitude) : Number.POSITIVE_INFINITY;
  const officeMatch = hasLocation && distanceKm <= env.OFFICE_RADIUS_KM;
  const timeWindowMatch = isWithinOfficeHours(currentHour, env.OFFICE_START_HOUR, env.OFFICE_END_HOUR);
  const deviceMatch = !employee.lastKnownDevice || employee.lastKnownDevice === device;
  const browserMatch = !employee.lastKnownBrowser || employee.lastKnownBrowser === browser;
  const ipKnown = ipAddress && !isPrivateIp(ipAddress);
  const reasons = [];

  if (demoMode && ['Admin', 'Manager'].includes(employee.role)) {
    return {
      allowImmediately: true,
      reasons: [],
      officeMatch: true,
      timeWindowMatch: true,
      deviceMatch: true,
      browserMatch: true,
      distanceKm: 0,
      riskSignals: {
        officeMatch: true,
        timeWindowMatch: true,
        deviceMatch: true,
        browserMatch: true,
        vpnDetected: false,
        ipKnown: true,
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }

  if (!officeMatch) reasons.push('Outside Office');
  if (!timeWindowMatch) reasons.push('Late Night');
  if (!deviceMatch) reasons.push('Different Device');
  if (!browserMatch) reasons.push('Different Browser');
  if (vpnDetected) reasons.push('VPN');
  if (!ipKnown) reasons.push('Unknown IP');

  const allowImmediately = officeMatch && timeWindowMatch && deviceMatch && browserMatch && !vpnDetected && ipKnown;

  return {
    allowImmediately,
    reasons,
    officeMatch,
    timeWindowMatch,
    deviceMatch,
    browserMatch,
    distanceKm: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(2)) : null,
    riskSignals: {
      officeMatch,
      timeWindowMatch,
      deviceMatch,
      browserMatch,
      vpnDetected,
      ipKnown,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };
};
