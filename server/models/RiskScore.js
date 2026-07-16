import mongoose from 'mongoose';

const riskScoreSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    employeeName: { type: String, required: true },
    score: { type: Number, required: true, default: 0 },
    level: { type: String, enum: ['Safe', 'Medium', 'High Risk'], default: 'Safe' },
    reasons: [{ type: String }],
    suggestedAction: String,
    recentSignals: { type: Object, default: {} },
    updatedAtSource: String
  },
  { timestamps: true }
);

export const RiskScore = mongoose.model('RiskScore', riskScoreSchema);
