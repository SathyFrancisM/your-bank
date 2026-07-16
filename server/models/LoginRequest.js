import mongoose from 'mongoose';

const loginRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    reason: [{ type: String }],
    location: { type: Object, default: {} },
    ipAddress: String,
    device: String,
    browser: String,
    os: String,
    timezone: String,
    officeMatch: Boolean,
    timeWindowMatch: Boolean,
    deviceMatch: Boolean,
    browserMatch: Boolean,
    riskScore: Number,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    managerDecision: String,
    approvedBy: String,
    rejectedBy: String,
    approvedAt: Date,
    rejectedAt: Date,
    loginSessionId: String
  },
  { timestamps: true }
);

export const LoginRequest = mongoose.model('LoginRequest', loginRequestSchema);
