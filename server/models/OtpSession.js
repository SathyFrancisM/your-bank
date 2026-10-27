import mongoose from 'mongoose';

const otpSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 }
});

export const OtpSession = mongoose.models.OtpSession || mongoose.model('OtpSession', otpSessionSchema);