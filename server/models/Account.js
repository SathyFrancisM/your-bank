import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    type: { type: String, required: true, index: true },
    balance: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['Active', 'Frozen', 'Closed'], default: 'Active' },
    branch: String,
    openedBy: String,
    openedAt: Date,
    frozenAt: Date,
    freezeReason: String,
    nomination: String
  },
  { timestamps: true }
);

export const Account = mongoose.model('Account', accountSchema);
