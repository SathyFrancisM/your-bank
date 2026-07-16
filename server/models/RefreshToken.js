import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
