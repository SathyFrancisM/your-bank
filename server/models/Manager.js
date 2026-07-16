import mongoose from 'mongoose';

const managerSchema = new mongoose.Schema(
  {
    managerId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    branch: String,
    department: String,
    approvalLimit: { type: Number, default: 500000 },
    status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' }
  },
  { timestamps: true }
);

export const Manager = mongoose.model('Manager', managerSchema);
