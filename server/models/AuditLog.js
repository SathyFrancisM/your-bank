import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, required: true, index: true },
    actorRole: { type: String, required: true },
    employeeName: String,
    action: { type: String, required: true },
    module: { type: String, required: true },
    entityType: String,
    entityId: String,
    ipAddress: String,
    device: String,
    browser: String,
    os: String,
    location: { type: Object, default: {} },
    riskScore: Number,
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
