import { nanoid } from 'nanoid';

const loginSessions = new Map();

export const createLoginSession = (payload) => {
  const sessionId = nanoid(16);
  loginSessions.set(sessionId, { sessionId, ...payload, createdAt: new Date().toISOString() });
  return sessionId;
};

export const getLoginSession = (sessionId) => loginSessions.get(sessionId) || null;

export const updateLoginSession = (sessionId, patch) => {
  const current = loginSessions.get(sessionId);
  if (!current) {
    return null;
  }
  const next = { ...current, ...patch };
  loginSessions.set(sessionId, next);
  return next;
};

export const deleteLoginSession = (sessionId) => loginSessions.delete(sessionId);
