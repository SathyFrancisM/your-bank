import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const pointsToLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api\/?$/i.test(configuredApiUrl || '');
const apiBaseUrl = import.meta.env.PROD && pointsToLocalhost ? '/api' : configuredApiUrl || '/api';

const api = axios.create({
  baseURL: apiBaseUrl
});
let refreshPromise = null;

const clearStoredAuth = () => {
  sessionStorage.removeItem('bank_access_token');
  sessionStorage.removeItem('bank_refresh_token');
  sessionStorage.removeItem('bank_security_state');
  window.dispatchEvent(new Event('bank:auth-expired'));
};

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
  const isSecurityBypass = route.startsWith('/security') || route.includes('/auth/logout') || route.includes('/auth/me') || route.includes('/auth/refresh-token') || route.includes('/auth/employee-login') || route.includes('/auth/verify-otp') || route.includes('/auth/finalize-login');
  if (securityState?.blocked && !isSecurityBypass) {
    return Promise.reject(new Error('Session blocked by security policy'));
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const message = error.response?.data?.message || '';
    if (error.response?.status === 403 && /security policy violation/i.test(message)) {
      clearStoredAuth();
    }
    if (error.response?.status === 401) {
      const request = error.config;
      const route = String(request?.url || '');
      const isAuthFlow = ['/auth/employee-login', '/auth/verify-otp', '/auth/finalize-login', '/auth/refresh-token', '/auth/logout', '/auth/register']
        .some((path) => route.includes(path));

      if (request && !request._authRetry && !isAuthFlow) {
        const refreshToken = sessionStorage.getItem('bank_refresh_token');
        if (refreshToken) {
          request._authRetry = true;
          if (!refreshPromise) {
            refreshPromise = axios.post('/auth/refresh-token', { refreshToken }, { baseURL: api.defaults.baseURL })
              .then(({ data }) => {
                sessionStorage.setItem('bank_access_token', data.accessToken);
                sessionStorage.setItem('bank_refresh_token', data.refreshToken);
                window.dispatchEvent(new CustomEvent('bank:tokens-refreshed', { detail: data }));
                return data.accessToken;
              })
              .catch(() => null)
              .finally(() => {
                refreshPromise = null;
              });
          }

          const accessToken = await refreshPromise;
          if (accessToken) {
            request.headers = request.headers || {};
            request.headers.Authorization = `Bearer ${accessToken}`;
            return api(request);
          }
        }

        clearStoredAuth();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
