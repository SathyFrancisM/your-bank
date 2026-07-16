import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

const AuthContext = createContext(null);

const read = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => read('bank_user'));
  const [tokens, setTokens] = useState(() => ({
    accessToken: localStorage.getItem('bank_access_token'),
    refreshToken: localStorage.getItem('bank_refresh_token')
  }));
  const [loginState, setLoginState] = useState(() => read('bank_login_state', null));
  const [notifications, setNotifications] = useState([]);
  const [recordingActive, setRecordingActive] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  useEffect(() => {
    if (tokens.accessToken) {
      const socket = connectSocket(tokens.accessToken);
      socket.on('notification', (payload) => setNotifications((current) => [payload, ...current].slice(0, 10)));
      socket.on('recording:start', () => setRecordingActive(true));
      socket.on('recording:stop', () => setRecordingActive(false));
      return () => {
        socket.off('notification');
        socket.off('recording:start');
        socket.off('recording:stop');
      };
    }
    disconnectSocket();
    return undefined;
  }, [tokens.accessToken]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bank_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bank_user');
    }
  }, [user]);

  useEffect(() => {
    if (loginState) {
      localStorage.setItem('bank_login_state', JSON.stringify(loginState));
    } else {
      localStorage.removeItem('bank_login_state');
    }
  }, [loginState]);

  const persistTokens = (nextTokens) => {
    setTokens(nextTokens);
    localStorage.setItem('bank_access_token', nextTokens.accessToken);
    localStorage.setItem('bank_refresh_token', nextTokens.refreshToken);
  };

  const login = async (payload) => {
    const response = await api.post('/auth/employee-login', payload);
    setLoginState(response.data);
    return response.data;
  };

  const verifyOtp = async (payload) => {
    const response = await api.post('/auth/verify-otp', payload);
    if (response.data.authenticated) {
      setUser(response.data.employee);
      persistTokens({ accessToken: response.data.accessToken, refreshToken: response.data.refreshToken });
      setLoginState(null);
      setRecordingActive(true);
    } else {
      setLoginState(response.data);
    }
    return response.data;
  };

  const finalizeLogin = async (loginRequestId) => {
    const response = await api.post(`/auth/finalize-login/${loginRequestId}`);
    setUser(response.data.employee);
    persistTokens({ accessToken: response.data.accessToken, refreshToken: response.data.refreshToken });
    setLoginState(null);
    setRecordingActive(true);
    return response.data;
  };

  const logout = async (payload = {}) => {
    try {
      await api.post('/auth/logout', { ...payload, refreshToken: tokens.refreshToken });
    } catch {
      // ignore logout transport errors
    }
    setUser(null);
    setTokens({ accessToken: null, refreshToken: null });
    setLoginState(null);
    setRecordingActive(false);
    localStorage.removeItem('bank_access_token');
    localStorage.removeItem('bank_refresh_token');
    localStorage.removeItem('bank_login_state');
    localStorage.removeItem('bank_user');
    disconnectSocket();
  };

  const refresh = async () => {
    if (!tokens.refreshToken) {
      return null;
    }
    const response = await api.post('/auth/refresh-token', { refreshToken: tokens.refreshToken });
    persistTokens(response.data);
    return response.data;
  };

  const value = useMemo(() => ({
    user,
    tokens,
    loginState,
    notifications,
    recordingActive,
    loadingSession,
    setLoadingSession,
    setNotifications,
    login,
    verifyOtp,
    finalizeLogin,
    logout,
    refresh,
    isAuthenticated: Boolean(user && tokens.accessToken)
  }), [user, tokens, loginState, notifications, recordingActive, loadingSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
