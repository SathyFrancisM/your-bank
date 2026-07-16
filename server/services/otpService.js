import { nanoid } from 'nanoid';

const otpSessions = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const cleanupExpiredOtpSessions = () => {
  const now = Date.now();
  for (const [sessionId, record] of otpSessions.entries()) {
    if (now > record.expiresAt) {
      otpSessions.delete(sessionId);
    }
  }
};

setInterval(cleanupExpiredOtpSessions, CLEANUP_INTERVAL_MS).unref();

export const createOtpSession = (payload) => {
  const sessionId = nanoid(18);
  const otp = generateOtp();
  otpSessions.set(sessionId, {
    ...payload,
    otp,
    expiresAt: Date.now() + OTP_TTL_MS
  });
  return { sessionId, otp };
};

export const verifyOtpSession = (sessionId, otp) => {
  const record = otpSessions.get(sessionId);
  if (!record) {
    return { ok: false, message: 'OTP session not found' };
  }

  if (Date.now() > record.expiresAt) {
    otpSessions.delete(sessionId);
    return { ok: false, message: 'OTP expired' };
  }

  if (String(record.otp) !== String(otp)) {
    return { ok: false, message: 'Invalid OTP' };
  }

  otpSessions.delete(sessionId);
  return { ok: true, payload: record };
};
