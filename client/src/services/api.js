import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const securityState = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('bank_security_state') || 'null');
    } catch {
      return null;
    }
  })();
  const token = sessionStorage.getItem('bank_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (securityState?.sessionId) {
    config.headers['X-Bank-Security-Session'] = securityState.sessionId;
    config.headers['X-Bank-Security-Score'] = String(securityState.score || 0);
  }
  const route = String(config.url || '');
  const isSecurityBypass = route.startsWith('/security') || route.includes('/auth/logout') || route.includes('/auth/me') || route.includes('/auth/refresh-token');
  if (securityState?.blocked && !isSecurityBypass) {
    return Promise.reject(new Error('Session blocked by security policy'));
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('bank_access_token');
      sessionStorage.removeItem('bank_refresh_token');
      sessionStorage.removeItem('bank_security_state');
    }
    return Promise.reject(error);
  }
);

export default api;
