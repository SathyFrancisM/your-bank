import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { nanoid } from 'nanoid';
import { demoMode } from '../config/db.js';
import { OtpSession } from '../models/OtpSession.js';

const otpSessions = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

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

  if (demoMode) {
    otpSessions.set(sessionId, record);
  } else {
    await OtpSession.create(record);
  }

  return { sessionId, otp };
};

export const verifyOtpSession = async (sessionId, otp) => {
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return { ok: false, message: 'Enter a valid 6-digit OTP' };
  }

  const record = demoMode
    ? otpSessions.get(sessionId)
    : await OtpSession.findOne({ sessionId }).lean();
  if (!record) {
    return { ok: false, message: 'OTP session not found' };
  }

  if (Date.now() > new Date(record.expiresAt).getTime()) {
    if (demoMode) {
      otpSessions.delete(sessionId);
    } else {
      await OtpSession.deleteOne({ sessionId });
    }
    return { ok: false, message: 'OTP expired' };
  }

  if (!matchesOtp(otp, record.otpHash)) {
    if (demoMode) {
      record.attempts += 1;
      if (record.attempts >= MAX_ATTEMPTS) {
        otpSessions.delete(sessionId);
        return { ok: false, message: 'Too many incorrect attempts. Start login again.' };
      }
    } else {
      const updated = await OtpSession.findOneAndUpdate(
        { sessionId, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
        { $inc: { attempts: 1 } },
        { new: true }
      ).lean();
      if (!updated || updated.attempts >= MAX_ATTEMPTS) {
        await OtpSession.deleteOne({ sessionId });
        return { ok: false, message: 'Too many incorrect attempts. Start login again.' };
      }
    }
    return { ok: false, message: 'Invalid OTP' };
  }

  const consumed = demoMode
    ? (otpSessions.delete(sessionId), record)
    : await OtpSession.findOneAndDelete({
      sessionId,
      otpHash: record.otpHash,
      expiresAt: { $gt: new Date() }
    }).lean();

  if (!consumed) {
    return { ok: false, message: 'OTP session has already been used or expired' };
  }

  return { ok: true, payload: consumed.payload };
};

export const deleteOtpSession = async (sessionId) => {
  if (demoMode) {
    otpSessions.delete(sessionId);
    return;
  }
  await OtpSession.deleteOne({ sessionId });
};
