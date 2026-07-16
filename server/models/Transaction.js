import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    accountNumber: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    channel: { type: String, required: true },
    amount: { type: Number, required: true },
    narration: String,
    status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Success' },
    balanceBefore: Number,
    balanceAfter: Number,
    beneficiary: String,
    createdBy: String,
    branch: String,
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
