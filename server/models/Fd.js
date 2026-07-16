import mongoose from 'mongoose';

const fdSchema = new mongoose.Schema(
  {
    fdNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    maturityAmount: { type: Number, required: true },
    maturityDate: { type: Date, required: true },
    lockPeriodMonths: { type: Number, default: 6 },
    status: { type: String, enum: ['Active', 'Matured', 'Prematurely Closed'], default: 'Active' },
    createdBy: String,
    prematureWithdrawalAllowed: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Fd = mongoose.model('Fd', fdSchema);
