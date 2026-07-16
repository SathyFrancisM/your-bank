import mongoose from 'mongoose';

const accountSnapshotSchema = new mongoose.Schema(
  {
    accountNumber: String,
    type: String,
    status: String,
    balance: Number
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    aadhaar: { type: String, required: true, index: true },
    pan: { type: String, required: true, index: true },
    photoUrl: String,
    kycStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Verified' },
    address: String,
    city: String,
    email: String,
    accounts: [accountSnapshotSchema],
    cards: [{ cardType: String, maskedCardNumber: String, status: String }],
    upiId: String,
    tags: [String],
    notes: String
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);
