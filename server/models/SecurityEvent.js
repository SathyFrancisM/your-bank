import mongoose from 'mongoose';

const securityEventSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    sessionId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    route: { type: String, default: '' },
    previousRoute: { type: String, default: '' },
    score: { type: Number, default: 0 },
    delta: { type: Number, default: 0 },
    intent: { type: String, default: 'Normal' },
    intentDetail: { type: String, default: '' },
    action: { type: String, default: 'allow' },
    reason: { type: String, default: '' },
    warnings: { type: Number, default: 0 },
    blocked: { type: Boolean, default: false },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);