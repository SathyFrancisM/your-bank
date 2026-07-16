const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Edg/')) return 'Microsoft Edge';
  if (userAgent.includes('Chrome/')) return 'Google Chrome';
  if (userAgent.includes('Firefox/')) return 'Mozilla Firefox';
  if (userAgent.includes('Safari/')) return 'Safari';
  return 'Unknown Browser';
};

const detectOs = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS X')) return 'macOS';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Unknown OS';
};

const detectDevice = () => (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop');

export const collectLoginContext = async () => {
  const [location, ipResponse] = await Promise.all([
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }),
    fetch('https://api.ipify.org?format=json').then((response) => response.json()).catch(() => ({ ip: '' }))
  ]);

  return {
    location,
    ipAddress: ipResponse.ip || '',
    device: detectDevice(),
    browser: detectBrowser(),
    os: detectOs(),
    currentTime: new Date().toISOString(),
    currentDate: new Date().toLocaleDateString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    vpnDetected: false
  };
};
