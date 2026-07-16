import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    loanNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    emi: { type: Number, required: true },
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    riskScore: { type: Number, default: 0 },
    disbursedAt: Date,
    remarks: String
  },
  { timestamps: true }
);

export const Loan = mongoose.model('Loan', loanSchema);
