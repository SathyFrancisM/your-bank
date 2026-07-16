import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
    address: String
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Manager', 'Teller', 'Auditor'], required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    department: String,
    branch: String,
    status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
    permissions: [{ type: String }],
    officeLocation: locationSchema,
    lastKnownDevice: String,
    lastKnownBrowser: String,
    lastKnownIpAddress: String,
    lastLoginAt: Date,
    failedLoginCount: { type: Number, default: 0 },
    screenRecordingEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Employee = mongoose.model('Employee', employeeSchema);
