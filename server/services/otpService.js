import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { nanoid } from 'nanoid';
import * as db from '../config/db.js';
import { OtpSession } from '../models/OtpSession.js';

const otpSessions = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// Always read demoMode dynamically via db module to avoid stale closure
const isDemoMode = () => db.demoMode;

const generateOtp = () => String(randomInt(100000, 1000000));
const hashOtp = (otp) => createHash('sha256').update(otp).digest('hex');
const matchesOtp = (otp, otpHash) => timingSafeEqual(
  Buffer.from(hashOtp(otp), 'hex'),
  Buffer.from(otpHash, 'hex')
);

const cleanupExpiredOtpSessions = () => {
  const now = Date.now();
  for (const [sessionId, record] of otpSessions.entries()) {
    if (now > record.expiresAt.getTime()) {
      otpSessions.delete(sessionId);
    }
  }
};

setInterval(cleanupExpiredOtpSessions, CLEANUP_INTERVAL_MS).unref();

export const createOtpSession = async (payload) => {
  const sessionId = nanoid(18);
  const otp = generateOtp();
  const record = {
    sessionId,
    payload,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0
  };

  if (isDemoMode()) {
    otpSessions.set(sessionId, record);
  } else {
    try {
      await OtpSession.create(record);
    } catch (err) {
      // Fallback to in-memory if DB write fails
      console.warn('[OTP] DB create failed, using in-memory store:', err.message);
      otpSessions.set(sessionId, record);
    }
  }

  return { sessionId, otp };
};

export const verifyOtpSession = async (sessionId, otp) => {
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return { ok: false, message: 'Enter a valid 6-digit OTP' };
  }

  // Always check in-memory first (covers demo mode AND DB fallback cases)
  let record = otpSessions.get(sessionId);
  let fromMemory = Boolean(record);

  if (!record && !isDemoMode()) {
    try {
      record = await OtpSession.findOne({ sessionId }).lean();
    } catch (err) {
      console.warn('[OTP] DB lookup failed:', err.message);
    }
  }

  if (!record) {
    return { ok: false, message: 'OTP session not found' };
  }

  if (Date.now() > new Date(record.expiresAt).getTime()) {
    if (fromMemory) {
      otpSessions.delete(sessionId);
    } else {
      try { await OtpSession.deleteOne({ sessionId }); } catch { /* ignore */ }
    }
    return { ok: false, message: 'OTP expired' };
  }

  if (!matchesOtp(otp, record.otpHash)) {
    if (fromMemory) {
      record.attempts += 1;
      if (record.attempts >= MAX_ATTEMPTS) {
        otpSessions.delete(sessionId);
        return { ok: false, message: 'Too many incorrect attempts. Start login again.' };
      }
    } else {
      try {
        const updated = await OtpSession.findOneAndUpdate(
          { sessionId, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
          { $inc: { attempts: 1 } },
          { new: true }
        ).lean();
        if (!updated || updated.attempts >= MAX_ATTEMPTS) {
          await OtpSession.deleteOne({ sessionId });
          return { ok: false, message: 'Too many incorrect attempts. Start login again.' };
        }
      } catch (err) {
        console.warn('[OTP] DB attempt update failed:', err.message);
      }
    }
    return { ok: false, message: 'Invalid OTP' };
  }

  // Consume the session
  let consumed = null;
  if (fromMemory) {
    consumed = record;
    otpSessions.delete(sessionId);
  } else {
    try {
      consumed = await OtpSession.findOneAndDelete({
        sessionId,
        otpHash: record.otpHash,
        expiresAt: { $gt: new Date() }
      }).lean();
    } catch (err) {
      console.warn('[OTP] DB delete failed:', err.message);
      consumed = record;
    }
  }

  if (!consumed) {
    return { ok: false, message: 'OTP session has already been used or expired' };
  }

  return { ok: true, payload: consumed.payload };
};

export const deleteOtpSession = async (sessionId) => {
  otpSessions.delete(sessionId);
  if (!isDemoMode()) {
    try {
      await OtpSession.deleteOne({ sessionId });
    } catch { /* ignore */ }
  }
};
