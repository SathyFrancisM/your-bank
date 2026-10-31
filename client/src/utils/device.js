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
      const timer = setTimeout(() => resolve(null), 2000);
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          clearTimeout(timer);
          resolve({ latitude: coords.latitude, longitude: coords.longitude });
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 2000, maximumAge: 60000 }
      );
    }),
    (() => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        return fetch('https://api.ipify.org?format=json', { signal: controller.signal })
          .then((response) => response.json())
          .catch(() => ({ ip: '127.0.0.1' }))
          .finally(() => clearTimeout(timeoutId));
      } catch {
        return Promise.resolve({ ip: '127.0.0.1' });
      }
    })()
  ]);

  return {
    location,
    ipAddress: ipResponse?.ip || '127.0.0.1',
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
