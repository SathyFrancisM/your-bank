import mongoose from 'mongoose';

const rdSchema = new mongoose.Schema(
  {
    rdNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    monthlyDeposit: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    maturityAmount: { type: Number, required: true },
    maturityDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Matured', 'Closed'], default: 'Active' },
    createdBy: String
  },
  { timestamps: true }
);

export const Rd = mongoose.model('Rd', rdSchema);
